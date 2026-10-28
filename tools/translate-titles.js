#!/usr/bin/env node
// Перевод должностей: берёт только НЕпереведённые title_sr, пачками просит
// воркер (ollama/gemini), кладёт в кэш professions (title_sr → title_ru)
// и проставляет jobs.title_ru. Повторные запуски трогают только новое.
// Запуск: node tools/translate-titles.js [ollama|gemini] [размер_пачки=70]

const { DatabaseSync } = require("node:sqlite");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const ROOT = path.join(__dirname, "..");
const DB_PATH = process.env.JOBS_DB || path.join(ROOT, "data", "jobs.db");
const ASK = path.join(ROOT, "tools", "ask.py");
const PROVIDER = process.argv[2] || "ollama";
const BATCH = parseInt(process.argv[3] || "70", 10);

function ask(prompt) {
  return execFileSync("python3", [ASK, PROVIDER, "-"], {
    input: prompt,
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024,
    timeout: 300000,
  });
}

function parseJsonMap(text) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

function main() {
  const db = new DatabaseSync(DB_PATH);
  db.exec(`CREATE TABLE IF NOT EXISTS professions (
    title_sr TEXT PRIMARY KEY,
    title_ru TEXT NOT NULL
  )`);

  const pending = db.prepare(`
    SELECT DISTINCT j.title_sr FROM jobs j
    LEFT JOIN professions p ON p.title_sr = j.title_sr
    WHERE (j.title_ru IS NULL OR j.title_ru = '')
      AND p.title_sr IS NULL
      AND length(j.title_sr) BETWEEN 3 AND 120
  `).all().map((r) => r.title_sr);

  if (!pending.length) {
    console.log("Все должности уже переведены — воркеры не трогаем.");
    db.close();
    return;
  }
  console.log(`К переводу: ${pending.length} (провайдер: ${PROVIDER}, пачка: ${BATCH})`);

  const insProf = db.prepare(
    "INSERT OR REPLACE INTO professions (title_sr, title_ru) VALUES (?, ?)"
  );
  const updJob = db.prepare(
    "UPDATE jobs SET title_ru = ? WHERE title_sr = ? AND (title_ru IS NULL OR title_ru = '')"
  );

  let done = 0;
  let failed = 0;
  for (let i = 0; i < pending.length; i += BATCH) {
    const batch = pending.slice(i, i + BATCH);
    const prompt =
      "Переведи сербские названия вакансий на русский. Строго JSON-объект " +
      '{"оригинал":"перевод"}, без markdown, без пояснений, один объект.\n' +
      batch.map((t) => JSON.stringify(t)).join("\n");
    let map = null;
    try {
      map = parseJsonMap(ask(prompt));
    } catch (e) {
      console.error(`пачка ${i / BATCH + 1}: ошибка воркера: ${e.message.slice(0, 120)}`);
    }
    if (!map) {
      failed += batch.length;
      console.error(`пачка ${i / BATCH + 1}: не распознан JSON — пропущена`);
      continue;
    }
    db.exec("BEGIN");
    for (const title of batch) {
      const ru = map[title];
      if (typeof ru === "string" && ru.trim()) {
        insProf.run(title, ru.trim());
        updJob.run(ru.trim(), title);
        done++;
      } else {
        failed++;
      }
    }
    db.exec("COMMIT");
    console.log(`пачка ${Math.floor(i / BATCH) + 1}: +${batch.filter((t) => map[t]).length}`);
  }

  const left = db.prepare(
    "SELECT COUNT(*) AS n FROM jobs WHERE title_ru IS NULL OR title_ru = ''"
  ).get().n;
  console.log(`Готово. Переведено: ${done}, пропущено: ${failed}, без перевода в jobs: ${left}`);
  db.close();
}

main();
