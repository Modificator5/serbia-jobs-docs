#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");

const ROOT = path.join(__dirname, "..");
const DB_PATH = process.env.JOBS_DB || path.join(ROOT, "data", "jobs.db");
const DAYS = parseInt(process.argv[2] || "30", 10);
const CUTOFF = new Date(Date.now() - DAYS * 86400000).toISOString().slice(0, 10);

if (!fs.existsSync(DB_PATH)) {
  console.error(`Database not found: ${DB_PATH}`);
  process.exit(1);
}

const db = new DatabaseSync(DB_PATH);
const stale = "COALESCE(posted_at, substr(parsed_at, 1, 10)) < ?";
const count = db.prepare(`SELECT COUNT(*) AS n FROM jobs WHERE ${stale}`).get(CUTOFF).n;

db.exec("BEGIN");
try {
  db.prepare(`DELETE FROM job_words WHERE job_url IN (SELECT source_url FROM jobs WHERE ${stale})`)
    .run(CUTOFF);
  db.prepare(`DELETE FROM jobs WHERE ${stale}`).run(CUTOFF);
  db.exec("COMMIT");
} catch (e) {
  db.exec("ROLLBACK");
  db.close();
  throw e;
}
db.close();
console.log(`Removed ${count} jobs older than ${DAYS} days (cutoff ${CUTOFF}).`);
