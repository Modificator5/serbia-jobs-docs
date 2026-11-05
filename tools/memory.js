#!/usr/bin/env node
// Индекс памяти: задачи (memory/tasks.jsonl) + журнал обменов (logs/ask-journal.jsonl).
// Экономия токенов: сначала ищем, что уже делали/спрашивали, и только потом генерируем.
// Использование:
//   node tools/memory.js search "термин" [тег]   — поиск по задачам и журналу
//   node tools/memory.js list [тег]              — задачи (новые первыми)
//   node tools/memory.js context "термин"        — до 3 прошлых обменов для промпта
//   node tools/memory.js add SOLVED "задача" [--tags a,b] [--refs path,URL]
const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.env.ASK_ROOT || path.join(__dirname, "..");
const MEMORY = process.env.MEMORY_FILE || path.join(ROOT, "memory", "tasks.jsonl");
const JOURNAL = process.env.JOURNAL_FILE || path.join(ROOT, "logs", "ask-journal.jsonl");
const EVENTS = process.env.JOURNAL_EVENTS || path.join(ROOT, "journal", "events.jsonl");
const STATUSES = ["SOLVED", "TRIED", "REJECTED", "PENDING"];
const MAX_CONTEXT_ENTRIES = 3;
const MAX_CONTEXT_CHARS = 500;

