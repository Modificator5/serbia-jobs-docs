#!/usr/bin/env node
// Проверка публикации: только новые, без дублей и потерь.
// Запуск: node tools/verify-publish.js [--require-db]
// Без БД (например, в CI) проверка пропускается, если не указан --require-db.
const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");

const DB_PATH = process.env.JOBS_DB || path.join(__dirname, "..", "data", "jobs.db");
const REQUIRE_DB = process.argv.includes("--require-db");

const DEDUPE_KEY = `TRIM(LOWER(COALESCE(jobs.title_sr,''))) || '|' ||
  TRIM(LOWER(COALESCE(jobs.city,''))) || '|' ||
  TRIM(LOWER(COALESCE(jobs.company_short,'')))`;
const OTHER_KEY = `TRIM(LOWER(COALESCE(d.title_sr,''))) || '|' ||
  TRIM(LOWER(COALESCE(d.city,''))) || '|' ||
  TRIM(LOWER(COALESCE(d.company_short,'')))`;
const ELIGIBLE = `FROM jobs
  WHERE is_published = 0
    AND title_ru IS NOT NULL AND TRIM(title_ru) <> ''
    AND TRIM(title_sr) <> ''
    AND NOT EXISTS (
      SELECT 1 FROM jobs d
      WHERE d.id <> jobs.id
        AND d.title_ru IS NOT NULL AND TRIM(d.title_ru) <> ''
        AND ${OTHER_KEY} = ${DEDUPE_KEY}
        AND (d.is_published = 1 OR d.id < jobs.id)
    )`;

function check(db) {
  const problems = [];
  const warnings = [];
  const one = (sql) => db.prepare(sql).get().n;

  const total = one("SELECT COUNT(*) AS n FROM jobs");
  const published = one("SELECT COUNT(*) AS n FROM jobs WHERE is_published = 1");
  const eligible = one(`SELECT COUNT(*) AS n ${ELIGIBLE}`);

  const badStatus = one("SELECT COUNT(*) AS n FROM jobs WHERE is_published NOT IN (0, 1)");
  if (badStatus) problems.push(`is_published вне 0/1: ${badStatus}`);

  const publishedNoTitle = one(
    "SELECT COUNT(*) AS n FROM jobs WHERE is_published = 1 AND (title_ru IS NULL OR TRIM(title_ru) = '')"
  );
  if (publishedNoTitle) problems.push(`опубликованы без title_ru: ${publishedNoTitle}`);

  const publishedNoDate = one(
    "SELECT COUNT(*) AS n FROM jobs WHERE is_published = 1 AND published_at IS NULL"
  );
  if (publishedNoDate) problems.push(`опубликованы без published_at: ${publishedNoDate}`);

  const legacyNoMessage = one(
    "SELECT COUNT(*) AS n FROM jobs WHERE is_published = 1 AND telegram_message_id IS NULL"
  );
  if (legacyNoMessage) warnings.push(`без telegram_message_id (старые записи): ${legacyNoMessage}`);

  const duplicateMessages = db.prepare(
    `SELECT telegram_message_id AS id, COUNT(*) AS n FROM jobs
     WHERE telegram_message_id IS NOT NULL
     GROUP BY telegram_message_id HAVING COUNT(*) > 1`
  ).all();
  if (duplicateMessages.length) {
    problems.push(`дубли telegram_message_id: ${duplicateMessages.map((r) => r.id).join(", ")}`);
  }

  // Такие строки не попадут в канал: их ключ уже опубликован другой вакансией.
  const hiddenDuplicates = one(
    `SELECT COUNT(*) AS n FROM jobs
     WHERE is_published = 0 AND title_ru IS NOT NULL AND TRIM(title_ru) <> ''
       AND EXISTS (
         SELECT 1 FROM jobs d
         WHERE d.id <> jobs.id AND d.is_published = 1
           AND ${OTHER_KEY} = ${DEDUPE_KEY}
       )`
  );
  if (hiddenDuplicates) {
    warnings.push(`скрытые дубли (ключ уже опубликован): ${hiddenDuplicates}`);
  }

  const emptySource = one("SELECT COUNT(*) AS n FROM jobs WHERE TRIM(COALESCE(source_url,'')) = ''");
  if (emptySource) problems.push(`вакансии без source_url: ${emptySource}`);

  return { total, published, eligible, problems, warnings };
}

function main() {
  if (!fs.existsSync(DB_PATH)) {
    if (REQUIRE_DB) {
      console.error(`verify:publish: нет БД ${DB_PATH}`);
      process.exit(1);
    }
    console.log(`verify:publish: БД нет (${DB_PATH}) — пропущено.`);
    return;
  }
  const db = new DatabaseSync(DB_PATH, { readOnly: true });
  db.exec("PRAGMA busy_timeout = 5000;");
  try {
    const r = check(db);
    console.log(
      `verify:publish: всего ${r.total}, опубликовано ${r.published}, ` +
      `готовы к публикации ${r.eligible}.`
    );
    r.warnings.forEach((w) => console.log(`  warn ${w}`));
    if (r.problems.length) {
      r.problems.forEach((p) => console.log(`  FAIL ${p}`));
      process.exit(1);
    }
    console.log("  ok   новых дублей и потерь не найдено");
  } finally {
    db.close();
  }
}

if (require.main === module) main();

module.exports = { check, ELIGIBLE };
