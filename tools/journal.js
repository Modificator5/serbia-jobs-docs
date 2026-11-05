#!/usr/bin/env node
// Курируемый журнал проекта: что делали, какие ответы ИИ пригодились.
// Сырые логи (logs/, .ai_memory/) остаются локальными и в git не входят.
// В git едет только journal/events.jsonl — короткие записи с тегами.
//
// Использование:
//   node tools/journal.js add "текст" [--type note] [--tags a,b] [--refs path,URL]
//   node tools/journal.js ingest [--from logs/ask-journal.jsonl] [--limit N]
//   node tools/journal.js search "слова" [--tag tag]
//   node tools/journal.js list [--tag tag] [--limit N]
//   node tools/journal.js stats
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const ROOT = process.env.JOURNAL_ROOT || path.join(__dirname, "..");
const EVENTS = process.env.JOURNAL_EVENTS || path.join(ROOT, "journal", "events.jsonl");
const TASKS = process.env.MEMORY_FILE || path.join(ROOT, "memory", "tasks.jsonl");
const RAW = process.env.JOURNAL_FILE || path.join(ROOT, "logs", "ask-journal.jsonl");

const MAX_EVENT_TEXT = 4000;
const MAX_QUESTION = 400;
const MAX_TITLE = 140;
const DEFAULT_INGEST_LIMIT = 500;

