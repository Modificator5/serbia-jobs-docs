#!/usr/bin/env node
// Диагностика окружения проекта: зависимости, БД, конфиг, целостность.
// Запуск: node tools/doctor.js  (или npm run verify -> doctor + check)
const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");

const ROOT = path.join(__dirname, "..");
let failures = 0;
const ok = (m) => console.log(`  ok   ${m}`);
const fail = (m) => { console.log(`  FAIL ${m}`); failures++; };
const warn = (m) => console.log(`  warn ${m}`);
const exists = (p) => fs.existsSync(path.join(ROOT, p));

console.log("doctor: проверяю окружение...");

// Node
const major = parseInt(process.versions.node.split(".")[0], 10);
if (major >= 22) ok(`node ${process.versions.node}`); else fail(`node ${process.versions.node} (нужен >= 22 для node:sqlite)`);

// Файлы/структура
for (const p of [
  "package.json", "AGENTS.md", ".env.example", "scrapers/db.js",
  "data/jobs.db", "prompts/worker-core.md", "tools/check.js",
]) {
  exists(p) ? ok(p) : fail(`нет файла: ${p}`);
}
for (const p of ["memory/tasks.jsonl", "logs/", ".ai_memory/"]) {
  exists(p) ? ok(`${p} есть (локально)`) : warn(`${p} ещё не создан (локально, не коммитится)`);
}
// Секреты в git — нет
if (exists(".git")) {
  const tracked = require("node:child_process")
    .execSync("git ls-files", { cwd: ROOT, encoding: "utf8" })
    .split("\n");
  const leaked = tracked.filter((f) =>
    /^(\.env$|data\/.*\.db|logs\/|\.ai_memory\/|memory\/|jobs\.json$)/.test(f));
  leaked.length ? fail(`в git попали локальные файлы: ${leaked.slice(0, 5).join(", ")}`)
                : ok("в git нет .env/db/logs/memory");
}

// .env: только при работе с ИИ
if (!exists(".env")) warn(".env отсутствует (нужен для translate/enrich: GEMINI_API_KEY и т.д.)");
else {
  const env = fs.readFileSync(path.join(ROOT, ".env"), "utf8");
  env.includes("GEMINI_API_KEY") ? ok(".env содержит GEMINI_API_KEY")
    : warn(".env без GEMINI_API_KEY (translate упадёт на gemini)");
  const secretLines = env.split("\n").filter((l) =>
    /^[A-Z_]+\s*=\s*\S/.test(l) && !/^\s*#/.test(l)).length;
  ok(`.env: ${secretLines} переменных (значения не печатаю)`);
}

// БД
try {
  const db = new DatabaseSync(path.join(ROOT, "data", "jobs.db"));
  const integrity = db.prepare("PRAGMA integrity_check").get().integrity_check;
  integrity === "ok" ? ok("jobs.db integrity_check = ok") : fail(`jobs.db integrity: ${integrity}`);
  const jobs = db.prepare("SELECT COUNT(*) n FROM jobs").get().n;
  const untranslated = db.prepare(
    "SELECT COUNT(*) n FROM jobs WHERE title_ru IS NULL OR title_ru = ''").get().n;
  const future = db.prepare(
    "SELECT COUNT(*) n FROM jobs WHERE posted_at > date('now')").get().n;
  const prof = db.prepare("SELECT COUNT(*) n FROM professions").get().n;
  const terms = db.prepare("SELECT COUNT(*) n FROM glossary").get().n;
  ok(`jobs=${jobs} professions=${prof} glossary=${terms} без_перевода=${untranslated}`);
  future ? warn(`вакансий с датой в будущем: ${future} (очистится при перескрейпе)`)
         : ok("нет вакансий с posted_at в будущем");
  db.close();
} catch (e) {
  fail(`БД недоступна: ${e.message}`);
}

// Инструменты без синтаксических ошибок (быстрая проверка)
for (const f of ["tools/ask.py"]) {
  try {
    require("node:child_process").execSync(`python3 -m py_compile ${f}`, { cwd: ROOT, stdio: "pipe" });
    ok(`${f} — синтаксис python`);
  } catch {
    fail(`${f} — ошибка синтаксиса python`);
  }
}

console.log(failures ? `\ndoctor: ${failures} проблем(ы)` : "\ndoctor: всё ок");
process.exit(failures ? 1 : 0);
