#!/usr/bin/env node
// Читаемый экспорт словаря из БД. БД — рабочая истина: сюда попадают и
// ручной seed (bazaznanja.txt), и термины, извлечённые ИИ из полного текста.
// Запуск: node tools/export-glossary.js [--out snapshots/glossary.md]
const fs = require("node:fs");
const path = require("node:path");
const { openReadOnlyDb } = require("../scrapers/db");

const ROOT = path.join(__dirname, "..");

function loadGlossary(db) {
  return db.prepare(
    `SELECT g.term, g.translation_ru, g.definition, g.part_of_speech, g.level,
            g.example_sr, g.source, COALESCE(c.name, 'Общее') AS category,
            (SELECT COUNT(DISTINCT jw.job_url) FROM job_words jw WHERE jw.word_id = g.id) AS jobs
     FROM glossary g
     LEFT JOIN glossary_categories c ON c.id = g.category_id
     ORDER BY category COLLATE NOCASE, g.term COLLATE NOCASE`
  ).all();
}

function escapeCell(value) {
  return String(value ?? "").replace(/\|/g, "\\|").replace(/\s+/g, " ").trim();
}

function render(rows, now = new Date()) {
  const lines = [
    "# Словарь сербских терминов",
    "",
    `Обновлён: ${now.toISOString().slice(0, 10)}. Всего терминов: ${rows.length}.`,
    "Источник: `data/jobs.db` (ручной seed + полные тексты вакансий).",
    "",
  ];
  const byCategory = new Map();
  for (const row of rows) {
    if (!byCategory.has(row.category)) byCategory.set(row.category, []);
    byCategory.get(row.category).push(row);
  }
  for (const [category, items] of byCategory) {
    lines.push(`## ${category}`, "");
    lines.push("| Термин | Перевод | Объяснение | Часть речи | Уровень | Пример | Источник | Вакансий |");
    lines.push("|---|---|---|---|---|---|---|---|");
    for (const r of items) {
      lines.push(
        `| ${escapeCell(r.term)} | ${escapeCell(r.translation_ru)} | ${escapeCell(r.definition)} | ` +
        `${escapeCell(r.part_of_speech)} | ${escapeCell(r.level)} | ${escapeCell(r.example_sr)} | ` +
        `${escapeCell(r.source || "manual")} | ${r.jobs} |`
      );
    }
    lines.push("");
  }
  return lines.join("\n");
}

function main() {
  const args = process.argv.slice(2);
  const at = args.indexOf("--out");
  const out = at !== -1 && args[at + 1]
    ? path.resolve(args[at + 1])
    : path.join(ROOT, "snapshots", "glossary.md");
  const db = openReadOnlyDb();
  try {
    const rows = loadGlossary(db);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, render(rows), "utf8");
    const ai = rows.filter((r) => r.source === "ai").length;
    const linked = rows.filter((r) => r.jobs > 0).length;
    console.log(`Glossary: ${rows.length} terms (${ai} from AI, ${linked} linked to jobs) -> ${path.relative(ROOT, out)}`);
  } finally {
    db.close();
  }
}

if (require.main === module) {
  try {
    main();
  } catch (e) {
    console.error(`export-glossary: ${e.message}`);
    process.exit(1);
  }
}

module.exports = { loadGlossary, render, escapeCell };
