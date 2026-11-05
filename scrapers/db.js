const { DatabaseSync } = require("node:sqlite");
const fs = require("node:fs");
const path = require("path");

const DB_PATH = process.env.JOBS_DB || path.join(__dirname, "..", "data", "jobs.db");

// Каталог БД может отсутствовать в чистом checkout/CI: создаём его до открытия.
function ensureDbDir() {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
}

const HTML_ENTITIES = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

function decodeHtml(value) {
  if (value == null) return value;
  return String(value)
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(parseInt(code, 10)))
    .replace(/&([a-z]+);/gi, (m, name) => HTML_ENTITIES[name.toLowerCase()] ?? m);
}

function cleanText(value) {
  if (value == null) return null;
  const text = decodeHtml(String(value)).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return text || null;
}

const CATEGORY_MAP = [
  ["ugostiteljstv", "ugostiteljstvo"],
  ["kuvar", "ugostiteljstvo"],
  ["kuhar", "ugostiteljstvo"],
  ["konobar", "ugostiteljstvo"],
  ["kuhinj", "ugostiteljstvo"],
  ["šank", "ugostiteljstvo"],
  ["sank", "ugostiteljstvo"],
  ["turiz", "turizam"],
  ["trgovina", "trgovina"],
  ["prodaja", "trgovina"],
  ["it", "it"],
  ["softver", "it"],
  ["program", "it"],
  ["računar", "it"],
  ["gradjevin", "gradjevina"],
  ["građevin", "gradjevina"],
  ["proizvodnj", "proizvodnja"],
  ["zanat", "zanat"],
  ["majstor", "zanat"],
  ["keramičar", "zanat"],
  ["keramicar", "zanat"],
  ["stolar", "zanat"],
  ["bravar", "zanat"],
  ["zdravstv", "medicina"],
  ["medicin", "medicina"],
  ["farmac", "medicina"],
  ["administr", "administracija"],
  ["saobraćaj", "prevoz"],
  ["saobracaj", "prevoz"],
  ["prevoz", "prevoz"],
  ["transport", "prevoz"],
  ["logistik", "prevoz"],
  ["magacin", "prevoz"],
  ["skladiš", "prevoz"],
  ["skladist", "prevoz"],
  ["dostav", "dostava"],
  ["poljoprivred", "poljoprivreda"],
  ["obrazovan", "obrazovanje"],
  ["finance", "finansije"],
  ["finansij", "finansije"],
  ["marketing", "marketing"],
  ["ekonomij", "finansije"],
  ["računovo", "finansije"],
  ["računovod", "finansije"],
  ["ljudsk", "administracija"],
  ["pozivni", "administracija"],
  ["mašin", "proizvodnja"],
  ["masin", "proizvodnja"],
  ["elektroteh", "proizvodnja"],
  ["higijen", "higijena"],
  ["bezbedn", "bezbednost"],
  ["obezbeđ", "bezbednost"],
  ["obezbed", "bezbednost"],
  ["fizičk", "fizicki"],
  ["fizick", "fizicki"],
  ["čuvanj", "njega"],
  ["cuvanj", "njega"],
  ["negovatelj", "njega"],
  ["dadilj", "njega"],
];

function categoryTag(name) {
  if (!name) return "drugo";
  const s = name.toLowerCase();
  for (const [needle, tag] of CATEGORY_MAP) {
    // "it" — короткая игла: только как отдельное слово, иначе ловит "raditi" и т.п.
    const hit = needle === "it" ? /(^|[^a-zčćžšđ])it([^a-zčćžšđ]|$)/.test(s) : s.includes(needle);
    if (hit) return tag;
  }
  return "drugo";
}

function parseSalary(raw) {
  if (!raw) return { salary_min: null, salary_max: null };
  const nums = [...raw.matchAll(/(\d[\d.]*)/g)]
    .map((m) => parseInt(m[1].replace(/\./g, ""), 10))
    .filter((n) => Number.isFinite(n) && n >= 1000 && n <= 2_000_000);
  if (!nums.length) return { salary_min: null, salary_max: null };
  return { salary_min: Math.min(...nums), salary_max: Math.max(...nums) };
}

function parseDateDMY(s) {
  if (!s) return null;
  const m = s.match(/(\d{2})\.(\d{2})\.(\d{4})/);
  if (!m) return null;
  return `${m[3]}-${m[2]}-${m[1]}`;
}

function openReadOnlyDb() {
  ensureDbDir();
  const db = new DatabaseSync(DB_PATH, { readOnly: true });
  db.exec("PRAGMA busy_timeout = 5000;");
  return db;
}

const SCHEMA_VERSION = 2;

