#!/usr/bin/env node
// Счётчики вакансий по источникам за прогон + предупреждение о просадке.
// История: logs/source-counts.jsonl (локально). Просадка < 50% от среднего
// за предыдущие 7 дней — сигнал «парсер сломался», но не ошибка прогона.
const fs = require("node:fs");
const path = require("node:path");
const { openReadOnlyDb } = require("../scrapers/db");

const ROOT = path.join(__dirname, "..");
const HISTORY = process.env.SOURCE_COUNTS || path.join(ROOT, "logs", "source-counts.jsonl");
const WINDOW_DAYS = 7;
const DROP_RATIO = 0.5;

function today() {
  return new Date().toISOString().slice(0, 10);
}

function readHistory() {
  if (!fs.existsSync(HISTORY)) return [];
  return fs.readFileSync(HISTORY, "utf8").split("\n").filter(Boolean).map((l) => {
    try { return JSON.parse(l); } catch { return null; }
  }).filter(Boolean);
}

// Общая детекция просадки: её использует и daily-сводка, и cleanup.
function detectDrops(counts, history, day) {
  const since = new Date(Date.now() - WINDOW_DAYS * 86400000).toISOString().slice(0, 10);
  const avg = {};
  for (const row of history) {
    if (!row?.date || row.date < since || row.date === day) continue;
    for (const [source, n] of Object.entries(row.counts || {})) {
      (avg[source] ||= []).push(n);
    }
  }
  const drops = [];
  for (const [source, n] of Object.entries(counts)) {
    const past = avg[source];
    if (!past || !past.length) continue;
    const mean = past.reduce((a, b) => a + b, 0) / past.length;
    if (mean > 0 && n < mean * DROP_RATIO) {
      drops.push({ source, today: n, mean });
    }
  }
  return drops;
}

function main() {
  const db = openReadOnlyDb();
  let counts;
  try {
    counts = Object.fromEntries(
      db.prepare("SELECT source, COUNT(*) AS n FROM jobs GROUP BY source").all()
        .map((r) => [r.source, r.n])
    );
  } finally {
    db.close();
  }

  const day = today();
  const drops = detectDrops(counts, readHistory(), day);

  fs.mkdirSync(path.dirname(HISTORY), { recursive: true });
  fs.appendFileSync(HISTORY, JSON.stringify({ date: day, counts }) + "\n", "utf8");

  const summary = Object.entries(counts).map(([s, n]) => `${s}=${n}`).join(" ");
  console.log(`source-counts ${day}: ${summary || "нет данных"}`);
  for (const d of drops) {
    console.warn(`WARN просадка ${d.source}: сегодня ${d.today}, среднее за ${WINDOW_DAYS} дн. ${d.mean.toFixed(1)} (<50%)`);
  }
  return 0;
}

if (require.main === module) process.exit(main());
module.exports = { readHistory, detectDrops, main };
