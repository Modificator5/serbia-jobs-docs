#!/usr/bin/env node
// Офлайн-тест схемы/upsert: user_version, индексы, UNIQUE-коллизия source_url,
// регистронезависимый glossary.term, ложное «inostranstvo» с отрицанием.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "serbia-db-"));
process.env.JOBS_DB = path.join(TMP, "nested", "jobs.db");
const {
  openDb, upsertJob, isAbroadJob, SCHEMA_VERSION,
} = require("../scrapers/db");

const base = (id, url, extra = {}) => ({
  id, source: "kp", source_url: url, title_sr: `Posao ${id}`,
  parsed_at: "2026-11-03T10:00:00Z", ...extra,
});

try {
  const db = openDb();
  assert.equal(db.prepare("PRAGMA user_version").get().user_version, SCHEMA_VERSION);
  const idx = db.prepare("SELECT name FROM sqlite_master WHERE type='index'").all().map((r) => r.name);
  assert.ok(idx.includes("idx_jobs_parsed_at"));
  assert.ok(idx.includes("idx_jobs_source"));
  assert.ok(idx.includes("idx_glossary_term_nocase"));
  assert.ok(idx.includes("idx_glossary_source"));

  // Новые поля схемы: полный текст, метаданные публикации, словарь.
  const jobCols = db.prepare("PRAGMA table_info(jobs)").all().map((c) => c.name);
  for (const col of ["description", "published_at", "telegram_message_id"]) {
    assert.ok(jobCols.includes(col), `jobs.${col}`);
  }
  const glossaryCols = db.prepare("PRAGMA table_info(glossary)").all().map((c) => c.name);
  for (const col of ["translation_ru", "source", "part_of_speech", "level", "example_sr"]) {
    assert.ok(glossaryCols.includes(col), `glossary.${col}`);
  }

  // Коллизия URL: вторая вакансия уже заняла u2; upsert первой не должен падать.
  assert.equal(upsertJob(db, base("1", "u1", { description: "Полный текст вакансии" })), true);
  // Повторный листинг без description не должен стирать уже сохранённый текст.
  assert.equal(upsertJob(db, base("1", "u1")), true);
  assert.equal(db.prepare("SELECT description FROM jobs WHERE id = '1'").get().description, "Полный текст вакансии");
  assert.equal(upsertJob(db, base("2", "u2")), true);
  assert.equal(upsertJob(db, base("1", "u2", { title_sr: "Novi naslov" })), true);
  const rows = db.prepare("SELECT id, source_url, title_sr FROM jobs ORDER BY id").all();
  assert.equal(rows.length, 2);
  assert.equal(rows[0].source_url, "u1"); // чужая ссылка не перетёрта
  assert.equal(rows[0].title_sr, "Novi naslov");

  // Регистронезависимый поиск термина (без изменения UNIQUE-строк).
  db.prepare("INSERT INTO glossary (term, definition) VALUES (?, ?)").run("Konobar", "Официант");
  const found = db.prepare("SELECT id FROM glossary WHERE term = ? COLLATE NOCASE").get("konobar");
  assert.ok(found, "термин должен находиться без учёта регистра");

  assert.equal(isAbroadJob({ title_sr: "Konobar", snippet: "Rad u inostranstvu, Nemačka" }), true);
  assert.equal(isAbroadJob({ title_sr: "Konobar", snippet: "Rad u inostranstvu nije potreban" }), false);
  assert.equal(isAbroadJob({ title_sr: "Konobar", city: "Beograd", snippet: "u nemačkoj" }), true);

  db.close();
  console.log("OK: db (user_version, indexes, URL collision, nocase glossary, abroad negation)");
} finally {
  fs.rmSync(TMP, { recursive: true, force: true });
}
