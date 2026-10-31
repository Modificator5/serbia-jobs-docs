#!/usr/bin/env node
// Индекс задач проекта с тегами (память мозга). Экономия токенов: сначала ищем,
// что уже делали/пробовали/отклоняли, и только потом генерируем.
// Использование:
//   node tools/memory.js search "термин" [тег]   — поиск по task/tags/refs
//   node tools/memory.js list [тег]              — все записи (новые первыми)
//   node tools/memory.js add SOLVED "задача" [--tags a,b] [--refs path,URL]
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const MEMORY = path.join(ROOT, "memory", "tasks.jsonl");
const STATUSES = ["SOLVED", "TRIED", "REJECTED", "PENDING"];

function load() {
  if (!fs.existsSync(MEMORY)) return [];
  return fs
    .readFileSync(MEMORY, "utf8")
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

function printEntry(e) {
  const tags = (e.tags || []).join(", ");
  const refs = (e.refs || []).join(", ");
  console.log(`[${e.status}] ${e.date} (стр.${e._line}) ${e.task}`);
  if (tags) console.log(`    теги: ${tags}`);
  if (refs) console.log(`    refs: ${refs}`);
}

function search(words, tag) {
  const entries = load();
  const tokens = String(words).toLowerCase().split(/\s+/).filter(Boolean);
  const hits = entries.filter((e) => {
    if (tag && !(e.status === tag || (e.tags || []).includes(tag))) return false;
    const hay = `${e.task} ${(e.tags || []).join(" ")} ${(e.refs || []).join(" ")} ${e.status}`.toLowerCase();
    return tokens.every((t) => hay.includes(t));
  });
  if (!hits.length) {
    console.log(`Совпадений нет (записей в памяти: ${entries.length}). Генерируй заново и запиши результат.`);
    process.exit(1);
  }
  console.log(`Найдено ${hits.length}:`);
  hits.forEach(printEntry);
}

function list(tag) {
  const entries = load().filter((e) => !tag || e.status === tag);
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
  fs.appendFileSync(MEMORY, JSON.stringify(entry, null) + "\n", "utf8");
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
  case "list":
    list(rest[0]);
    break;
  case "add":
    add(rest[0], rest[1], parseFlags(rest.slice(2)));
    break;
  default:
    console.log("Память задач.\n  search \"слова\" [тег] | list [тег] | add SOLVED \"задача\" [--tags a,b] [--refs x,y]");
    process.exit(cmd ? 2 : 0);
}
