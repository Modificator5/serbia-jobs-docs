#!/usr/bin/env node
// Тесты хелперов + проверка артефактов (jobs.json/БД), если они есть.
// В CI без локальных данных: хелперы тестируются, артефакты — skip (не FAIL).
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {
  parseSalary, categoryTag, parseDateDMY, decodeHtml, cleanText, normalizePostedAt,
} = require("../scrapers/db");

const ROOT = path.join(__dirname, "..");
const DB_PATH = process.env.JOBS_DB || path.join(ROOT, "data", "jobs.db");
const JSON_PATH = process.env.JOBS_JSON || path.join(ROOT, "jobs.json");

// --- Хелперы нормализации (всегда) ---
assert.deepEqual(parseSalary("70.000 din"), { salary_min: 70000, salary_max: 70000 });
assert.deepEqual(parseSalary("1000 EUR mesečno"), { salary_min: 1000, salary_max: 1000 });
assert.deepEqual(parseSalary(null), { salary_min: null, salary_max: null });
assert.equal(categoryTag("IT Developer"), "it");
assert.equal(categoryTag("raditi"), "drugo");
assert.equal(categoryTag("Konobar"), "ugostiteljstvo");
assert.equal(parseDateDMY("28.10.2026"), "2026-10-28");
assert.equal(decodeHtml("A &amp; B &#x27;"), "A & B '");
assert.equal(cleanText(" <b>A</b>  &amp; B "), "A & B");
assert.equal(normalizePostedAt("2999-01-01"), null);
assert.equal(normalizePostedAt("2020-01-01"), "2020-01-01");

// --- Артефакты: собираем ВСЕ ошибки, затем один отчёт ---
const errors = [];
const warnings = [];
let jobs = null;
let dbCount = null;

if (fs.existsSync(JSON_PATH)) {
  try {
    jobs = JSON.parse(fs.readFileSync(JSON_PATH, "utf8"));
  } catch (e) {
    errors.push(`jobs.json не парсится: ${e.message}`);
  }
  if (jobs !== null) {
    if (!Array.isArray(jobs)) errors.push("jobs.json должен быть массивом");
    else {
      if (!jobs.length) errors.push("jobs.json пуст");
      jobs.forEach((job, i) => {
        if (!job || !job.source_url) errors.push(`jobs[${i}]: нет source_url`);
        if (!job || (!job.title_sr && !job.title_ru)) errors.push(`jobs[${i}]: нет заголовка`);
      });
    }
  }
} else {
  console.log("check: jobs.json отсутствует — артефакт не проверяем (CI)");
}

if (fs.existsSync(DB_PATH)) {
  const { DatabaseSync } = require("node:sqlite");
  const db = new DatabaseSync(DB_PATH, { readOnly: true });
  try {
    dbCount = db.prepare("SELECT COUNT(*) AS n FROM jobs").get().n;
    if (!dbCount) errors.push("jobs.db пуста");
  } finally {
    db.close();
  }
} else if (!process.env.CI) {
  console.log("check: jobs.db отсутствует — проверялись только хелперы");
}

// Сверяем счётчики только если экспорт не старше БД: после скрейпа
// jobs.json законно отстаёт до ближайшего export.
if (jobs && Array.isArray(jobs) && dbCount !== null) {
  const jsonMtime = fs.statSync(JSON_PATH).mtimeMs;
  const dbMtime = fs.statSync(DB_PATH).mtimeMs;
  if (jsonMtime + 1000 < dbMtime) {
    warnings.push(`jobs.json старше jobs.db (${jobs.length} vs ${dbCount}) — сверка счётчиков пропущена, нужен export`);
  } else if (jobs.length !== dbCount) {
    errors.push(`jobs.json рассинхронизирован с jobs.db: ${jobs.length} != ${dbCount}`);
  }
}

for (const w of warnings) console.warn(`check: предупреждение: ${w}`);
if (errors.length) {
  console.error(`check: ${errors.length} ошибок(и):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log(
  `check: БД ${dbCount ?? "—"} вакансий` +
    `${jobs ? `, jobs.json ${jobs.length}` : ""}${warnings.length ? " (есть предупреждения)" : ""}`
);
console.log(`OK: хелперы${jobs ? `, ${jobs.length} jobs` : ""}.`);
