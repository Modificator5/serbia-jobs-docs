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

// .env читаем СРАЗУ при старте: раньше URL с токеном строился до loadEnv(),
// и реальная отправка молча шла с пустым токеном (баг найден ревью 2026-10-31).
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
loadEnv();

const DB_PATH = process.env.JOBS_DB || path.join(ROOT, "data", "jobs.db");

function parseArgs(argv) {
  const dry = argv.includes("--dry");
  const limit = argv.map((a) => (/^\d+$/.test(a) ? parseInt(a, 10) : null))
    .find((n) => n !== null) || 5;
  return { dry, limit: Math.max(1, limit) };
}

function formatDate(iso) {
  if (!iso) return null;
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}.${m[2]}.${m[1]}` : null;
}

function clip(s, n) {
  const t = String(s || "").replace(/\s+/g, " ").trim();
  return t.length <= n ? t : t.slice(0, Math.max(0, n - 1)).trimEnd() + "…";
}

// Телефоны и e-mail в канал не попадают (персональные данные, спам).
function sanitizeSnippet(text) {
  const cleaned = String(text || "")
    .replace(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g, " ")
    .replace(/\+?\d[\d\s()-]{6,}\d/g, (m) => {
      if (m.replace(/\D/g, "").length < 7) return m;
      if (/^\d{4}-\d{2}-\d{2}$/.test(m.trim())) return m;
      return " ";
    });
  return clip(cleaned, cleaned.length);
}

const MAX_LEN = 4096;

// Собираем карточку так, чтобы ссылка гарантированно не обрезалась:
// сначала фиксированные строки, сниппет получает остаток бюджета.
function card(job) {
  const title = job.title_ru ? `${job.title_sr} — ${job.title_ru}` : job.title_sr;
  const meta = [
    job.city ? `📍 ${job.city}` : null,
    job.salary_raw ? `💰 ${job.salary_raw}` : null,
    formatDate(job.posted_at) ? `📅 ${formatDate(job.posted_at)}` : null,
  ].filter(Boolean).join(" · ");
  const url = String(job.source_url || "");
  const tag = job.category_tag && job.category_tag !== "drugo" ? `#${job.category_tag}` : "";
  const fixed = [clip(title, 200), meta, url, tag].filter(Boolean).join("\n");
  const budget = MAX_LEN - fixed.length - 2;
  const snippet = job.snippet && budget > 40
    ? clip(sanitizeSnippet(job.snippet), Math.min(300, budget))
    : null;
  const lines = [clip(title, 200)];
  if (meta) lines.push(meta);
  if (snippet) lines.push(snippet);
  lines.push(url);
  if (tag) lines.push(tag);
  return lines.join("\n").slice(0, MAX_LEN);
}

function apiUrl(token, method) {
  return `https://api.telegram.org/bot${token}/${method}`;
}

async function query(token, method, payload) {
  const res = await fetch(apiUrl(token, method), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(20000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    throw Object.assign(new Error(`Telegram ${method}: ${data.description || res.status}`), {
      retry: data?.parameters?.retry_after,
      status: res.status,
    });
  }
  return data.result;
}

// Отправка с повтором ТОЙ ЖЕ карточки при 429 (раньше карточка терялась).
async function sendCard(token, chat, text) {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      await query(token, "sendMessage", {
        chat_id: chat,
        text,
        link_preview_options: { is_disabled: true },
      });
      return true;
    } catch (e) {
      if (e.retry && attempt < 3) {
        await new Promise((r) => setTimeout(r, e.retry * 1000));
        continue;
      }
      if (e.status >= 500 && attempt < 3) {
        await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
        continue;
      }
      throw e;
    }
  }
  return false;
}

function acquireLock() {
  const lock = path.join(ROOT, "logs", ".publish.lock");
  fs.mkdirSync(path.dirname(lock), { recursive: true });
  try {
    const fd = fs.openSync(lock, "wx");
    fs.writeSync(fd, String(process.pid));
    fs.closeSync(fd);
  } catch {
    return null;
  }
  const release = () => { try { fs.unlinkSync(lock); } catch {} };
  process.on("exit", release);
  process.on("SIGINT", () => { release(); process.exit(130); });
  return release;
}

function logPublish(line) {
  const file = path.join(ROOT, "logs", `publish-${new Date().toISOString().slice(0, 7)}.log`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.appendFileSync(file, `${new Date().toISOString()} ${line}\n`);
}

async function main() {
  const { dry, limit: LIMIT } = parseArgs(process.argv.slice(2));
  const TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
  const CHANNEL = process.env.TELEGRAM_CHANNEL_ID || "";
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
       AND title_ru IS NOT NULL AND TRIM(title_ru) <> ''
     ORDER BY COALESCE(posted_at, substr(parsed_at, 1, 10)) DESC, id
     LIMIT ?`
  ).all(LIMIT);

  if (!jobs.length) {
    console.log("Нет новых вакансий для публикации.");
    db.close();
    return;
  }

  const isDry = dry || !TOKEN || !CHANNEL;
  if (isDry) {
    console.log(`DRY-RUN: ${jobs.length} карточек (токен ${TOKEN ? "есть" : "нет"}, канал ${CHANNEL || "нет"})`);
    for (const job of jobs) {
      console.log("----");
      console.log(card(job));
    }
    db.close();
    return;
  }

  const release = acquireLock();
  if (!release) {
    console.error("Публикатор уже запущен (logs/.publish.lock).");
    db.close();
    process.exit(1);
  }

  try {
    const me = await query(TOKEN, "getMe", {});
    console.log(`Бот: @${me.username}`);

    const mark = db.prepare("UPDATE jobs SET is_published = 1 WHERE id = ?");
    let sent = 0;
    for (const job of jobs) {
      try {
        await sendCard(TOKEN, CHANNEL, card(job));
        mark.run(job.id);
        sent++;
        logPublish(`OK ${job.id} ${job.source_url}`);
        await new Promise((r) => setTimeout(r, 1100));
      } catch (e) {
        logPublish(`FAIL ${job.id} ${e.message}`);
        console.error(`не отправлено ${job.id}: ${e.message}`);
        if (e.status === 401 || e.status === 403) break; // нет прав — дальше бессмысленно
      }
    }
    console.log(`Опубликовано: ${sent}/${jobs.length}.`);
    if (sent < jobs.length) process.exitCode = 1;
  } finally {
    db.close();
    release();
  }
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

module.exports = { card, formatDate, parseArgs, sanitizeSnippet };
