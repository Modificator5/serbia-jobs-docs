#!/usr/bin/env node
// Офлайн-тест cleanup: остановившийся источник не чистится, job_words удаляются
// вместе с вакансией, отказ при >50% и обход только через --force.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { DatabaseSync } = require("node:sqlite");

const ROOT = path.join(__dirname, "..");
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "serbia-cleanup-"));
const DB = path.join(TMP, "jobs.db");
const OLD = "2020-01-01T10:00:00Z";
const TODAY = new Date().toISOString();

function run(args) {
  return spawnSync("node", [path.join(ROOT, "tools", "cleanup.js"), ...args], {
    encoding: "utf8",
    env: { ...process.env, JOBS_DB: DB },
  });
}

try {
  const db = new DatabaseSync(DB);
  db.exec(`CREATE TABLE jobs (id TEXT PRIMARY KEY, source TEXT, source_url TEXT UNIQUE, parsed_at TEXT);
           CREATE TABLE job_words (job_url TEXT, word_id INTEGER, PRIMARY KEY (job_url, word_id));`);
  const ins = db.prepare("INSERT INTO jobs VALUES (?,?,?,?)");
  ins.run("1", "kp", "u1", TODAY);       // свежая
  ins.run("2", "kp", "u2", OLD);         // устаревшая, источник жив
  ins.run("3", "hw", "u3", OLD);         // устаревшая, источник мёртв
  db.prepare("INSERT INTO job_words VALUES ('u2', 1)").run();
  db.close();

  const res = run(["30"]);
  assert.equal(res.status, 0, res.stderr);
  let check = new DatabaseSync(DB, { readOnly: true });
  assert.deepEqual(check.prepare("SELECT id FROM jobs ORDER BY id").all().map((r) => r.id), ["1", "3"]);
  assert.equal(check.prepare("SELECT COUNT(*) n FROM job_words").get().n, 0);
  check.close();

  // Теперь у kp много старых вакансий: >50% — отказ без --force.
  check = new DatabaseSync(DB);
  for (let i = 0; i < 10; i++) check.prepare("INSERT INTO jobs VALUES (?,?,?,?)").run(`x${i}`, "kp", `ux${i}`, OLD);
  check.close();
  const refused = run(["30"]);
  assert.equal(refused.status, 1);
  assert.match(refused.stderr, /Отказ:/);
  const forced = run(["30", "--force"]);
  assert.equal(forced.status, 0, forced.stderr);

  console.log("OK: cleanup (stalled skip, job_words, >50% refusal, --force)");
} finally {
  fs.rmSync(TMP, { recursive: true, force: true });
}
