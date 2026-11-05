#!/usr/bin/env node
// Офлайн-тест проверок публикации и словаря на временной БД.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const ROOT = path.join(__dirname, "..");
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "serbia-verify-"));
const DB = path.join(TMP, "jobs.db");
process.env.JOBS_DB = DB;

const { openDb } = require("../scrapers/db");
const db = openDb();

db.prepare(
  `INSERT INTO jobs (id, source, source_url, title_sr, title_ru, parsed_at, is_published, published_at, telegram_message_id)
   VALUES ('p1', 'test', 'https://example.com/p1', 'Posao p1', 'Работа p1', '2026-11-05', 1, '2026-11-05', 101)`
).run();
db.prepare(
  `INSERT INTO jobs (id, source, source_url, title_sr, title_ru, parsed_at)
   VALUES ('n1', 'test', 'https://example.com/n1', 'Posao n1', 'Работа n1', '2026-11-05')`
).run();
db.prepare(
  "INSERT INTO glossary (term, translation_ru, definition, source) VALUES (?, ?, ?, 'ai')"
).run("konobar", "официант", "работник зала");
db.prepare(
  "INSERT INTO job_words (job_url, word_id, context_snippet) VALUES (?, ?, ?)"
).run("https://example.com/n1", db.prepare("SELECT id FROM glossary WHERE term='konobar'").get().id, "Konobar ради");
db.close();

function run(tool, args = []) {
  return spawnSync("node", [path.join(ROOT, "tools", tool), ...args], {
    encoding: "utf8",
    env: { ...process.env, JOBS_DB: DB },
  });
}

try {
  const pub = run("verify-publish.js");
  assert.equal(pub.status, 0, pub.stdout + pub.stderr);
  const glo = run("verify-glossary.js");
  assert.equal(glo.status, 0, glo.stdout + glo.stderr);
  assert.match(glo.stdout, /терминов 1/);

  // Дубль без учёта регистра ломает словарь.
  const db2 = openDb();
  db2.prepare("INSERT INTO glossary (term, definition) VALUES (?, ?)").run("Konobar", "дубль");
  db2.close();
  const badGlossary = run("verify-glossary.js");
  assert.equal(badGlossary.status, 1);
  assert.match(badGlossary.stdout, /дубли терминов/);

  // Опубликованная вакансия без перевода — потеря.
  const db3 = openDb();
  db3.prepare(
    `INSERT INTO jobs (id, source, source_url, title_sr, title_ru, parsed_at, is_published, published_at)
     VALUES ('bad', 'test', 'https://example.com/bad', 'Posao', '', '2026-11-05', 1, '2026-11-05')`
  ).run();
  db3.close();
  const badPublish = run("verify-publish.js");
  assert.equal(badPublish.status, 1);
  assert.match(badPublish.stdout, /опубликованы без title_ru/);

  // Без БД проверка пропускается, но --require-db делает это ошибкой.
  const missing = path.join(TMP, "missing.db");
  const skip = spawnSync("node", [path.join(ROOT, "tools", "verify-publish.js")], {
    encoding: "utf8", env: { ...process.env, JOBS_DB: missing },
  });
  assert.equal(skip.status, 0);
  assert.match(skip.stdout, /пропущено/);
  const strict = spawnSync("node", [path.join(ROOT, "tools", "verify-publish.js"), "--require-db"], {
    encoding: "utf8", env: { ...process.env, JOBS_DB: missing },
  });
  assert.equal(strict.status, 1);

  console.log("OK: verify (publish/glossary, orphans, duplicates, missing DB)");
} finally {
  fs.rmSync(TMP, { recursive: true, force: true });
}
