#!/usr/bin/env node
// Проверка целостности словаря и связи с вакансиями.
// Запуск: node tools/verify-glossary.js [--require-db]
// Без БД (например, в CI) проверка пропускается, если не указан --require-db.
const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");

const DB_PATH = process.env.JOBS_DB || path.join(__dirname, "..", "data", "jobs.db");
const REQUIRE_DB = process.argv.includes("--require-db");

function check(db) {
  const problems = [];
  const warnings = [];
  const one = (sql, ...args) => db.prepare(sql).get(...args).n;

  const terms = one("SELECT COUNT(*) AS n FROM glossary");
  const fromAi = one("SELECT COUNT(*) AS n FROM glossary WHERE source = 'ai'");
  const links = one("SELECT COUNT(*) AS n FROM job_words");
  const jobs = one("SELECT COUNT(*) AS n FROM jobs");
  const withDescription = one(
    "SELECT COUNT(*) AS n FROM jobs WHERE description IS NOT NULL AND LENGTH(description) >= 40"
  );

  // Термины без перевода и без объяснения бесполезны для изучения языка.
  const incomplete = one(
    `SELECT COUNT(*) AS n FROM glossary
     WHERE (translation_ru IS NULL OR TRIM(translation_ru) = '')
       AND (definition IS NULL OR TRIM(definition) = '')`
  );
  if (incomplete) warnings.push(`термины без перевода и объяснения: ${incomplete}`);

  // Дубли без учёта регистра: 'Konobar' и 'konobar' — один термин.
  const duplicates = db.prepare(
    `SELECT LOWER(term) AS term, COUNT(*) AS n FROM glossary
     GROUP BY LOWER(term) HAVING COUNT(*) > 1`
  ).all();
  if (duplicates.length) {
    problems.push(
      `дубли терминов без учёта регистра: ${duplicates.slice(0, 10).map((r) => r.term).join(", ")}`
    );
  }

  // Сироты: связь ссылается на удалённую вакансию или термин.
  const orphanJobs = one(
    `SELECT COUNT(*) AS n FROM job_words jw
     WHERE NOT EXISTS (SELECT 1 FROM jobs j WHERE j.source_url = jw.job_url)`
  );
  if (orphanJobs) problems.push(`job_words ссылается на несуществующую вакансию: ${orphanJobs}`);

  const orphanTerms = one(
    `SELECT COUNT(*) AS n FROM job_words jw
     WHERE NOT EXISTS (SELECT 1 FROM glossary g WHERE g.id = jw.word_id)`
  );
  if (orphanTerms) problems.push(`job_words ссылается на несуществующий термин: ${orphanTerms}`);

  const noContext = one(
    "SELECT COUNT(*) AS n FROM job_words WHERE context_snippet IS NULL OR TRIM(context_snippet) = ''"
  );
  if (noContext) warnings.push(`связей без контекста: ${noContext}`);

  const noExamples = one(
    "SELECT COUNT(*) AS n FROM glossary WHERE source = 'ai' AND (example_sr IS NULL OR TRIM(example_sr) = '')"
  );
  if (noExamples) warnings.push(`AI-термины без примера: ${noExamples}`);

  if (jobs > 0 && withDescription === 0) {
    warnings.push("ни у одной вакансии нет полного текста — enrich работает по заголовкам");
  }

  return {
    terms, fromAi, links, jobs, withDescription, problems, warnings,
  };
}

function main() {
  if (!fs.existsSync(DB_PATH)) {
    if (REQUIRE_DB) {
      console.error(`verify:glossary: нет БД ${DB_PATH}`);
      process.exit(1);
    }
    console.log(`verify:glossary: БД нет (${DB_PATH}) — пропущено.`);
    return;
  }
  const db = new DatabaseSync(DB_PATH, { readOnly: true });
  db.exec("PRAGMA busy_timeout = 5000;");
  try {
    const r = check(db);
    const coverage = r.jobs ? Math.round((r.withDescription / r.jobs) * 100) : 0;
    console.log(
      `verify:glossary: терминов ${r.terms} (${r.fromAi} от ИИ), связей ${r.links}, ` +
      `полный текст у ${r.withDescription}/${r.jobs} (${coverage}%).`
    );
    r.warnings.forEach((w) => console.log(`  warn ${w}`));
    if (r.problems.length) {
      r.problems.forEach((p) => console.log(`  FAIL ${p}`));
      process.exit(1);
    }
    console.log("  ok   сирот и дублей нет");
  } finally {
    db.close();
  }
}

if (require.main === module) main();

module.exports = { check };
