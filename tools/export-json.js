#!/usr/bin/env node
// Публичный JSON-снимок (атомарная запись; читатель не увидит полуфайл).
const path = require("node:path");
const { openReadOnlyDb } = require("../scrapers/db");
const { writeFileAtomic } = require("./file-utils");

const ROOT = path.join(__dirname, "..");
const OUT = process.env.EXPORT_JSON || path.join(ROOT, "jobs.json");

const db = openReadOnlyDb();
let jobs;
try {
  jobs = db.prepare(
    `SELECT id, source, source_url, title_sr, title_ru, city, salary_raw,
            company_short, snippet, category_tag, posted_at
     FROM jobs
     ORDER BY posted_at DESC NULLS LAST, parsed_at DESC`
  ).all();
} finally {
  db.close();
}

writeFileAtomic(OUT, JSON.stringify(jobs, null, 2) + "\n");
console.log(`Exported ${jobs.length} jobs to ${OUT}`);
