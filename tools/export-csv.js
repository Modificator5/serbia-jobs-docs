#!/usr/bin/env node
// Сжатый CSV-снимок базы вакансий для бэкапа и внешнего анализа (без доступа к БД).
// Запуск: node tools/export-csv.js → snapshots/jobs.csv (перезаписывается, без накопления).

const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");

const ROOT = path.join(__dirname, "..");
const DB_PATH = process.env.JOBS_DB || path.join(ROOT, "data", "jobs.db");
const OUT_DIR = path.join(ROOT, "snapshots");
const OUT = path.join(OUT_DIR, "jobs.csv");

function esc(v) {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

const db = new DatabaseSync(DB_PATH, { readOnly: true });
const rows = db.prepare(
  `SELECT id, source, source_url, title_sr, city, salary_raw, snippet,
          category_tag, posted_at
   FROM jobs
   ORDER BY source, posted_at DESC NULLS LAST`
).all();
db.close();

fs.mkdirSync(OUT_DIR, { recursive: true });
const header = "id,source,source_url,title_sr,city,salary_raw,snippet,category_tag,posted_at";
const lines = [header, ...rows.map((r) =>
  [r.id, r.source, r.source_url, r.title_sr, r.city, r.salary_raw,
   r.snippet, r.category_tag, r.posted_at].map(esc).join(","))];
fs.writeFileSync(OUT, lines.join("\n") + "\n", "utf8");
console.log(`Снимок: ${OUT} (${rows.length} строк)`);
