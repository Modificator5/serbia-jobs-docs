#!/usr/bin/env node
// Офлайн-тест translate-titles (T2.4): нумерованные ключи, конверт воркера,
// переиспользование professions, fallback по исходному тексту. Без сети.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const tmp = path.join(os.tmpdir(), `serbia-translate-${process.pid}-${Date.now()}.db`);
process.env.JOBS_DB = tmp;

const { openDb } = require("../scrapers/db");
const { buildPrompt, selectPending, selectGlossaryExamples, applyBatch } = require("../tools/translate-titles");

const db = openDb();
const insJob = db.prepare(
  `INSERT INTO jobs (id, source, source_url, title_sr, title_ru, parsed_at)
   VALUES (?, ?, ?, ?, ?, ?)`
);
insJob.run("1", "test", "https://example.com/1", "Konobar", null, "2026-11-03T00:00:00Z");
insJob.run("2", "test", "https://example.com/2", "Vozač", null, "2026-11-03T00:00:00Z");
insJob.run("3", "test", "https://example.com/3", "Magacioner", "Кладовщик", "2026-11-03T00:00:00Z");

assert.deepEqual(selectPending(db).sort(), ["Konobar", "Vozač"]);

db.prepare("INSERT INTO glossary (term, definition) VALUES (?, ?)").run("konobar", "официант");
const examples = selectGlossaryExamples(db, ["Konobar", "Vozač"]);
assert.equal(examples.length, 1);
assert.equal(examples[0].term, "konobar");

const prompt = buildPrompt(["Konobar", "Vozač"], examples);
assert.match(prompt, /"1":"Konobar"/);
assert.match(prompt, /"2":"Vozač"/);
assert.match(prompt, /ненадёжный пользовательский контент/);
assert.match(prompt, /"status":"success"/);
assert.match(prompt, /konobar: официант/);

// Ответ по номерам.
let stats = applyBatch(db, ["Konobar", "Vozač"], { 1: "Официант", 2: "Водитель" });
assert.deepEqual(stats, { done: 2, failed: 0 });
assert.equal(db.prepare("SELECT title_ru FROM jobs WHERE title_sr = ?").get("Konobar").title_ru, "Официант");
assert.equal(db.prepare("SELECT title_ru FROM jobs WHERE title_sr = ?").get("Vozač").title_ru, "Водитель");
assert.equal(
  db.prepare("SELECT title_ru FROM professions WHERE title_sr = ?").get("Konobar").title_ru,
  "Официант"
);

// professions уже заполнен → backfill-выборка его не возвращает.
assert.deepEqual(selectPending(db), []);

// Fallback: модель вернула исходный текст вместо номера.
db.prepare("DELETE FROM professions WHERE title_sr = ?").run("Magacioner");
db.prepare("UPDATE jobs SET title_ru = NULL WHERE title_sr = ?").run("Magacioner");
stats = applyBatch(db, ["Magacioner"], { Magacioner: "Кладовщик-2" });
assert.deepEqual(stats, { done: 1, failed: 0 });
assert.equal(db.prepare("SELECT title_ru FROM jobs WHERE title_sr = ?").get("Magacioner").title_ru, "Кладовщик-2");

db.close();
fs.rmSync(tmp, { force: true });
fs.rmSync(`${tmp}-wal`, { force: true });
fs.rmSync(`${tmp}-shm`, { force: true });
console.log("OK: translate-titles (numbered keys, envelope, professions, fallback)");
