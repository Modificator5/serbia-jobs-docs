#!/usr/bin/env node
// Импорт личной базы терминов docs/glossary/bazaznanja.txt в таблицы
// glossary_categories и glossary. Существующие термины не перезаписываются
// (INSERT OR IGNORE); term в схеме UNIQUE, поэтому повтор термина в другой
// категории или с другим переводом пропускается — о таком конфликте скрипт
// предупреждает. Код возврата 1 при любой ошибке — для daily.sh.
const { openDb } = require("../scrapers/db");
const fs = require("node:fs");
const path = require("node:path");

const BAZA_PATH = process.env.GLOSSARY_FILE ||
  path.join(__dirname, "..", "docs/glossary/bazaznanja.txt");
const MAX_WARNINGS = 10;

// Строка-разделитель markdown-таблицы: |---|---|, | :--- | ---: | и т.п.
const isSeparatorRow = (cells) => cells.every((c) => /^:?-{2,}:?$/.test(c));

function importBazaznanja() {
  const content = fs.readFileSync(BAZA_PATH, "utf8");
  const lines = content.split(/\r?\n/);
  const db = openDb();

  try {
    const insCategory = db.prepare("INSERT OR IGNORE INTO glossary_categories (name) VALUES (?)");
    const selCategory = db.prepare("SELECT id FROM glossary_categories WHERE name = ?");
    const insTerm = db.prepare(
      `INSERT OR IGNORE INTO glossary (category_id, term, translation_ru, definition, source)
       VALUES (?, ?, ?, ?, 'manual')`
    );
    const selTerm = db.prepare(
      "SELECT id, definition, translation_ru FROM glossary WHERE term = ? COLLATE NOCASE"
    );
    const fillTranslation = db.prepare(
      "UPDATE glossary SET translation_ru = COALESCE(translation_ru, ?) WHERE id = ?"
    );

    let currentCategory = "Общее";
    let inserted = 0;
    let skipped = 0;
    const conflicts = [];

    db.exec("BEGIN");
    try {
      for (let line of lines) {
        line = line.trim();
        if (!line) continue;

        if (line.startsWith("#")) {
          if (line.startsWith("##")) {
            const match = line.match(/##\s*\d*\.?\s*([^—:]+)/);
            if (match) currentCategory = match[1].trim();
          }
          continue;
        }

        if (!line.startsWith("|")) continue;

        const cells = line.split("|").map((c) => c.trim()).filter((c) => c !== "");
        if (cells.length < 2 || isSeparatorRow(cells)) continue;
        if (cells[0].toLowerCase().includes("сербский")) continue; // строка заголовка

        const [sr, ru, note = ""] = cells;
        const definition = note ? `${ru}. ${note}` : ru;
        insCategory.run(currentCategory);
        const catId = selCategory.get(currentCategory).id;

        if (insTerm.run(catId, sr, ru, definition).changes) {
          inserted++;
        } else {
          skipped++;
          const have = selTerm.get(sr);
          // Термин мог прийти из ИИ без перевода — ручной файл его дополняет.
          if (have && !have.translation_ru) fillTranslation.run(ru, have.id);
          if (have && have.definition !== definition) {
            conflicts.push(`"${sr}" [${currentCategory}]: в базе «${have.definition}», в файле «${definition}»`);
          }
        }
      }
      db.exec("COMMIT");
    } catch (e) {
      db.exec("ROLLBACK");
      throw e;
    }

    console.log(`Imported ${inserted} new terms from bazaznanja.txt (skipped ${skipped} already in glossary).`);
    if (conflicts.length) {
      console.warn(`Конфликты (термин уже есть с другим значением; в базе не изменён): ${conflicts.length}`);
      conflicts.slice(0, MAX_WARNINGS).forEach((c) => console.warn(`  ${c}`));
      if (conflicts.length > MAX_WARNINGS) console.warn(`  ... и ещё ${conflicts.length - MAX_WARNINGS}`);
    }
  } finally {
    db.close();
  }
}

try {
  importBazaznanja();
} catch (e) {
  console.error(`import-glossary: ${e.message}`);
  process.exit(1);
}
