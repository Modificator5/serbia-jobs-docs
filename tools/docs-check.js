#!/usr/bin/env node
// Проверка доков: ссылки из docs/README.md существуют (якоря допускаются),
// канонические файлы на месте, пути репозитория в инструкциях существуют.
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const DOCS = path.join(ROOT, "docs");

let failures = 0;
const fail = (m) => { console.log(`FAIL ${m}`); failures++; };

const canonical = [
  "architecture.md", "sources.md", "decisions.md", "operations.md",
  "agents.md", "onboarding.md", "progress.md", "README.md",
];
for (const f of canonical) {
  fs.existsSync(path.join(DOCS, f)) || fail(`нет канонического дока: docs/${f}`);
}

// Ссылки в индексе: file.md#anchor, ./file.md и внешние URL.
const readme = fs.readFileSync(path.join(DOCS, "README.md"), "utf8");
const links = [...readme.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)].map((m) => m[1]);
for (const raw of links) {
  if (/^[a-z]+:\/\//i.test(raw) || raw.startsWith("#")) continue;
  const link = raw.split("#")[0];
  if (!link) continue;
  const target = path.resolve(DOCS, link);
  fs.existsSync(target) || fail(`битая ссылка в docs/README.md: ${raw}`);
}

// Пути репозитория в инструкциях: AGENTS.md, AI.md, SYSTEM.md, prompts/*.
const instructionFiles = ["AGENTS.md", "AI.md", "SYSTEM.md"];
const promptsDir = path.join(ROOT, "prompts");
if (fs.existsSync(promptsDir)) {
  for (const f of fs.readdirSync(promptsDir)) {
    if (f.endsWith(".md")) instructionFiles.push(path.join("prompts", f));
  }
}

const PATH_RE = /(?<![\w./-])((?:docs|tools|prompts|scrapers|viewer|tests|memory|config)\/[A-Za-z0-9._/-]+)/g;
const SKIP = /^(?:data|logs|snapshots|\.ai_memory)\//;
let checked = 0;
for (const rel of instructionFiles) {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) {
    fail(`нет файла инструкций: ${rel}`);
    continue;
  }
  const text = fs.readFileSync(abs, "utf8");
  for (const m of text.matchAll(PATH_RE)) {
    let p = m[1].replace(/:\d+$/, "").replace(/[.,;:)\]]+$/, "");
    if (!p || p.includes("*") || p.endsWith("/")) continue;
    if (SKIP.test(p)) continue;
    checked++;
    fs.existsSync(path.join(ROOT, p)) || fail(`${rel}: нет пути ${p}`);
  }
}

if (failures) {
  console.log(`docs:check — ${failures} проблем(ы)`);
  process.exit(1);
}
console.log(`docs:check OK (каноники: ${canonical.length}, ссылок: ${links.length}, путей: ${checked})`);
