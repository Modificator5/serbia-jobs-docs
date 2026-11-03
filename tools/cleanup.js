#!/usr/bin/env node
// Ротация: удаляем вакансии, которые не встречались в листингах дольше N дней.
// Критерий — last_seen (parsed_at обновляется при каждом показе в листинге),
// а НЕ posted_at: объявление с публикацией месячной давности, но всё ещё
// висящее на сайте, удаляться не должно.
//
// Защита от потери данных (парсер мог просто не работать):
//   1) источник, у которого НЕТ ни одной свежей записи за N дней, считается
//      «остановившимся» и пропускается целиком — его вакансии не удаляем;
//   2) если к удалению набирается больше MAX_SHARE (50%) всех вакансий,
//      скрипт отказывается работать без --force;
//   3) --dry показывает план по источникам и ничего не удаляет.
//
// Запуск: node tools/cleanup.js [дней=30] [--dry] [--force]
const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");

const ROOT = path.join(__dirname, "..");
const DB_PATH = process.env.JOBS_DB || path.join(ROOT, "data", "jobs.db");
const MAX_SHARE = 0.5;

const args = process.argv.slice(2);
const DRY = args.includes("--dry");
const FORCE = args.includes("--force");
const daysArg = args.find((a) => !a.startsWith("--"));
const DAYS = parseInt(daysArg || "30", 10);

if (!Number.isInteger(DAYS) || DAYS < 1) {
  console.error(`Некорректный срок: ${daysArg} (нужно целое >= 1)`);
  process.exit(2);
}
if (!fs.existsSync(DB_PATH)) {
  console.error(`Database not found: ${DB_PATH}`);
  process.exit(1);
}

const CUTOFF = new Date(Date.now() - DAYS * 86400000).toISOString().slice(0, 10);

const db = new DatabaseSync(DB_PATH);
db.exec("PRAGMA busy_timeout = 5000; PRAGMA foreign_keys = ON;");

// План по источникам: сколько всего, сколько устарело, когда источник видели в последний раз.
const bySource = db.prepare(
  `SELECT source,
          COUNT(*) AS total,
          SUM(CASE WHEN parsed_at < ? THEN 1 ELSE 0 END) AS stale,
          MAX(parsed_at) AS last_seen
   FROM jobs GROUP BY source`
).all(CUTOFF);

const stalled = bySource.filter((s) => s.last_seen < CUTOFF).map((s) => s.source);
const healthy = bySource.filter((s) => s.last_seen >= CUTOFF);
const total = bySource.reduce((n, s) => n + s.total, 0);
const toDelete = healthy.reduce((n, s) => n + s.stale, 0);

console.log(`Порог: parsed_at < ${CUTOFF} (${DAYS} дн.)`);
for (const s of bySource) {
  const mark = stalled.includes(s.source) ? "  ПРОПУСК: источник не обновлялся" : "";
  const seen = s.last_seen ? String(s.last_seen).slice(0, 10) : "—";
  console.log(`  ${s.source}: всего ${s.total}, устарело ${s.stale}, последний показ ${seen}${mark}`);
}

if (stalled.length) {
  console.warn(`Внимание: остановившиеся источники не чистим: ${stalled.join(", ")}. Проверьте парсеры.`);
}
if (total > 0 && toDelete / total > MAX_SHARE && !FORCE) {
  console.error(
    `Отказ: к удалению ${toDelete} из ${total} (${Math.round((100 * toDelete) / total)}% > ${MAX_SHARE * 100}%). ` +
    `Проверьте парсеры; запускайте с --force, только если уверены.`
  );
  db.close();
  process.exit(1);
}
if (DRY) {
  console.log(`DRY-RUN: было бы удалено ${toDelete} вакансий. Ничего не изменено.`);
  db.close();
  process.exit(0);
}
if (!toDelete) {
  console.log("Удалять нечего.");
  db.close();
  process.exit(0);
}

const healthyNames = healthy.map((s) => s.source);
const marks = healthyNames.map(() => "?").join(",");
const stale = `parsed_at < ? AND source IN (${marks})`;
const params = [CUTOFF, ...healthyNames];

db.exec("BEGIN");
try {
  db.prepare(`DELETE FROM job_words WHERE job_url IN (SELECT source_url FROM jobs WHERE ${stale})`)
    .run(...params);
  db.prepare(`DELETE FROM jobs WHERE ${stale}`).run(...params);
  db.exec("COMMIT");
} catch (e) {
  db.exec("ROLLBACK");
  db.close();
  throw e;
}
db.close();
console.log(`Removed ${toDelete} jobs not seen since ${CUTOFF} (last_seen > ${DAYS} days).`);