function ensureColumn(db, table, column, ddl) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all().map((c) => c.name);
  if (!cols.includes(column)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${ddl}`);
}

function migrate(db) {
  // Идемпотентно: старые БД без user_version и новые проходят одни и те же шаги.
  ensureColumn(db, "jobs", "snippet", "snippet TEXT");
  ensureColumn(db, "jobs", "enriched_at", "enriched_at TEXT");
  db.exec("CREATE INDEX IF NOT EXISTS idx_jobs_parsed_at ON jobs(parsed_at)");
  db.exec("CREATE INDEX IF NOT EXISTS idx_jobs_source ON jobs(source)");
  db.exec("CREATE INDEX IF NOT EXISTS idx_glossary_term_nocase ON glossary(term COLLATE NOCASE)");
  db.exec(`PRAGMA user_version = ${SCHEMA_VERSION}`);
}

function openDb() {
  ensureDbDir();
  const db = new DatabaseSync(DB_PATH);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA busy_timeout = 5000;
    PRAGMA foreign_keys = ON;
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      source TEXT NOT NULL,
      source_url TEXT NOT NULL UNIQUE,
      title_sr TEXT NOT NULL,
      title_ru TEXT,
      city TEXT,
      salary_raw TEXT,
      salary_min INTEGER,
      salary_max INTEGER,
      requirements_short TEXT,
      company_short TEXT,
      snippet TEXT,
      category_tag TEXT,
      posted_at TEXT,
      parsed_at TEXT NOT NULL,
      is_published INTEGER DEFAULT 0,
      enriched_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_jobs_city ON jobs(city);
    CREATE INDEX IF NOT EXISTS idx_jobs_category ON jobs(category_tag);
    CREATE INDEX IF NOT EXISTS idx_jobs_published ON jobs(is_published);
    CREATE TABLE IF NOT EXISTS professions (
      title_sr TEXT PRIMARY KEY,
      title_ru TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS glossary_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    );
    CREATE TABLE IF NOT EXISTS glossary (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER REFERENCES glossary_categories(id),
      term TEXT UNIQUE NOT NULL,
      definition TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS job_words (
      job_url TEXT NOT NULL,
      word_id INTEGER NOT NULL,
      context_snippet TEXT,
      FOREIGN KEY(job_url) REFERENCES jobs(source_url),
      FOREIGN KEY(word_id) REFERENCES glossary(id),
      PRIMARY KEY(job_url, word_id)
    );
  `);
  migrate(db);
  return db;
}

// Фильтр «только Сербия» (решение 2026-10-28): вакансии вне Сербии не
// парсим и не храним — для русскоязычных релокантов это не вариант.
// Только контекстные формы «в X-ии / за X-ию» — иначе ложные срабатывания
// («nemački jezik» = немецкий язык, «švedski sto» = шведская стенка).
const ABROAD_NEEDLES = [
  "europi", "evropi", "preko granic",
  "u nemačkoj", "u nemackoj", "u njemackoj", "u njemačkoj",
  "za nemačku", "za nemacku", "za njemacku",
  "u austriji", "za austriju",
  "u švajcarskoj", "u svajcarskoj", "za švajcarsku", "za svajcarsku",
  "u bugarskoj", "u rumunskoj", "u makedoniji", "u crnoj gori",
  "u švedskoj", "u svedskoj", "u norveškoj", "u norveskoj",
  "u kataru", "u emiratima", "u belgiji", "u holandiji", "u nizozemskoj",
  "u finskoj", "u danskoj", "u irskoj", "u španiji", "u spaniji",
  "u francuskoj", "u turskoj", "u grčkoj", "u grckoj",
  "u sloveniji", "u hrvatskoj", "u bosni", "u mađarskoj", "u madjarskoj",
];

// Названия стран/регионов, которые в поле city означают вакансию за границей.
// Отдельный список нужен потому, что площадки пишут «Kipar - Svi gradovi»,
// «Nemačka» и т.п. без предлога — прежние иглы такие не ловили.
const ABROAD_PLACES = [
  "kipar", "nemačka", "nemacka", "njemačka", "njemacka", "austrija",
  "švajcarska", "svajcarska", "bugarska", "rumunija", "makedonija",
  "crna gora", "švedska", "svedska", "norveška", "norveska", "katar",
  "emirati", "belgija", "holandija", "nizozemska", "finska", "danska",
  "irska", "španija", "spanija", "francuska", "turska", "grčka", "grcka",
  "slovenija", "hrvatska", "bosna", "mađarska", "madjarska", "italija",
  "poljska", "češka", "ceska", "slovačka", "slovacka", "kanada",
  "amerika", "velika britanija", "engleska", "malta", "luksemburg",
];

