#!/usr/bin/env node
// Резервная копия data/jobs.db: целостная копия через VACUUM INTO (безопасна при
// открытой БД), проверка integrity_check, хранение последних N копий.
// Копия содержит ВСЕ таблицы: jobs, professions (переводы), glossary, job_words.
// Запуск: node tools/backup-db.js [хранить_копий=14]
// Результат: snapshots/backups/jobs-YYYY-MM-DD.db (одна копия в день, перезаписывается).
const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");

const ROOT = path.join(__dirname, "..");
const DB_PATH = process.env.JOBS_DB || path.join(ROOT, "data", "jobs.db");
const BACKUP_DIR = process.env.BACKUP_DIR || path.join(ROOT, "snapshots", "backups");
const KEEP = parseInt(process.argv[2] || "14", 10);

if (!Number.isInteger(KEEP) || KEEP < 1) {
  console.error(`Некорректное число копий: ${process.argv[2]} (нужно целое >= 1)`);
  process.exit(2);
}
if (!fs.existsSync(DB_PATH)) {
  console.error(`Database not found: ${DB_PATH}`);
  process.exit(1);
}

const stamp = new Date().toISOString().slice(0, 10);
const dest = path.join(BACKUP_DIR, `jobs-${stamp}.db`);
const tmp = `${dest}.tmp`;
fs.mkdirSync(BACKUP_DIR, { recursive: true });
fs.rmSync(tmp, { force: true });

try {
  const db = new DatabaseSync(DB_PATH, { readOnly: true });
  db.exec("PRAGMA busy_timeout = 5000;");
  db.exec(`VACUUM INTO '${tmp.replace(/'/g, "''")}'`);
  db.close();

  // Копия считается годной, только если открывается и проходит integrity_check.
  const copy = new DatabaseSync(tmp, { readOnly: true });
  const integrity = copy.prepare("PRAGMA integrity_check").get().integrity_check;
  const jobs = copy.prepare("SELECT COUNT(*) AS n FROM jobs").get().n;
  const prof = copy.prepare("SELECT COUNT(*) AS n FROM professions").get().n;
  copy.close();
  if (integrity !== "ok") throw new Error(`integrity_check копии: ${integrity}`);

  fs.renameSync(tmp, dest);
  console.log(`Backup: ${dest} (jobs=${jobs}, professions=${prof})`);
} catch (e) {
  fs.rmSync(tmp, { force: true });
  console.error(`Backup FAILED: ${e.message}`);
  process.exit(1);
}

// Ротация: оставляем KEEP самых свежих копий.
const old = fs.readdirSync(BACKUP_DIR)
  .filter((f) => /^jobs-\d{4}-\d{2}-\d{2}\.db$/.test(f))
  .sort()
  .reverse()
  .slice(KEEP);
for (const f of old) {
  fs.rmSync(path.join(BACKUP_DIR, f), { force: true });
  console.log(`Removed old backup: ${f}`);
}
