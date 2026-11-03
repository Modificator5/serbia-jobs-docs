#!/usr/bin/env node
// Офлайн-тест памяти (T1/T2): поиск по задачам и журналу, пропуск истёкших volatile,
// exit 0 при отсутствии совпадений, context (<=3 обмена, обрезка), add/list.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const TOOL = path.join(__dirname, "..", "tools", "memory.js");
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "serbia-memory-"));
const MEMORY = path.join(TMP, "tasks.jsonl");
const JOURNAL = path.join(TMP, "journal.jsonl");

function run(args) {
  return execFileSync("node", [TOOL, ...args], {
    encoding: "utf8",
    env: { ...process.env, MEMORY_FILE: MEMORY, JOURNAL_FILE: JOURNAL },
  }).trim();
}

try {
  // Пустая память — не ошибка.
  const empty = run(["search", "nothing"]);
  assert.match(empty, /Совпадений нет/);

  fs.writeFileSync(MEMORY, [
    JSON.stringify({ date: "2026-11-01", status: "SOLVED", task: "Translate title_ru once", tags: ["translate"], refs: ["tools/x.js:1"] }),
    JSON.stringify({ date: "2026-11-02", status: "TRIED", task: "Parse KP salary", tags: ["parser"], refs: [] }),
  ].join("\n") + "\n");

  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  fs.writeFileSync(JOURNAL, [
    JSON.stringify({ ts: "2026-11-03T10:00:00Z", role: "ROUTINE_LOCAL", provider: "ollama", prompt: "translate programmer", answer: "программист", outcome: "accepted", tags: ["translate"] }),
    JSON.stringify({ ts: "2026-11-03T11:00:00Z", role: "CODE_FAST", provider: "groq", prompt: "translate cache expired", answer: "old", outcome: "accepted", volatile: yesterday }),
    JSON.stringify({ ts: "2026-11-03T12:00:00Z", role: "CODE_FAST", provider: "groq", prompt: "translate cache fresh", answer: "new", outcome: "accepted", volatile: tomorrow }),
  ].join("\n") + "\n");

  const hits = run(["search", "translate"]);
  assert.match(hits, /memory, запись 1/);
  assert.match(hits, /journal, запись 1/);
  assert.match(hits, /journal, запись 3/);
  assert.doesNotMatch(hits, /запись 2/); // истёкший volatile скрыт

  const tagged = run(["search", "translate", "parser"]);
  assert.match(tagged, /Совпадений нет/);

  const ctx = run(["context", "translate"]);
  assert.match(ctx, /программист/);
  assert.match(ctx, /new/);
  assert.doesNotMatch(ctx, /old/);

  const longJournal = Array.from({ length: 6 }, (_, i) => JSON.stringify({
    ts: `2026-11-03T1${i}:00:00Z`, role: "ROUTINE_LOCAL", prompt: `ctx item ${i}`, answer: "a".repeat(900), outcome: "accepted",
  })).join("\n") + "\n";
  fs.writeFileSync(JOURNAL, longJournal);
  const ctx2 = run(["context", "item"]);
  assert.equal((ctx2.match(/--- /g) || []).length, 3);
  assert.ok(ctx2.length < 3 * 600, "контекст должен обрезаться");

  run(["add", "SOLVED", "Added memory test", "--tags", "tests,memory", "--refs", "tests/memory.test.js"]);
  const listed = run(["list", "SOLVED"]);
  assert.match(listed, /Added memory test/);

  console.log("OK: memory (search tasks+journal, volatile, exit 0, context, add/list)");
} finally {
  fs.rmSync(TMP, { recursive: true, force: true });
}
