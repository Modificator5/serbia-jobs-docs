#!/usr/bin/env node
// Офлайн-тест batch-enrich (T2.3): маркер enriched_at, переиспользование
// professions, строковые id, пропуск битых элементов. Без сети.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const tmp = path.join(os.tmpdir(), `serbia-enrich-${process.pid}-${Date.now()}.db`);
process.env.JOBS_DB = tmp;

const { openDb } = require("../scrapers/db");
const { selectPending, applyResults } = require("../tools/batch-enrich");

const db = openDb();
const insJob = db.prepare(
  `INSERT INTO jobs (id, source, source_url, title_sr, title_ru, snippet, parsed_at)
   VALUES (?, ?, ?, ?, ?, ?, ?)`
);
insJob.run("1", "test", "https://example.com/1", "Konobar", null, "Potreban konobar", "2026-11-03T00:00:00Z");
insJob.run("2", "test", "https://example.com/2", "Vozač", "Водитель", null, "2026-11-03T00:00:00Z");
insJob.run("3", "test", "https://example.com/3", "Magacioner", null, null, "2026-11-03T00:00:00Z");

// Уже обогащённая строка не должна попадать в выборку.
db.prepare("UPDATE jobs SET enriched_at = ? WHERE id = ?").run("2026-11-03T00:00:00Z", "3");

const pending = selectPending(db, 10);
assert.deepEqual(pending.map((j) => j.id).sort(), ["1", "2"]);

// professions уже знает перевод для id=2 — он должен победить ответ модели.
db.prepare("INSERT INTO professions (title_sr, title_ru) VALUES (?, ?)").run("Vozač", "Кешированный водитель");

const results = [
  { id: 1, title_ru: "Официант", terms: [{ term: "konobar", definition: "официант" }] },
  { id: "2", title_ru: "Водитель-модель", terms: [] },
  null,
  { id: 999, title_ru: "Лишний" },
];

const stats = applyResults(db, pending, results);
assert.equal(stats.updated, 2);
assert.equal(stats.terms, 1);
assert.equal(stats.skipped, 2);

assert.equal(db.prepare("SELECT title_ru FROM jobs WHERE id = ?").get("1").title_ru, "Официант");
assert.equal(db.prepare("SELECT title_ru FROM jobs WHERE id = ?").get("2").title_ru, "Кешированный водитель");
assert.equal(
  db.prepare("SELECT title_ru FROM professions WHERE title_sr = ?").get("Vozač").title_ru,
  "Кешированный водитель"
);
assert.ok(db.prepare("SELECT enriched_at FROM jobs WHERE id = ?").get("1").enriched_at);
assert.equal(selectPending(db, 10).length, 0);

const link = db.prepare(
  "SELECT jw.job_url, g.term FROM job_words jw JOIN glossary g ON g.id = jw.word_id"
).get();
assert.equal(link.job_url, "https://example.com/1");
assert.equal(link.term, "konobar");

db.close();
fs.rmSync(tmp, { force: true });
fs.rmSync(`${tmp}-wal`, { force: true });
fs.rmSync(`${tmp}-shm`, { force: true });
console.log("OK: batch-enrich (marker, professions reuse, string ids, skip malformed)");
