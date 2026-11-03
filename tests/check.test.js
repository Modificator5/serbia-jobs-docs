#!/usr/bin/env node
// Офлайн-тест tools/check.js: устаревший jobs.json — предупреждение, не ошибка;
// ошибки артефактов собираются в один отчёт; сверка счётчиков только для свежего экспорта.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { DatabaseSync } = require("node:sqlite");

const ROOT = path.join(__dirname, "..");
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "serbia-check-"));
const DB = path.join(TMP, "jobs.db");
const JSON_PATH = path.join(TMP, "jobs.json");

function run() {
  return spawnSync("node", [path.join(ROOT, "tools", "check.js")], {
    encoding: "utf8",
    env: { ...process.env, JOBS_DB: DB, JOBS_JSON: JSON_PATH, CI: "" },
  });
}

function writeJson(rows, olderThanDb) {
  fs.writeFileSync(JSON_PATH, JSON.stringify(rows));
  if (olderThanDb) {
    const old = new Date(Date.now() - 60000);
    fs.utimesSync(JSON_PATH, old, old);
  }
}

try {
  const db = new DatabaseSync(DB);
  db.exec("CREATE TABLE jobs (id TEXT, source_url TEXT, title_sr TEXT, title_ru TEXT)");
  db.exec("INSERT INTO jobs VALUES ('1','u1','Konobar',NULL),('2','u2','Programer',NULL)");
  db.close();

  // 1. Устаревший экспорт: счётчики не сверяются, exit 0.
  writeJson([{ source_url: "u1", title_sr: "Konobar" }], true);
  const stale = run();
  assert.equal(stale.status, 0, stale.stderr);
  assert.match(stale.stderr, /сверка счётчиков пропущена/);

  // 2. Свежий экспорт с двумя разными дефектами: оба в отчёте, exit 1.
  writeJson([{ title_sr: "Konobar" }, { source_url: "u2" }], false);
  const bad = run();
  assert.equal(bad.status, 1);
  assert.match(bad.stderr, /jobs\[0\]: нет source_url/);
  assert.match(bad.stderr, /jobs\[1\]: нет заголовка/);

  // 3. Свежий экспорт с расхождением счётчиков: ошибка.
  writeJson([
    { source_url: "u1", title_sr: "a" },
    { source_url: "u2", title_sr: "b" },
    { source_url: "u3", title_sr: "c" },
  ], false);
  const mismatch = run();
  assert.equal(mismatch.status, 1);
  assert.match(mismatch.stderr, /рассинхронизирован/);

  console.log("OK: check.js (stale export warns, aggregated errors, count gate)");
} finally {
  fs.rmSync(TMP, { recursive: true, force: true });
}
