const { openDb } = require("../scrapers/db");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("path");

const BATCH_SIZE = 20;

function askAI(prompt) {
  const corePath = path.join(__dirname, "../prompts/worker-core.md");
  const analystPath = path.join(__dirname, "../prompts/worker-analyst.md");
  
  const core = fs.readFileSync(corePath, "utf8");
  const analyst = fs.readFileSync(analystPath, "utf8");
  
  const fullPrompt = `${core}\n${analyst}\n\n${prompt}`;
  
  try {
    const result = execFileSync("python3", ["tools/ask.py", "gemini", fullPrompt], {
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024
    });
    return result.trim();
  } catch (e) {
    console.error(`AI call failed: ${e.message}`);
    return null;
  }
}

async function processBatch() {
  const db = openDb();
  
  const pending = db.prepare("SELECT id, source_url, title_sr, snippet FROM jobs WHERE title_ru IS NULL OR title_ru = '' LIMIT ?").all(BATCH_SIZE);
  
  if (!pending || pending.length === 0) {
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

  const response = askAI(prompt);
  if (!response) {
    db.close();
    return;
  }

  try {
    const results = JSON.parse(response);
    for (const res of results) {
      db.prepare("UPDATE jobs SET title_ru = ? WHERE id = ?").run(res.title_ru, res.id);

      if (res.terms) {
        for (const t of res.terms) {
          db.prepare("INSERT OR IGNORE INTO glossary (term, definition) VALUES (?, ?)")
            .run(t.term, t.definition);
          
          const word = db.prepare("SELECT id FROM glossary WHERE term = ?").get(t.term);
          if (word) {
            const job = pending.find(p => p.id === res.id);
            if (job) {
              db.prepare("INSERT OR IGNORE INTO job_words (job_url, word_id) VALUES (?, ?)")
                .run(job.source_url, word.id);
            }
          }
        }
      }
    }
    console.log(`Successfully processed ${results.length} vacancies.`);
  } catch (e) {
    console.error(`JSON parse error: ${e.message}`);
  }

  db.close();
}

processBatch().catch(console.error);
