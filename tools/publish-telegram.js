#!/usr/bin/env node
// Публикация новых карточек в Telegram-канал.
// Формат карточки — docs/architecture.md («Карточка вакансии»).
// Секреты: TELEGRAM_BOT_TOKEN, TELEGRAM_CHANNEL_ID в .env (в git не входят).
// Запуск:
//   node tools/publish-telegram.js [N=5] [--dry]
//   без токена или с --dry — только печать, без сети и без пометки is_published.
const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");

const ROOT = path.join(__dirname, "..");
const DB_PATH = process.env.JOBS_DB || path.join(ROOT, "data", "jobs.db");
const LIMIT = Math.max(1, parseInt(process.argv[2] || "5", 10) || 5);
const DRY = process.argv.includes("--dry");
const TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const CHANNEL = process.env.TELEGRAM_CHANNEL_ID || "";
const API = `https://api.telegram.org/bot${TOKEN}/sendMessage`;

function loadEnv() {
  const file = path.join(ROOT, ".env");
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const s = line.trim();
    if (!s || s.startsWith("#") || !s.includes("=")) continue;
    const i = s.indexOf("=");
    const k = s.slice(0, i).trim();
    const v = s.slice(i + 1).trim().replace(/^["']|["']$/g, "");
    if (!(k in process.env)) process.env[k] = v;
  }
}

function formatDate(iso) {
  if (!iso) return null;
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}.${m[2]}.${m[1]}` : null;
}

function clip(s, n) {
  const t = String(s || "").replace(/\s+/g, " ").trim();
  return t.length <= n ? t : t.slice(0, n - 1).trimEnd() + "…";
}

function card(job) {
  const title = job.title_ru ? `${job.title_sr} — ${job.title_ru}` : job.title_sr;
  const meta = [
    job.city ? `📍 ${job.city}` : null,
    job.salary_raw ? `💰 ${job.salary_raw}` : null,
    formatDate(job.posted_at) ? `📅 ${formatDate(job.posted_at)}` : null,
  ].filter(Boolean).join(" · ");
  const lines = [clip(title, 200)];
  if (meta) lines.push(meta);
  if (job.snippet) lines.push(clip(job.snippet, 300));
  lines.push(job.source_url);
  if (job.category_tag && job.category_tag !== "drugo") lines.push(`#${job.category_tag}`);
  return lines.join("\n").slice(0, 4096);
}

async function send(text) {
  const res = await fetch(API, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: CHANNEL, text, disable_web_page_preview: true }),
    signal: AbortSignal.timeout(20000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    const retry = data?.parameters?.retry_after;
    throw Object.assign(new Error(`Telegram API: ${data.description || res.status}`), { retry });
  }
}

async function main() {
  loadEnv();
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const channel = process.env.TELEGRAM_CHANNEL_ID;
  if (!fs.existsSync(DB_PATH)) {
    console.error(`Нет базы: ${DB_PATH}`);
    process.exit(1);
  }
  const db = new DatabaseSync(DB_PATH);
  db.exec("PRAGMA busy_timeout = 5000;");
  const jobs = db.prepare(
    `SELECT id, source_url, title_sr, title_ru, city, salary_raw, snippet,
            category_tag, posted_at
     FROM jobs
     WHERE is_published = 0
     ORDER BY COALESCE(posted_at, substr(parsed_at, 1, 10)) DESC, id
     LIMIT ?`
  ).all(LIMIT);

  if (!jobs.length) {
    console.log("Нет новых вакансий для публикации.");
    db.close();
    return;
  }

  const dry = DRY || !token || !channel;
  if (dry) {
    console.log(`DRY-RUN: ${jobs.length} карточек (токен ${token ? "есть" : "нет"}, канал ${channel || "нет"})`);
    for (const job of jobs) {
      console.log("----");
      console.log(card(job));
    }
    db.close();
    return;
  }

  const mark = db.prepare("UPDATE jobs SET is_published = 1 WHERE id = ?");
  let sent = 0;
  for (const job of jobs) {
    try {
      await send(card(job));
      mark.run(job.id);
      sent++;
      await new Promise((r) => setTimeout(r, 1100));
    } catch (e) {
      console.error(`не отправлено ${job.id}: ${e.message}`);
      if (e.retry) await new Promise((r) => setTimeout(r, e.retry * 1000));
      else break;
    }
  }
  db.close();
  console.log(`Опубликовано: ${sent}/${jobs.length}.`);
  if (sent < jobs.length) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
