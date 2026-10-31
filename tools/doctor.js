#!/usr/bin/env node
// Диагностика окружения проекта: зависимости, БД, конфиг, целостность.
// Запуск: node tools/doctor.js  (npm run verify = doctor + check + docs:check)
// В CI (без локальной БД/артефактов) отсутствие данных — warn, а не FAIL.
const fs = require("node:fs");
const path = require("node:path");
const { execSync } = require("node:child_process");

const ROOT = path.join(__dirname, "..");
const CI = process.env.CI === "true" || process.env.CI === "1";
let failures = 0;
const ok = (m) => console.log(`  ok   ${m}`);
const warn = (m) => console.log(`  warn ${m}`);
const fail = (m) => { console.log(`  FAIL ${m}`); failures++; };
const exists = (p) => fs.existsSync(path.join(ROOT, p));

console.log(`doctor: проверяю окружение${CI ? " (CI)" : ""}...`);

// Node
const [nodeMajor, nodeMinor] = process.versions.node.split(".").map(Number);
if (nodeMajor > 22 || (nodeMajor === 22 && nodeMinor >= 5)) ok(`node ${process.versions.node}`);
else fail(`node ${process.versions.node} (нужен >= 22.5 для node:sqlite)`);

// Обязательные файлы кода/доков (всегда)
for (const p of [
  "package.json", "AGENTS.md", ".env.example", "scrapers/db.js",
  "prompts/worker-core.md", "tools/check.js", "tools/docs-check.js",
]) {
  exists(p) ? ok(p) : fail(`нет файла: ${p}`);
}

// Локальные данные/кеши: отсутствуют в CI — это нормально
for (const p of ["memory/tasks.jsonl", "logs/", ".ai_memory/"]) {
  if (exists(p)) ok(`${p} есть`);
  else if (CI) warn(`${p} отсутствует (локальный файл, в CI не нужен)`);
  else warn(`${p} ещё не создан (локально, не коммитится как данные)`);
}

// Секреты/артефакты не должны быть в git. memory/ НАМЕРЕННО в git (AGENTS.md §4).
if (exists(".git")) {
  const tracked = execSync("git ls-files", { cwd: ROOT, encoding: "utf8" }).split("\n");
  const leaked = tracked.filter((f) =>
    /^(\.env$|data\/|logs\/|snapshots\/|\.ai_memory\/|jobs\.json$)/.test(f));
  leaked.length ? fail(`в git попали локальные данные: ${leaked.slice(0, 5).join(", ")}`)
                : ok("в git нет .env/data/logs/snapshots/jobs.json");
  tracked.includes("memory/tasks.jsonl")
    ? ok("memory/tasks.jsonl в git (по конституции)")
    : warn("memory/tasks.jsonl не в git (должен входить по AGENTS.md §4)");
}

// .env нужен только для ИИ-шагов
if (!exists(".env")) warn(".env отсутствует (нужен для translate/enrich)");
else {
  const env = fs.readFileSync(path.join(ROOT, ".env"), "utf8");
  env.includes("GEMINI_API_KEY") ? ok(".env содержит GEMINI_API_KEY")
    : warn(".env без GEMINI_API_KEY (translate упадёт на gemini)");
  const count = env.split("\n").filter((l) => /^[A-Z_]+\s*=\s*\S/.test(l) && !/^\s*#/.test(l)).length;
  ok(`.env: ${count} переменных (значения не печатаю)`);
}

// БД — источник правды, только локально
if (!exists("data/jobs.db")) {
  CI ? warn("data/jobs.db отсутствует (в CI не нужен)")
     : fail("нет data/jobs.db — запусти парсер или восстанови из snapshots/jobs.csv");
} else {
  try {
    const { DatabaseSync } = require("node:sqlite");
    const db = new DatabaseSync(path.join(ROOT, "data", "jobs.db"), { readOnly: true });
    const integrity = db.prepare("PRAGMA integrity_check").get().integrity_check;
    integrity === "ok" ? ok("jobs.db integrity_check = ok") : fail(`jobs.db integrity: ${integrity}`);
    const jobs = db.prepare("SELECT COUNT(*) n FROM jobs").get().n;
    const untranslated = db.prepare("SELECT COUNT(*) n FROM jobs WHERE title_ru IS NULL OR title_ru = ''").get().n;
    const future = db.prepare("SELECT COUNT(*) n FROM jobs WHERE posted_at > date('now')").get().n;
    const prof = db.prepare("SELECT COUNT(*) n FROM professions").get().n;
    const terms = db.prepare("SELECT COUNT(*) n FROM glossary").get().n;
    ok(`jobs=${jobs} professions=${prof} glossary=${terms} без_перевода=${untranslated}`);
    future ? warn(`вакансий с датой в будущем: ${future}`) : ok("нет вакансий с posted_at в будущем");
    db.close();
  } catch (e) {
    fail(`БД недоступна: ${e.message}`);
  }
}

// Python-мост
try {
  execSync("python3 -m py_compile tools/ask.py", { cwd: ROOT, stdio: "pipe" });
  ok("tools/ask.py — синтаксис python");
} catch {
  fail("tools/ask.py — ошибка синтаксиса python");
}

console.log(failures ? `\ndoctor: ${failures} проблем(ы)` : "\ndoctor: всё ок");
process.exit(failures ? 1 : 0);
