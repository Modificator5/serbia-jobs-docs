#!/usr/bin/env node
// Парсер poslovi.infostud.com — берёт данные из __NEXT_DATA__ в листинге.
// Запуск: node scrapers/infostud.js [страниц=2]
// Режим выживания: по умолчанию 2 свежие страницы; полный: укажи больше.

const { openDb, categoryTag, parseDateDMY } = require("./db");
const { saveJobs, report } = require("./common");

const BASE = "https://poslovi.infostud.com";
const LISTING = `${BASE}/oglasi-za-posao?page=`;
const UA = "Mozilla/5.0 (compatible; serbia-jobs aggregator; +local personal project)";
const PAGES = parseInt(process.argv[2] || "2", 10);

function extractNextData(html) {
  const m = html.match(/id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!m) throw new Error("__NEXT_DATA__ not found");
  return JSON.parse(m[1]);
}

function requirementsShort(job) {
  const parts = [];
  if (job.shift) parts.push(job.shift);
  if (job.workFromHome) parts.push("rad od kuće");
  else if (job.hybridWork) parts.push("hibridni rad");
  if (job.cvRequired) parts.push("CV");
  return parts.slice(0, 3).join("; ") || null;
}

function mapJob(job) {
  return {
    id: `infostud-${job.id}`,
    source: "infostud",
    source_url: job.url,
    title_sr: job.standardizedPosition?.name || job.title,
    city: job.workFromHome ? "Remote" : job.location || null,
    salary_raw: job.salary?.trim() || null,
    requirements_short: requirementsShort(job),
    company_short: job.companyName || null,
    category_tag: categoryTag(job.primaryCategory?.name),
    posted_at: parseDateDMY(job.onlineViewDate),
    parsed_at: new Date().toISOString(),
  };
}

async function fetchPage(page) {
  const res = await fetch(`${LISTING}${page}`, {
    headers: { "user-agent": UA, accept: "text/html" },
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for page ${page}`);
  const html = await res.text();
  const data = extractNextData(html);
  const results = data.props?.pageProps?.initialSearchResults;
  if (!results) throw new Error(`no initialSearchResults on page ${page}`);
  return {
    jobs: results.jobs?.primary || [],
    total: results.totalPrimaryItems ?? null,
  };
}

async function main() {
  const db = openDb();
  const stats = { saved: 0, skipped: 0, failed: 0 };

  for (let page = 1; page <= PAGES; page++) {
    const { jobs, total } = await fetchPage(page);
    if (page === 1) console.log(`Total listings: ${total}`);
    const pageStats = saveJobs(db, jobs.map(mapJob));
    stats.saved += pageStats.saved;
    stats.skipped += pageStats.skipped;
    stats.failed += pageStats.failed;
    console.log(`page ${page}: ${jobs.length} jobs`);
    await new Promise((r) => setTimeout(r, 700));
  }

  report(db, "infostud", stats);
  db.close();
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

module.exports = { extractNextData, requirementsShort, mapJob };
