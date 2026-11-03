#!/usr/bin/env node
// Офлайн-тесты публикатора: карточка, обрезка, аргументы (без сети).
const assert = require("node:assert/strict");
const { card, formatDate, parseArgs } = require("../tools/publish-telegram");

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

assert.equal(formatDate("2026-01-05"), "05.01.2026");
assert.equal(formatDate(null), null);
assert.deepEqual(parseArgs(["--dry", "3"]), { dry: true, limit: 3 });
assert.deepEqual(parseArgs(["7"]), { dry: false, limit: 7 });
assert.deepEqual(parseArgs(["--dry"]), { dry: true, limit: 5 });

console.log("OK: публикатор (карточка, обрезка, аргументы).");
