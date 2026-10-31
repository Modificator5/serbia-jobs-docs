#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");

const ROOT = path.join(__dirname, "..");
const DB_PATH = process.env.JOBS_DB || path.join(ROOT, "data", "jobs.db");
const OUT = path.join(ROOT, "jobs.json");

const db = new DatabaseSync(DB_PATH, { readOnly: true });
const jobs = db.prepare(
  `SELECT id, source, source_url, title_sr, title_ru, city, salary_raw,
          company_short, snippet, category_tag, posted_at
   FROM jobs
   ORDER BY posted_at DESC NULLS LAST, parsed_at DESC`
).all();
db.close();

fs.writeFileSync(OUT, JSON.stringify(jobs, null, 2) + "\n", "utf8");
console.log(`Exported ${jobs.length} jobs to ${OUT}`);
