#!/usr/bin/env node
// Проверка доков: ссылки из docs/README.md существуют, канонические файлы на месте.
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const DOCS = path.join(ROOT, "docs");
const readme = fs.readFileSync(path.join(DOCS, "README.md"), "utf8");

let failures = 0;
const fail = (m) => { console.log(`FAIL ${m}`); failures++; };

const canonical = [
  "architecture.md", "sources.md", "decisions.md", "operations.md",
  "agents.md", "onboarding.md", "progress.md", "README.md",
];
for (const f of canonical) {
  fs.existsSync(path.join(DOCS, f)) || fail(`нет канонического дока: docs/${f}`);
}

const links = [...readme.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)].map((m) => m[1]);
for (const link of links) {
  if (/^https?:\/\//.test(link)) continue;
  const target = path.join(DOCS, link);
  fs.existsSync(target) || fail(`битая ссылка в docs/README.md: ${link}`);
}

if (failures) {
  console.log(`docs:check — ${failures} проблем(ы)`);
  process.exit(1);
}
console.log(`docs:check OK (каноники: ${canonical.length}, ссылок: ${links.length})`);
