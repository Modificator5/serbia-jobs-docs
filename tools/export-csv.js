#!/usr/bin/env node
// Сжатый CSV-снимок базы вакансий для бэкапа и внешнего анализа (без доступа к БД).
// Запуск: node tools/export-csv.js → snapshots/jobs.csv (атомарная перезапись).
const path = require("node:path");
const { openReadOnlyDb } = require("../scrapers/db");
const { writeFileAtomic, csvCell } = require("./file-utils");

const ROOT = path.join(__dirname, "..");
const OUT = process.env.EXPORT_CSV || path.join(ROOT, "snapshots", "jobs.csv");

const db = openReadOnlyDb();
let rows;
try {
  rows = db.prepare(
    `SELECT id, source, source_url, title_sr, city, salary_raw, snippet,
            category_tag, posted_at
     FROM jobs
     ORDER BY source, posted_at DESC NULLS LAST`
  ).all();
} finally {
  db.close();
}

const header = "id,source,source_url,title_sr,city,salary_raw,snippet,category_tag,posted_at";
const lines = [header, ...rows.map((r) =>
  [r.id, r.source, r.source_url, r.title_sr, r.city, r.salary_raw,
   r.snippet, r.category_tag, r.posted_at].map(csvCell).join(","))];
writeFileAtomic(OUT, lines.join("\n") + "\n");
console.log(`Снимок: ${OUT} (${rows.length} строк)`);
