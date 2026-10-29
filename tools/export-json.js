const { DatabaseSync } = require("node:sqlite");
const fs = require("node:fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "..", "data", "jobs.db");
const EXPORT_PATH = path.join(__dirname, "..", "viewer/public/jobs.json");

async function exportJobs() {
  const db = new DatabaseSync(DB_PATH);
  
  // Берем только опубликованные или все актуальные вакансии
  const jobs = db.prepare(`
    SELECT 
      source_url, title_sr, title_ru, city, salary_raw, company_short, snippet 
    FROM jobs 
    ORDER BY parsed_at DESC
  `).all();

  // Создаем папку, если её нет
  const dir = path.dirname(EXPORT_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(EXPORT_PATH, JSON.stringify(jobs, null, 2), "utf8");
  console.log(`Exported ${jobs.length} jobs to ${EXPORT_PATH}`);
  db.close();
}

exportJobs().catch(console.error);
