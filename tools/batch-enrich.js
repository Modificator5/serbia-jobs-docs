#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");
const { openDb } = require("../scrapers/db");
const { ask, parseJson } = require("./ai");

const PROVIDER = process.argv[2] || "ollama";
const BATCH_SIZE = parseInt(process.argv[3] || "20", 10);

function buildPrompt(pending) {
  const core = fs.readFileSync(path.join(__dirname, "../prompts/worker-core.md"), "utf8");
  const analyst = fs.readFileSync(path.join(__dirname, "../prompts/worker-analyst.md"), "utf8");
  return `${core}\n${analyst}\n
Задача: Обработай список вакансий.
Для каждой вакансии:
1. Переведи 'title_sr' на русский язык (title_ru).
2. Извлеки 1-3 ключевых профессиональных термина из 'title_sr' и 'snippet'.
3. Для каждого термина предоставь краткое профессиональное определение.

Данные:
${JSON.stringify(pending, null, 2)}

Формат ответа (строго JSON):
[
  {
    "id": "id_вакансии",
    "title_ru": "перевод",
    "terms": [{"term": "слово", "definition": "определение"}]
  }
]`;
}

function main() {
  const db = openDb();
  try {
    const pending = db.prepare(
      "SELECT id, source_url, title_sr, snippet FROM jobs WHERE title_ru IS NULL OR title_ru = '' LIMIT ?"
    ).all(BATCH_SIZE);
    if (!pending.length) {
      console.log("No pending vacancies for translation.");
      return;
    }

    console.log(`Processing batch of ${pending.length} vacancies (${PROVIDER})...`);
    const results = parseJson(ask(buildPrompt(pending), PROVIDER));
    if (!Array.isArray(results)) {
      throw new Error("AI returned invalid JSON");
    }

    const updateJob = db.prepare("UPDATE jobs SET title_ru = ? WHERE id = ?");
    const insertTerm = db.prepare("INSERT OR IGNORE INTO glossary (term, definition) VALUES (?, ?)");
    const selectTerm = db.prepare("SELECT id FROM glossary WHERE term = ?");
    const linkTerm = db.prepare(
      "INSERT OR IGNORE INTO job_words (job_url, word_id) VALUES (?, ?)"
    );
    const byId = new Map(pending.map((job) => [job.id, job]));

    db.exec("BEGIN");
    try {
      for (const result of results) {
        const job = byId.get(result.id);
        if (!job) continue;
        if (typeof result.title_ru === "string" && result.title_ru.trim()) {
          updateJob.run(result.title_ru.trim(), result.id);
        }
        for (const term of result.terms || []) {
          if (!term?.term || !term?.definition) continue;
          insertTerm.run(term.term, term.definition);
          const word = selectTerm.get(term.term);
          if (word) linkTerm.run(job.source_url, word.id);
        }
      }
      db.exec("COMMIT");
    } catch (e) {
      db.exec("ROLLBACK");
      throw e;
    }
    console.log(`Processed ${results.length} vacancies.`);
  } finally {
    db.close();
  }
}

try {
  main();
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
