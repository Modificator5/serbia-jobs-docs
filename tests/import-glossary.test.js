#!/usr/bin/env node
// Офлайн-тест import-glossary: разделители и заголовок не импортируются,
// повтор идемпотентен, конфликт перевода виден, отсутствие файла — exit 1.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { DatabaseSync } = require("node:sqlite");

const ROOT = path.join(__dirname, "..");
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "serbia-glossary-"));
const DB = path.join(TMP, "jobs.db");
const SRC = path.join(TMP, "baza.txt");

function run(file = SRC) {
  return spawnSync("node", [path.join(ROOT, "tools", "import-glossary.js")], {
    encoding: "utf8",
    env: { ...process.env, JOBS_DB: DB, GLOSSARY_FILE: file },
  });
}

try {
  fs.writeFileSync(SRC, [
    "## 1. Работа",
    "| сербский | русский | заметка |",
    "|---|---|---|",
    "| konobar | официант | муж. |",
    "| kuvar | повар | |",
    "",
  ].join("\n"));

  assert.equal(run().status, 0);
  let db = new DatabaseSync(DB, { readOnly: true });
  const terms = db.prepare("SELECT term, translation_ru, definition, source FROM glossary ORDER BY term").all();
  assert.deepEqual(terms.map((t) => t.term), ["konobar", "kuvar"]);
  assert.equal(terms.find((t) => t.term === "kuvar").definition, "повар");
  assert.equal(terms.find((t) => t.term === "kuvar").translation_ru, "повар");
  assert.equal(terms.find((t) => t.term === "konobar").translation_ru, "официант");
  assert.ok(terms.every((t) => t.source === "manual"));
  db.close();

  // Повтор: ни одного нового термина.
  const again = run();
  assert.equal(again.status, 0);
  assert.match(again.stdout, /Imported 0 new terms/);
  assert.equal(run(path.join(TMP, "missing.txt")).status, 1);

  console.log("OK: import-glossary (separators/header, idempotent, missing file)");
} finally {
  fs.rmSync(TMP, { recursive: true, force: true });
}
