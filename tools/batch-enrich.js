const { openDb } = require("../scrapers/db");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("path");

const BATCH_SIZE = 10;

function askAI(prompt) {
  const core = fs.readFileSync(path.join(__dirname, "../prompts/worker-core.md"), "utf8");
  const analyst = fs.readFileSync(path.join(__dirname, "../prompts/worker-analyst.md"), "utf8");
  
  const fullPrompt = `${core}\\n${analyst}\\n\\n${prompt}`;
  
  const result = execFileSync("python3", ["tools/ask.py", "gemini", fullPrompt], {
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024
  });
  return result.trim();
}

async function processBatch() {
  const db = openDb();
  
  // Находим вакансии без перевода
  const pending = db.prepare("SELECT id, source_url, title_sr, snippet FROM jobs WHERE title_ru IS NULL LIMIT ?").all(BATCH_SIZE);
  
  if (!pending.length) {
    console.log("No pending vacancies for translation.");
    db.close();
    return;
  }

  console.log(`Processing batch of ${pending.length} vacancies...`);

  const prompt = `
Задача: Обработай список вакансий.
Для каждой вакансии:
1. Переведи 'title_sr' на русский язык (title_ru).
2. Извлеки 1-3 ключевых профессиональных термина из 'title_sr' и 'snippet'.
3. Для каждого термина предоставь определение в стиле 'базы знаний' (кратко, профессионально).

Данные:
${JSON.stringify(pending, null, 2)}

Формат ответа (строго JSON):
[
  {
    "id": "id_вакансии",
    "title_ru": "перевод",
    "terms": [
      {"term": "слово", "definition": "определение"}
    ]
  }
]
`;

  try {
    const response = askAI(prompt);
    const results = JSON.parse(response);

    for (const res of results) {
      // 1. Обновляем перевод вакансии
      db.prepare("UPDATE jobs SET title_ru = ? WHERE id = ?").run(res.title_ru, res.id);

      // 2. Добавляем термины в глоссарий
      if (res.terms) {
        for (const t of res.terms) {
          db.prepare("INSERT OR IGNORE INTO glossary (term, definition) VALUES (?, ?)")
            .run(t.term, t.definition);
          
          const wordId = db.prepare("SELECT id FROM glossary WHERE term = ?").get(t.term).id;
          
          // Связываем вакансию с терминами
          db.prepare("INSERT OR IGNORE INTO job_words (job_url, word_id) VALUES (?, ?)")
            .run(pending.find(p => p.id === res.id).source_url, wordId);
        }
      }
    }
    console.log(`Successfully processed ${results.length} vacancies.`);
  } catch (e) {
    console.error(`Batch error: ${e.message}`);
  }

  db.close();
}

processBatch().catch(console.error);
