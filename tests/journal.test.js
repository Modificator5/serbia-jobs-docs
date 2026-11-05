#!/usr/bin/env node
// Офлайн-тест журнала: ingest сырого ask-journal, дедуп, авто-теги, поиск,
// интеграция с tools/memory.js. Сеть не нужна.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const ROOT = path.join(__dirname, "..");
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "serbia-journal-"));
const EVENTS = path.join(TMP, "events.jsonl");
const MEMORY = path.join(TMP, "tasks.jsonl");
const RAW = path.join(TMP, "ask-journal.jsonl");
const JOURNAL = path.join(TMP, "raw-fallback.jsonl");

function run(tool, args) {
  return execFileSync("node", [path.join(ROOT, "tools", tool), ...args], {
    encoding: "utf8",
    env: {
      ...process.env,
      JOURNAL_EVENTS: EVENTS,
      MEMORY_FILE: MEMORY,
      JOURNAL_FILE: RAW,
      ASK_ROOT: ROOT,
    },
  }).trim();
}

try {
  const raw = [
    {
      ts: "2026-11-05T10:00:00Z", role: "ROUTINE_LOCAL", provider: "ollama",
      tags: ["ROUTINE_LOCAL"], outcome: "accepted", prompt_hash: "h1",
      prompt: "# WORKER-CORE\nvery long system text\nЗадача: переведи слово konobar\nОбязательный формат: JSON",
      answer: "официант",
    },
    {
      ts: "2026-11-05T10:00:00Z", role: "ROUTINE_LOCAL", provider: "ollama",
      tags: ["ROUTINE_LOCAL"], outcome: "accepted", prompt_hash: "h1",
      prompt: "# WORKER-CORE\nvery long system text\nЗадача: переведи слово konobar\nОбязательный формат: JSON",
      answer: "официант",
    },
    {
      ts: "2026-11-05T10:05:00Z", role: "CODE_FAST", provider: "groq",
      tags: ["CODE_FAST"], outcome: "accepted", prompt_hash: "h2",
      prompt: "Task: почини публикацию в telegram",
      answer: "publish берёт только is_published=0",
    },
    {
      ts: "2026-11-05T10:06:00Z", role: "CODE_FAST", provider: "groq",
      tags: ["CODE_FAST", "format-fail"], outcome: "fallback", prompt_hash: "h3",
      prompt: "Task: сломанный ответ", answer: "не json",
    },
  ];
  fs.writeFileSync(RAW, raw.map((e) => JSON.stringify(e)).join("\n") + "\n");

  const first = run("journal.js", ["ingest", "--from", RAW]);
  assert.match(first, /добавлено 2, пропущено 1/);

  const events = fs.readFileSync(EVENTS, "utf8").trim().split("\n").map(JSON.parse);
  assert.equal(events.length, 2);
  assert.match(events[0].title, /переведи слово konobar/);
  assert.doesNotMatch(events[0].title, /WORKER-CORE/);
  assert.ok(events[0].tags.includes("translation"));
  assert.ok(events[1].tags.includes("telegram"));
  assert.ok(events.every((e) => e.hash));

  const again = run("journal.js", ["ingest", "--from", RAW]);
  assert.match(again, /добавлено 0/);

  run("journal.js", ["add", "Проверил словарь", "--tags", "glossary,tests", "--refs", "tests/journal.test.js"]);
  const found = run("journal.js", ["search", "словарь"]);
  assert.match(found, /Проверил словарь/);
  assert.match(found, /теги: glossary, tests/);
  const tagged = run("journal.js", ["search", "словарь", "--tag", "telegram"]);
  assert.match(tagged, /Совпадений нет/);

  const viaMemory = run("memory.js", ["search", "telegram"]);
  assert.match(viaMemory, /event, запись/);
  assert.match(viaMemory, /publish берёт только is_published=0/);

  const stats = run("journal.js", ["stats"]);
  assert.match(stats, /journal: 3 записей/);

  console.log("OK: journal (ingest, dedupe, tags, search, memory integration)");
} finally {
  fs.rmSync(TMP, { recursive: true, force: true });
}