function readJsonl(file) {
  if (!fs.existsSync(file)) return [];
  return fs
    .readFileSync(file, "utf8")
    .split("\n")
    .filter((line) => line.trim())
    .map((line, index) => {
      try {
        return { ...JSON.parse(line), _line: index + 1 };
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function appendJsonl(file, rows) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.appendFileSync(file, rows.map((r) => JSON.stringify(r)).join("\n") + "\n", "utf8");
}

function clip(text, n) {
  const s = String(text || "").replace(/\s+/g, " ").trim();
  return s.length <= n ? s : `${s.slice(0, Math.max(0, n - 1)).trimEnd()}…`;
}

// Заголовок события: у промптов воркера в начале большой системный текст,
// поэтому берём последнюю задачу, а не первые символы.
function titleFromPrompt(prompt) {
  const text = String(prompt || "");
  for (const marker of ["Задача:", "Task:", "Вопрос:", "Question:"]) {
    const at = text.lastIndexOf(marker);
    if (at !== -1) {
      const tail = text.slice(at + marker.length);
      const clean = tail.split(/\n---|\nОбязательный формат|\nТолько minified/)[0];
      if (clean.trim()) return clip(clean, MAX_TITLE);
    }
  }
  return clip(text, MAX_TITLE) || "(без описания)";
}

const TAG_RULES = [
  [/перев|translat/i, "translation"],
  [/термин|словар|glossar/i, "glossary"],
  [/парс|scrape|ваканс|jobs\.db/i, "scraping"],
  [/telegram|публик|publish/i, "telegram"],
  [/sql|sqlite|база|database|\bdb\b/i, "db"],
  [/код|function|javascript|python|рефактор/i, "code"],
  [/тест|test|провер/i, "tests"],
  [/git|коммит|commit|push/i, "git"],
  [/ошибк|error|баг|bug|упал/i, "bug"],
];

function inferTags(text) {
  const tags = [];
  for (const [re, tag] of TAG_RULES) {
    if (re.test(text)) tags.push(tag);
  }
  return tags;
}

function eventHash(promptHash, answer) {
  return crypto
    .createHash("sha256")
    .update(`${promptHash || ""}\n${answer || ""}`)
    .digest("hex")
    .slice(0, 32);
}

// Превращает сырой обмен из logs/ask-journal.jsonl в короткую курируемую запись.
function toEvent(entry) {
  const answer = clip(entry.answer, MAX_EVENT_TEXT);
  if (!answer) return null;
  const prompt = String(entry.prompt || "");
  const tagSet = new Set([
    ...(entry.tags || []),
    "ai-answer",
    ...inferTags(`${prompt}\n${answer}`),
  ]);
  return {
    ts: entry.ts || new Date().toISOString(),
    type: "ai-answer",
    title: titleFromPrompt(prompt),
    question: clip(prompt, MAX_QUESTION),
    text: answer,
    tags: [...tagSet].slice(0, 8),
    outcome: entry.outcome || "accepted",
    provider: entry.provider || null,
    model: entry.model_reported || entry.model_requested || null,
    hash: eventHash(entry.prompt_hash, entry.answer),
    refs: [],
  };
}

function add(text, flags) {
  if (!text) {
    console.error("Нужен текст записи.");
    process.exit(2);
  }
  const event = {
    ts: new Date().toISOString(),
    type: flags.type || "note",
    title: clip(text, MAX_TITLE),
    text: clip(text, MAX_EVENT_TEXT),
    tags: [...new Set([...(flags.tags || []), ...inferTags(text)])].slice(0, 8),
    refs: flags.refs || [],
  };
  appendJsonl(EVENTS, [event]);
  console.log(`Записано в ${path.relative(ROOT, EVENTS)}: ${event.title}`);
}

function ingest(flags) {
  const from = flags.from || RAW;
  const limit = flags.limit || DEFAULT_INGEST_LIMIT;
  if (!fs.existsSync(from)) {
    console.log(`Нет файла сырого журнала: ${from}`);
    return { added: 0, skipped: 0 };
  }
  const existing = new Set(readJsonl(EVENTS).map((e) => e.hash).filter(Boolean));
  // fallback/format-fail — это неудачные ответы; в курируемый журнал им не место.
  const rows = readJsonl(from)
    .filter((e) => (e.outcome || "accepted") === "accepted")
    .slice(-limit);

  const fresh = [];
  let skipped = 0;
  for (const entry of rows) {
    const event = toEvent(entry);
    if (!event || existing.has(event.hash)) {
      skipped++;
      continue;
    }
    existing.add(event.hash);
    fresh.push(event);
  }
  if (fresh.length) appendJsonl(EVENTS, fresh);
  console.log(
    `Ingest ${path.relative(ROOT, from)}: добавлено ${fresh.length}, пропущено ${skipped}.`
  );
  return { added: fresh.length, skipped };
}

function loadSearchEntries() {
  const events = readJsonl(EVENTS).map((e) => ({
    source: "event",
    date: String(e.ts || "").slice(0, 10),
    title: `[${e.type || "event"}] ${e.title || ""}`,
    body: `${e.question ? `Q: ${e.question}\n` : ""}A: ${e.text || ""}`,
    tags: e.tags || [],
    refs: e.refs || [],
    _line: e._line,
  }));
  const tasks = readJsonl(TASKS).map((e) => ({
    source: "task",
    date: e.date || "",
    title: `[${e.status || "?"}] ${clip(e.task, 120)}`,
    body: e.task || "",
    tags: e.tags || [],
    refs: e.refs || [],
    _line: e._line,
  }));
  return [...events, ...tasks];
}

function matches(entry, tokens, tag) {
  if (tag && !(entry.tags || []).includes(tag)) return false;
  const hay = `${entry.title} ${entry.body} ${(entry.tags || []).join(" ")}`.toLowerCase();
  return tokens.every((t) => hay.includes(t));
}

function printEntry(e) {
  console.log(`${e.date} ${e.title} (${e.source}, запись ${e._line})`);
  console.log(`    ${clip(e.body, 240)}`);
  if (e.tags.length) console.log(`    теги: ${e.tags.join(", ")}`);
  if (e.refs.length) console.log(`    refs: ${e.refs.join(", ")}`);
}

function search(words, tag) {
  const tokens = String(words || "").toLowerCase().split(/\s+/).filter(Boolean);
  const hits = loadSearchEntries().filter((e) => matches(e, tokens, tag));
  if (!hits.length) {
    console.log("Совпадений нет.");
    return;
  }
  console.log(`Найдено ${hits.length}:`);
  hits.forEach(printEntry);
}

function list(flags) {
  let rows = readJsonl(EVENTS);
  if (flags.tag) rows = rows.filter((e) => (e.tags || []).includes(flags.tag));
  rows = rows.slice(-(flags.limit || 20)).reverse();
  if (!rows.length) {
    console.log("Журнал пуст.");
    return;
  }
  for (const e of rows) {
    console.log(`${String(e.ts || "").slice(0, 19)} [${e.type || "event"}] ${e.title}`);
    if (e.tags?.length) console.log(`    теги: ${e.tags.join(", ")}`);
  }
}

function stats() {
  const events = readJsonl(EVENTS);
  const byType = {};
  const byTag = {};
  for (const e of events) {
    byType[e.type || "event"] = (byType[e.type || "event"] || 0) + 1;
    for (const tag of e.tags || []) byTag[tag] = (byTag[tag] || 0) + 1;
  }
  console.log(`journal: ${events.length} записей`);
  console.log(`  типы: ${Object.entries(byType).map(([k, v]) => `${k}=${v}`).join(", ") || "—"}`);
  console.log(`  теги: ${Object.entries(byTag).map(([k, v]) => `${k}=${v}`).join(", ") || "—"}`);
  console.log(`  файл: ${path.relative(ROOT, EVENTS)}`);
}

function parseFlags(args) {
  const flags = { tags: [], refs: [] };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--tags" && args[i + 1]) flags.tags = args[++i].split(",").map((s) => s.trim()).filter(Boolean);
    else if (args[i] === "--refs" && args[i + 1]) flags.refs = args[++i].split(",").map((s) => s.trim()).filter(Boolean);
    else if (args[i] === "--type" && args[i + 1]) flags.type = args[++i];
    else if (args[i] === "--tag" && args[i + 1]) flags.tag = args[++i];
    else if (args[i] === "--from" && args[i + 1]) flags.from = args[++i];
    else if (args[i] === "--limit" && args[i + 1]) flags.limit = parseInt(args[++i], 10);
  }
  return flags;
}

if (require.main === module) {
  const [cmd, ...rest] = process.argv.slice(2);
  const flags = parseFlags(rest);
  switch (cmd) {
    case "add":
      add(rest[0], flags);
      break;
    case "ingest":
      ingest(flags);
      break;
    case "search":
      if (!rest[0]) { console.error("Укажи поисковые слова"); process.exit(2); }
      search(rest[0], flags.tag);
      break;
    case "list":
      list(flags);
      break;
    case "stats":
      stats();
      break;
    default:
      console.log(
        "Журнал.\n  add \"текст\" [--type note] [--tags a,b] [--refs x,y]\n" +
        "  ingest [--from logs/ask-journal.jsonl] [--limit N]\n" +
        "  search \"слова\" [--tag tag] | list [--tag tag] [--limit N] | stats"
      );
      process.exit(cmd ? 2 : 0);
  }
}

module.exports = {
  readJsonl,
  appendJsonl,
  titleFromPrompt,
  inferTags,
  toEvent,
  add,
  ingest,
  search,
  list,
  stats,
  EVENTS,
};
