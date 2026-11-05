#!/usr/bin/env node
// Добирает полные тексты вакансий, у которых description ещё пуст.
// Парсеры сохраняют текст для новых вакансий; этот инструмент постепенно
// закрывает старые и те, где детальная страница не ответила с первого раза.
// Запуск: node tools/fetch-descriptions.js [LIMIT=40] [--source infostud]
const { openDb } = require("../scrapers/db");
const { fetchHtml } = require("../scrapers/common");
const infostud = require("../scrapers/infostud");
const helloworld = require("../scrapers/helloworld");
const halooglasi = require("../scrapers/halooglasi");
const { extractGenericDescription } = require("../scrapers/common");

const EXTRACTORS = {
  infostud: infostud.extractDescription,
  helloworld: helloworld.extractDescription,
  halooglasi: halooglasi.extractDescription,
  kupujemprodajem: extractGenericDescription,
};
const DEFAULT_SOURCES = ["infostud", "helloworld", "halooglasi"];
const HEADERS = { accept: "text/html,application/xhtml+xml", "accept-language": "sr,en;q=0.7" };

function parseArgs(argv) {
  const sourceAt = argv.indexOf("--source");
  const source = sourceAt !== -1 ? argv[sourceAt + 1] : null;
  const limitArg = argv.map((a) => (/^\d+$/.test(a) ? parseInt(a, 10) : null)).find((n) => n !== null);
  return { source, limit: Math.max(1, limitArg || 40) };
}

function selectPending(db, { source, limit } = {}) {
  const sources = source ? [source] : DEFAULT_SOURCES;
  const placeholders = sources.map(() => "?").join(", ");
  return db.prepare(
    `SELECT id, source, source_url, title_sr FROM jobs
     WHERE description IS NULL AND source IN (${placeholders})
     ORDER BY parsed_at DESC LIMIT ?`
  ).all(...sources, limit);
}

async function run(db, options) {
  const pending = selectPending(db, options);
  if (!pending.length) {
    console.log("Нет вакансий без полного текста.");
    return { attempted: 0, filled: 0, failed: 0 };
  }
  const update = db.prepare("UPDATE jobs SET description = ? WHERE id = ?");
  let filled = 0;
  let failed = 0;
  for (const job of pending) {
    const extract = EXTRACTORS[job.source];
    if (!extract) continue;
    try {
      const html = fetchHtml(job.source_url, HEADERS);
      const description = extract(html);
      if (description) {
        update.run(description, job.id);
        filled++;
      } else {
        failed++;
      }
    } catch (e) {
      failed++;
      console.error(`description ${job.source} ${job.id}: ${e.message}`);
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  console.log(
    `Descriptions: ${filled}/${pending.length} filled, ${failed} failed ` +
    `(limit ${options.limit}${options.source ? `, source ${options.source}` : ""}).`
  );
  return { attempted: pending.length, filled, failed };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const db = openDb();
  try {
    await run(db, options);
  } finally {
    db.close();
  }
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}

module.exports = { parseArgs, selectPending, run, EXTRACTORS };
