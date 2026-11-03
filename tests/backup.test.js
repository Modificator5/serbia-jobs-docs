#!/usr/bin/env node
// Офлайн-тест backup-db: копия + integrity_check, ротация, коды возврата.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { DatabaseSync } = require("node:sqlite");

const ROOT = path.join(__dirname, "..");
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "serbia-backup-"));
const DB = path.join(TMP, "jobs.db");
const DIR = path.join(TMP, "backups");

function run(args, db = DB) {
  return spawnSync("node", [path.join(ROOT, "tools", "backup-db.js"), ...args], {
    encoding: "utf8",
    env: { ...process.env, JOBS_DB: db, BACKUP_DIR: DIR },
  });
}

try {
  const db = new DatabaseSync(DB);
  db.exec("CREATE TABLE jobs (id TEXT); CREATE TABLE professions (title_sr TEXT, title_ru TEXT)");
  db.exec("INSERT INTO jobs VALUES ('1'),('2'); INSERT INTO professions VALUES ('a','b')");
  db.close();

  fs.mkdirSync(DIR, { recursive: true });
  fs.writeFileSync(path.join(DIR, "jobs-2020-01-01.db"), "old");
  fs.writeFileSync(path.join(DIR, "jobs-2020-01-02.db"), "old");

  const res = run(["1"]);
  assert.equal(res.status, 0, res.stderr);
  const files = fs.readdirSync(DIR).filter((f) => /^jobs-\d{4}-\d{2}-\d{2}\.db$/.test(f));
  assert.equal(files.length, 1);
  assert.match(res.stdout, /Backup: .*jobs=2, professions=1/);
  assert.match(res.stdout, /Removed old backup: jobs-2020-01-0[12]\.db/);

  const copy = new DatabaseSync(path.join(DIR, files[0]), { readOnly: true });
  assert.equal(copy.prepare("PRAGMA integrity_check").get().integrity_check, "ok");
  copy.close();

  assert.equal(run(["0"]).status, 2, "keep=0 должен быть отклонён");
  assert.equal(run(["x"]).status, 2);
  assert.equal(run([], path.join(TMP, "missing.db")).status, 1);

  console.log("OK: backup (integrity, retention, exit codes)");
} finally {
  fs.rmSync(TMP, { recursive: true, force: true });
}