function readJsonl(file) {
  if (!fs.existsSync(file)) return [];
  return fs
    .readFileSync(file, "utf8")
    .split("\n")
    .filter((l) => l.trim())
    .map((l, i) => {
      try {
        return { ...JSON.parse(l), _line: i + 1 };
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function expired(entry) {
  if (!entry.volatile) return false;
  const exp = String(entry.volatile);
  return /^\d{4}-\d{2}-\d{2}$/.test(exp) && exp < new Date().toISOString().slice(0, 10);
}

function loadTasks() {
  return readJsonl(MEMORY).map((e) => ({
    source: "memory",
    _line: e._line,
    date: e.date || "",
    text: `${e.task} ${(e.tags || []).join(" ")} ${(e.refs || []).join(" ")} ${e.status}`,
    title: `[${e.status}] ${e.date || ""}`,
    body: e.task || "",
    tags: e.tags || [],
    refs: e.refs || [],
    status: e.status,
    raw: e,
  }));
}

function loadJournal() {
  return readJsonl(JOURNAL)
    .filter((e) => !expired(e))
    .map((e) => ({
      source: "journal",
      _line: e._line,
      date: String(e.ts || "").slice(0, 10),
      text: `${e.role || ""} ${e.provider || ""} ${e.model_requested || ""} ${(e.tags || []).join(" ")} ${e.prompt || ""} ${e.answer || ""}`,
      title: `${e.ts || ""} ${e.role || e.provider || ""}`,
      body: `Q: ${e.prompt || ""}\nA: ${e.answer || ""}`,
      tags: e.tags || [],
      refs: [],
      status: e.outcome,
      raw: e,
    }));
}

// Курируемый журнал (journal/events.jsonl) входит в git и дополняет сырой
// logs/ask-journal.jsonl: короткие записи ищутся быстрее и не дублируются.
function loadEvents() {
  return readJsonl(EVENTS).map((e) => ({
    source: "event",
    _line: e._line,
    date: String(e.ts || "").slice(0, 10),
    text: `${e.type || ""} ${e.title || ""} ${e.question || ""} ${e.text || ""} ${(e.tags || []).join(" ")} ${(e.refs || []).join(" ")}`,
    title: `[${e.type || "event"}] ${e.title || ""}`,
    body: `${e.question ? `Q: ${e.question}\n` : ""}A: ${e.text || ""}`,
    tags: e.tags || [],
    refs: e.refs || [],
    status: e.outcome,
    raw: e,
  }));
}

function matches(entry, tokens, tag) {
  if (tag && !(entry.status === tag || (entry.tags || []).includes(tag))) return false;
  const hay = String(entry.text).toLowerCase();
  return tokens.every((t) => hay.includes(t));
}

function printEntry(e) {
  const tags = (e.tags || []).join(", ");
  const refs = (e.refs || []).join(", ");
  console.log(`${e.title} (${e.source}, запись ${e._line})`);
  const lines = String(e.body || "").split("\n").filter((l) => l.trim());
  lines.forEach((l, i) => console.log(`    ${l}`));
  if (tags) console.log(`    теги: ${tags}`);
  if (refs) console.log(`    refs: ${refs}`);
}

function search(words, tag) {
  const entries = [...loadTasks(), ...loadEvents(), ...loadJournal()];
  const tokens = String(words).toLowerCase().split(/\s+/).filter(Boolean);
  const hits = entries.filter((e) => matches(e, tokens, tag));
  if (!hits.length) {
    console.log(
      `Совпадений нет (задач: ${loadTasks().length}, событий: ${loadEvents().length}, ` +
        `журнал: ${loadJournal().length}). Генерируй заново и запиши результат.`
    );
    return; // exit 0: отсутствие совпадений — не ошибка
  }
  console.log(`Найдено ${hits.length}:`);
  hits.forEach(printEntry);
}

// До 3 прошлых обменов, обрезанных до MAX_CONTEXT_CHARS, для вставки в промпт.
function context(words) {
  const tokens = String(words || "").toLowerCase().split(/\s+/).filter(Boolean);
  const hits = loadJournal()
    .filter((e) => matches(e, tokens, null))
    .slice(-MAX_CONTEXT_ENTRIES);
  if (!hits.length) {
    console.log("Контекст: совпадений нет.");
    return;
  }
  for (const e of hits) {
    const body =
      e.body.length > MAX_CONTEXT_CHARS ? `${e.body.slice(0, MAX_CONTEXT_CHARS)}…` : e.body;
    console.log(`--- ${e.title} ---`);
    console.log(body);
  }
}

function list(tag) {
  const entries = loadTasks().filter((e) => !tag || e.status === tag);
  if (!entries.length) console.log("Память пуста.");
  entries.forEach(printEntry);
}

function add(status, task, flags) {
  if (!STATUSES.includes(status)) {
    console.error(`Статус должен быть одним из: ${STATUSES.join(", ")}`);
    process.exit(2);
  }
  if (!task) {
    console.error("Нужен текст задачи.");
    process.exit(2);
  }
  const entry = {
    date: new Date().toISOString().slice(0, 10),
    status,
    task,
    tags: flags.tags || [],
    refs: flags.refs || [],
  };
  fs.mkdirSync(path.dirname(MEMORY), { recursive: true });
  fs.appendFileSync(MEMORY, JSON.stringify(entry) + "\n", "utf8");
  console.log(`Записано [${status}]: ${task}`);
}

function parseFlags(args) {
  const flags = { tags: [], refs: [] };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--tags" && args[i + 1]) flags.tags = args[++i].split(",").map((s) => s.trim()).filter(Boolean);
    else if (args[i] === "--refs" && args[i + 1]) flags.refs = args[++i].split(",").map((s) => s.trim()).filter(Boolean);
  }
  return flags;
}

const [cmd, ...rest] = process.argv.slice(2);
switch (cmd) {
  case "search":
    if (!rest[0]) { console.error("Укажи поисковые слова"); process.exit(2); }
    search(rest[0], rest[1]);
    break;
  case "context":
    if (!rest[0]) { console.error("Укажи поисковые слова"); process.exit(2); }
    context(rest[0]);
    break;
  case "list":
    list(rest[0]);
    break;
  case "add":
    add(rest[0], rest[1], parseFlags(rest.slice(2)));
    break;
  default:
    console.log("Память задач.\n  search \"слова\" [тег] | context \"слова\" | list [тег] | add SOLVED \"задача\" [--tags a,b] [--refs x,y]");
    process.exit(cmd ? 2 : 0);
}
