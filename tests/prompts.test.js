#!/usr/bin/env node
// Структурный тест промптов: наличие version, примеров, правильных форматов вывода.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const PROMPTS = [
  { file: "prompts/worker-core.md", role: "BASE", examples: 3 },
  { file: "prompts/worker-logic.md", role: "LOGIC_CORE", examples: 3, format: /STATUS:\s*\[YES\s*\|\s*NO\s*\|\s*UNKNOWN\]/ },
  { file: "prompts/worker-coder.md", role: "CODE_FAST", examples: 3, format: /ERROR:\s*<one_sentence_reason>/ },
  { file: "prompts/worker-routine.md", role: "ROUTINE_LOCAL", examples: 3, format: /"status":"success"/ },
  { file: "prompts/lead-engineer.md", role: "LEAD_ENGINEER", examples: 2, format: /\[Сравнение\]/ },
];

for (const p of PROMPTS) {
  const text = fs.readFileSync(path.join(ROOT, p.file), "utf8");
  // version header
  assert.match(text, /^version:\s*\d{4}-\d{2}-\d{2}/m, `${p.file}: missing version header`);
  // examples: at least N occurrences of "Example" or "Пример"
  const exampleCount = (text.match(/Example|Пример/g) || []).length;
  assert.ok(exampleCount >= p.examples, `${p.file}: expected at least ${p.examples} examples, found ${exampleCount}`);
  // output format marker
  if (p.format) assert.match(text, p.format, `${p.file}: missing expected format marker ${p.format}`);
  // no negative constraints language (positive phrasing)
  const negatives = text.match(/\b(Forbidden|Запрещен|не\s+добавл|не\s+используй|no\s+polite|no\s+intro)\b/gi) || [];
  assert.ok(negatives.length === 0, `${p.file}: found negative constraints phrasing: ${negatives.join(", ")}`);
}

console.log("OK: prompts (version, examples, positive phrasing, format markers)");
