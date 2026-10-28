#!/usr/bin/env node
// Импорт базы знаний (docs/glossary/bazaznanja.txt) в data/glossary.db.
// Таблицы: terms (слова/термины), phrasebook (целые фразы).
// Правило разбора: строка, оканчивающаяся на . ? ! …, — фраза; иначе — термин.
// Запуск: node tools/import-glossary.js

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { DatabaseSync } = require("node:sqlite");

const ROOT = path.join(__dirname, "..");
const SRC = path.join(ROOT, "docs", "glossary", "bazaznanja.txt");
const DB_PATH = process.env.GLOSSARY_DB || path.join(ROOT, "data", "glossary.db");

function openGlossary() {
  const db = new DatabaseSync(DB_PATH);
  db.exec(`
    CREATE TABLE IF NOT EXISTS terms (
      id            TEXT PRIMARY KEY,
      term_sr       TEXT NOT NULL,
      translation_ru TEXT,
      pronunciation TEXT,
      note          TEXT,
      example_url   TEXT,
      status        TEXT DEFAULT 'draft',
      created_at    TEXT NOT NULL,
      UNIQUE(term_sr)
    );
    CREATE TABLE IF NOT EXISTS phrasebook (
      id            TEXT PRIMARY KEY,
      phrase_sr     TEXT NOT NULL,
      phrase_ru     TEXT NOT NULL,
      context       TEXT,
      example_url   TEXT,
      status        TEXT DEFAULT 'draft',
      created_at    TEXT NOT NULL,
      UNIQUE(phrase_sr)
    );
  `);
  const cols = db.prepare("PRAGMA table_info(terms)").all().map((c) => c.name);
  if (!cols.includes("note")) {
    db.exec("ALTER TABLE terms ADD COLUMN note TEXT");
  }
  return db;
}

function parseRows(text) {
  const rows = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim().startsWith("|")) continue;
    const cells = line.split("|").map((c) => c.trim());
    cells.shift(); // пустой элемент до первой |
    cells.pop(); // пустой элемент после последней |
    if (cells.length < 3) continue;
    const [sr, ru, note] = cells;
    if (!sr || sr.includes("Сербский") || /^:?-{3,}/.test(sr)) continue;
    if (!ru) continue;
    rows.push({ sr, ru, note: note || null });
  }
  return rows;
}

function isPhrase(sr) {
  return /[.!?…]\s*$/.test(sr);
}

function main() {
  if (!fs.existsSync(SRC)) {
    console.error(`Нет файла-источника: ${SRC}`);
    process.exit(1);
  }
  const rows = parseRows(fs.readFileSync(SRC, "utf8"));
  const db = openGlossary();
  const now = new Date().toISOString();
  const insTerm = db.prepare(
    `INSERT INTO terms (id, term_sr, translation_ru, pronunciation, note, example_url, status, created_at)
     VALUES (?, ?, ?, NULL, ?, NULL, 'verified', ?)
     ON CONFLICT(term_sr) DO UPDATE SET
       translation_ru=excluded.translation_ru,
       note=excluded.note`
  );
  const insPhrase = db.prepare(
    `INSERT INTO phrasebook (id, phrase_sr, phrase_ru, context, example_url, status, created_at)
     VALUES (?, ?, ?, ?, NULL, 'verified', ?)
     ON CONFLICT(phrase_sr) DO UPDATE SET
       phrase_ru=excluded.phrase_ru,
       context=excluded.context`
  );

  let terms = 0;
  let phrases = 0;
  for (const { sr, ru, note } of rows) {
    const id = crypto.randomBytes(6).toString("hex");
    if (isPhrase(sr)) {
      insPhrase.run(id, sr, ru, note, now);
      phrases++;
    } else {
      insTerm.run(id, sr, ru, note, now);
      terms++;
    }
  }

  const t = db.prepare("SELECT COUNT(*) AS n FROM terms").get().n;
  const p = db.prepare("SELECT COUNT(*) AS n FROM phrasebook").get().n;
  console.log(
    `Импортировано: терминов ${terms}, фраз ${phrases} ` +
    `(строк в файле: ${rows.length}); в базе: terms ${t}, phrasebook ${p}`
  );
  console.log(`DB: ${DB_PATH}`);
  db.close();
}

main();
