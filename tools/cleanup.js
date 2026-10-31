#!/usr/bin/env node
// Ротация: удаляем вакансии, которые не встречались в листингах дольше N дней.
// Критерий — last_seen (parsed_at обновляется при каждом показе в листинге),
// а НЕ posted_at: объявление с публикацией месячной давности, но всё ещё
// висящее на сайте, удаляться не должно.
// Запуск: node tools/cleanup.js [дней=30]
const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");

const ROOT = path.join(__dirname, "..");
const DB_PATH = process.env.JOBS_DB || path.join(ROOT, "data", "jobs.db");
const DAYS = parseInt(process.argv[2] || "30", 10);

if (!Number.isInteger(DAYS) || DAYS < 1) {
  console.error(`Некорректный срок: ${process.argv[2]} (нужно целое >= 1)`);
  process.exit(2);
}
if (!fs.existsSync(DB_PATH)) {
  console.error(`Database not found: ${DB_PATH}`);
  process.exit(1);
}

const CUTOFF = new Date(Date.now() - DAYS * 86400000).toISOString().slice(0, 10);

const db = new DatabaseSync(DB_PATH);
db.exec("PRAGMA busy_timeout = 5000; PRAGMA foreign_keys = ON;");
const stale = "substr(parsed_at, 1, 10) < ?";
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
console.log(`Removed ${count} jobs not seen since ${CUTOFF} (last_seen > ${DAYS} days).`);
