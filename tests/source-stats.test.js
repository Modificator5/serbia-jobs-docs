#!/usr/bin/env node
// Офлайн-тест счётчиков источников: просадка <50% от среднего за 7 дней — warning,
// история пополняется, отсутствие истории не даёт предупреждений.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { DatabaseSync } = require("node:sqlite");

const ROOT = path.join(__dirname, "..");
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "serbia-stats-"));
const DB = path.join(TMP, "jobs.db");
const HISTORY = path.join(TMP, "counts.jsonl");

function run() {
  return spawnSync("node", [path.join(ROOT, "tools", "source-stats.js")], {
    encoding: "utf8",
    env: { ...process.env, JOBS_DB: DB, SOURCE_COUNTS: HISTORY },
  });
}

try {
  const db = new DatabaseSync(DB);
  db.exec("CREATE TABLE jobs (id TEXT, source TEXT)");
  db.exec("INSERT INTO jobs VALUES ('1','kp'),('2','kp'),('3','hw'),('4','hw'),('5','hw'),('6','hw')");
  db.close();

  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  fs.writeFileSync(HISTORY, JSON.stringify({ date: yesterday, counts: { kp: 10, hw: 4 } }) + "\n");

  const res = run();
  assert.equal(res.status, 0, res.stderr);
  assert.match(res.stdout, /kp=2/);
  assert.match(res.stderr, /WARN просадка kp: сегодня 2, среднее за 7 дн\. 10\.0/);
  assert.doesNotMatch(res.stderr, /просадка hw/);

  const lines = fs.readFileSync(HISTORY, "utf8").trim().split("\n").map((l) => JSON.parse(l));
  assert.equal(lines.length, 2);
  assert.deepEqual(lines[1].counts, { kp: 2, hw: 4 });

  // Без истории — только сводка, без warning.
  fs.writeFileSync(HISTORY, "");
  const fresh = run();
  assert.equal(fresh.status, 0);
  assert.doesNotMatch(fresh.stderr, /WARN/);

  console.log("OK: source-stats (weekly average, drop warning, history, empty history)");
} finally {
  fs.rmSync(TMP, { recursive: true, force: true });
}
