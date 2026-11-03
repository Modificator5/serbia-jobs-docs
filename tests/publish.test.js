#!/usr/bin/env node
// Офлайн-тесты публикатора: карточка, обрезка, аргументы (без сети).
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { DatabaseSync } = require("node:sqlite");
const { card, formatDate, parseArgs, sanitizeSnippet } = require("../tools/publish-telegram");

const job = {
  title_sr: "Konobar", title_ru: "Официант", city: "Beograd",
  salary_raw: "80.000 RSD", snippet: "Potreban konobar sa iskustvom",
  category_tag: "ugostiteljstvo", posted_at: "2026-10-31",
  source_url: "https://example.com/job/1",
};
const text = card(job);
assert.match(text, /^Konobar — Официант/);
assert.match(text, /📍 Beograd · 💰 80\.000 RSD · 📅 31\.10\.2026/);
assert.match(text, /#ugostiteljstvo$/);
assert.ok(text.includes(job.source_url));

const noTag = card({ ...job, category_tag: "drugo" });
assert.ok(!noTag.includes("#drugo"));

// Пустые поля не выводятся
const minimal = card({ title_sr: "Kuvar", source_url: "https://e/1" });
assert.equal(minimal, "Kuvar\nhttps://e/1");

// Длинный сниппет не вытесняет ссылку и не превышает 4096
const huge = card({ ...job, snippet: "x".repeat(10000) });
assert.ok(huge.length <= 4096);
assert.ok(huge.endsWith("#ugostiteljstvo"));
assert.ok(huge.includes(job.source_url));

// Контакты вырезаются, дата и зарплата остаются.
assert.equal(
  sanitizeSnippet("Pozovite +381 60 123 4567 ili pisite na hr@firma.rs, plata 80.000 RSD"),
  "Pozovite ili pisite na , plata 80.000 RSD"
);
assert.equal(sanitizeSnippet("Datum 2026-11-01, plata 50000"), "Datum 2026-11-01, plata 50000");
const withContacts = card({ ...job, snippet: "Tel 060 123 4567, mail a@b.rs" });
assert.doesNotMatch(withContacts, /060 123 4567|a@b\.rs/);

assert.equal(formatDate("2026-01-05"), "05.01.2026");
assert.equal(formatDate(null), null);
assert.deepEqual(parseArgs(["--dry", "3"]), { dry: true, limit: 3 });
assert.deepEqual(parseArgs(["7"]), { dry: false, limit: 7 });
assert.deepEqual(parseArgs(["--dry"]), { dry: true, limit: 5 });

// Публикуются только карточки с непустым title_ru.
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "serbia-publish-"));
try {
  const db = new DatabaseSync(path.join(TMP, "jobs.db"));
  db.exec(`CREATE TABLE jobs (id TEXT, source_url TEXT, title_sr TEXT, title_ru TEXT,
    city TEXT, salary_raw TEXT, snippet TEXT, category_tag TEXT, posted_at TEXT,
    parsed_at TEXT, company_short TEXT, is_published INTEGER DEFAULT 0)`);
  db.exec(`INSERT INTO jobs (id, source_url, title_sr, title_ru, is_published)
    VALUES ('a','u-a','Kuvar',NULL,0), ('b','u-b','Konobar','Официант',0)`);
  // Кросс-источниковые дубли: c/d одинаковы — публикуется c; f дубль b.
  db.exec(`INSERT INTO jobs (id, source_url, title_sr, title_ru, city, company_short, is_published)
    VALUES ('c','u-c','Programer','Программист','Beograd','Firma',0),
           ('d','u-d','Programer','Программист','Beograd','Firma',0),
           ('f','u-f','Konobar','Официант',NULL,NULL,0)`);
  db.close();
  const out = execFileSync("node", [path.join(__dirname, "..", "tools", "publish-telegram.js"), "--dry"], {
    encoding: "utf8",
    env: { ...process.env, JOBS_DB: path.join(TMP, "jobs.db") },
  });
  assert.doesNotMatch(out, /u-a/);
  assert.match(out, /u-b/);
  assert.match(out, /u-c/);
  assert.doesNotMatch(out, /u-d/);
  assert.doesNotMatch(out, /u-f/);
} finally {
  fs.rmSync(TMP, { recursive: true, force: true });
}

console.log("OK: публикатор (карточка, обрезка, контакты, title_ru, аргументы).");