// «inostranstvo» — отдельно: «rad u inostranstvu» означает заграницу, но
// «rad u inostranstvu nije potreban» — наоборот, и такие вакансии терять нельзя.
function mentionsAbroad(s) {
  const re = /inostranstv\w*/gi;
  for (const m of s.matchAll(re)) {
    const before = s.slice(Math.max(0, m.index - 20), m.index);
    const after = s.slice(m.index + m[0].length, m.index + m[0].length + 40);
    if (/\b(?:nije|ne)\s+(?:potreban|potrebno|neophodan|uslov)\b/i.test(after)) continue;
    if (/(?:^|\s)(?:u|za|van|iz)\s*$/i.test(before)) return true;
  }
  return false;
}

function isAbroadJob(job) {
  const city = (job.city || "").toLowerCase();
  if (ABROAD_PLACES.some((p) => city.includes(p))) return true;
  const s = `${job.title_sr || ""} ${job.city || ""} ${job.snippet || ""}`.toLowerCase();
  if (mentionsAbroad(s)) return true;
  return ABROAD_NEEDLES.some((n) => s.includes(n));
}

// Дата из будущего (репосты/ошибки парсинга) не должна попадать в posted_at:
// иначе cleanup и сортировка ведут себя непредсказуемо.
function normalizePostedAt(s) {
  if (!s) return null;
  const today = new Date().toISOString().slice(0, 10);
  if (s > today) return null;
  return s;
}

function upsertJob(db, job) {
  const normalized = {
    ...job,
    title_sr: cleanText(job.title_sr) || "",
    city: cleanText(job.city),
    salary_raw: cleanText(job.salary_raw),
    requirements_short: cleanText(job.requirements_short),
    company_short: cleanText(job.company_short),
    snippet: cleanText(job.snippet),
    category_tag: job.category_tag || null,
    posted_at: normalizePostedAt(job.posted_at),
  };
  if (isAbroadJob(normalized)) return false;
  const { salary_min, salary_max } = parseSalary(normalized.salary_raw);

  // Ищем по id и по source_url: URL у объявления может смениться (слаг/город),
  // а id остается. При смене title_sr прежний перевод невалиден — перечитываем
  // из кеша professions, иначе помечаем NULL для повторного перевода.
  const existing = db
    .prepare("SELECT id, title_sr, source_url FROM jobs WHERE id = ? OR source_url = ? LIMIT 1")
    .get(normalized.id, normalized.source_url);

  if (!existing) {
    db.prepare(
      `INSERT INTO jobs
        (id, source, source_url, title_sr, title_ru, city, salary_raw, salary_min, salary_max,
         requirements_short, company_short, snippet, category_tag, posted_at, parsed_at, is_published)
       VALUES (?, ?, ?, ?,
         (SELECT title_ru FROM professions WHERE title_sr = ?),
         ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`
    ).run(
      normalized.id, normalized.source, normalized.source_url, normalized.title_sr,
      normalized.title_sr, normalized.city, normalized.salary_raw, salary_min, salary_max,
      normalized.requirements_short, normalized.company_short, normalized.snippet,
      normalized.category_tag, normalized.posted_at, normalized.parsed_at
    );
    return true;
  }

  // source_url UNIQUE: если новый URL уже занят другой строкой (дубль с иным id),
  // не падаем и не перетираем чужую ссылку — оставляем прежний URL этой вакансии.
  const clash = db
    .prepare("SELECT id FROM jobs WHERE source_url = ? AND id <> ? LIMIT 1")
    .get(normalized.source_url, existing.id);
  const targetUrl = clash ? existing.source_url : normalized.source_url;

  db.prepare(
    `UPDATE jobs SET
       source = ?, source_url = ?, title_sr = ?,
       title_ru = CASE
         WHEN title_sr = ? THEN title_ru
         ELSE (SELECT title_ru FROM professions WHERE title_sr = ?)
       END,
       city = ?, salary_raw = ?, salary_min = ?, salary_max = ?,
       requirements_short = ?, company_short = ?, snippet = ?,
       category_tag = ?, posted_at = ?, parsed_at = ?
     WHERE id = ?`
  ).run(
    normalized.source, targetUrl, normalized.title_sr,
    normalized.title_sr, normalized.title_sr,
    normalized.city, normalized.salary_raw, salary_min, salary_max,
    normalized.requirements_short, normalized.company_short, normalized.snippet,
    normalized.category_tag, normalized.posted_at, normalized.parsed_at,
    existing.id
  );
  return true;
}

module.exports = {
  openDb,
  openReadOnlyDb,
  upsertJob,
  parseSalary,
  categoryTag,
  parseDateDMY,
  decodeHtml,
  cleanText,
  normalizePostedAt,
  DB_PATH,
  SCHEMA_VERSION,
  isAbroadJob,
};
