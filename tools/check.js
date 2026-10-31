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
const JSON_PATH = path.join(ROOT, "jobs.json");

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

// --- Артефакты: проверяем только если есть (локально или после export) ---
let jobs = null;
if (fs.existsSync(JSON_PATH)) {
  jobs = JSON.parse(fs.readFileSync(JSON_PATH, "utf8"));
  assert.ok(Array.isArray(jobs), "jobs.json must be an array");
  assert.ok(jobs.length > 0, "jobs.json must not be empty");
  for (const job of jobs) {
    assert.ok(job.source_url, "job without source_url");
    assert.ok(job.title_sr || job.title_ru, "job without title");
  }
} else {
  console.log("check: jobs.json отсутствует — артефакт не проверяем (CI)");
}

if (fs.existsSync(DB_PATH)) {
  const { DatabaseSync } = require("node:sqlite");
  const db = new DatabaseSync(DB_PATH, { readOnly: true });
  const count = db.prepare("SELECT COUNT(*) AS n FROM jobs").get().n;
  db.close();
  assert.ok(count > 0, "jobs.db пуста");
  if (jobs) assert.equal(jobs.length, count, "jobs.json рассинхронизирован с jobs.db");
  console.log(`check: БД ${count} вакансий${jobs ? ", jobs.json синхронен" : ""}`);
} else if (!process.env.CI) {
  console.log("check: jobs.db отсутствует — проверялись только хелперы");
}

console.log(`OK: хелперы${jobs ? `, ${jobs.length} jobs` : ""}.`);
