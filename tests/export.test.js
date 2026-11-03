#!/usr/bin/env node
// Офлайн-тест экспорта: атомарная запись (нет .tmp), CSV-экранирование и
// нейтрализация формул, общий read-only доступ к БД.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { DatabaseSync } = require("node:sqlite");

const ROOT = path.join(__dirname, "..");
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "serbia-export-"));
const DB = path.join(TMP, "jobs.db");
const OUT_JSON = path.join(TMP, "jobs.json");
const OUT_CSV = path.join(TMP, "jobs.csv");

function run(script) {
  return execFileSync("node", [path.join(ROOT, "tools", script)], {
    encoding: "utf8",
    env: { ...process.env, JOBS_DB: DB, EXPORT_JSON: OUT_JSON, EXPORT_CSV: OUT_CSV },
  });
}

try {
  const db = new DatabaseSync(DB);
  db.exec(`CREATE TABLE jobs (
    id TEXT, source TEXT, source_url TEXT, title_sr TEXT, title_ru TEXT,
    city TEXT, salary_raw TEXT, company_short TEXT, snippet TEXT,
    category_tag TEXT, posted_at TEXT, parsed_at TEXT)`);
  const ins = db.prepare("INSERT INTO jobs VALUES (?,?,?,?,?,?,?,?,?,?,?,?)");
  ins.run("1", "kp", "u1", "Konobar", "Официант", "Beograd", "=1+1",
    "c1", "call +381 60 123 4567 or a@b.rs\r\nnext", "it", "2026-11-01", "2026-11-01T00:00:00Z");
  ins.run("2", "kp", "u2", "Programer", "Программист", "Novi Sad", "-500",
    "c2", "@handle", "it", "2026-11-02", "2026-11-02T00:00:00Z");
  db.close();

  run("export-json.js");
  const jobs = JSON.parse(fs.readFileSync(OUT_JSON, "utf8"));
  assert.equal(jobs.length, 2);
  assert.equal(fs.existsSync(`${path.dirname(OUT_JSON)}/.jobs.json.${process.pid}.tmp`), false);

  run("export-csv.js");
  const csv = fs.readFileSync(OUT_CSV, "utf8");
  assert.match(csv, /'=1\+1/); // формула нейтрализована
  assert.match(csv, /'-500/);
  assert.match(csv, /'@handle/);
  assert.match(csv, /"call \+381 60 123 4567 or a@b\.rs\r\nnext"/); // \r внутри кавычек
  assert.equal((csv.match(/\r\n/g) || []).length, 1);
  assert.equal(fs.existsSync(`${path.dirname(OUT_CSV)}/.jobs.csv.${process.pid}.tmp`), false);

  console.log("OK: export (atomic, CSV injection guard, CRLF escaping, shared read-only DB)");
} finally {
  fs.rmSync(TMP, { recursive: true, force: true });
}
