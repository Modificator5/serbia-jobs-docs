#!/usr/bin/env node
// Парсер helloworld.rs — IT-площадка Сербии (от создателей Infostud).
// Разведка 2026-10-28: SSR-HTML (без __NEXT_DATA__), 30 вакансий/страницу,
// пагинация /oglasi-za-posao/stranica/N, без Cloudflare.
// В листинге: заголовок, компания, город (+формат работы), дата. Зарплаты нет
// (только на странице вакансии — экономим, не заходим).
// Запуск: node scrapers/helloworld.js [страниц=3]

const { execFileSync } = require("node:child_process");
const { openDb, upsertJob, categoryTag, parseDateDMY, DB_PATH } = require("./db");

const BASE = "https://www.helloworld.rs";
const LISTING = `${BASE}/oglasi-za-posao/stranica/`;
const UA = "Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0";
const PAGES = parseInt(process.argv[2] || "3", 10);

function fetchHtml(url) {
  return execFileSync("curl", [
    "-sL", "-m", "30",
    "-H", `user-agent: ${UA}`,
    "-H", "accept: text/html,application/xhtml+xml",
    url,
  ], { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 });
}

function parsePage(html) {
  const jobs = [];
  const blocks = html.split("<h3>").slice(1);
  for (const b of blocks) {
    const id = (b.match(/data-job-id="(\d+)"/) || [])[1];
    const title = (b.match(/__ga4_job_title[^>]*>([\s\S]*?)<\/a>/) || [])[1];
    const rawHref = (b.match(/href="(\/posao\/[^"]+)"/) || [])[1];
    if (!id || !title || !rawHref) continue;
    const href = rawHref.split("?")[0];

    const company = (b.match(/__ga4_job_company[^>]*>([\s\S]*?)<\/a>/) || [])[1];
    const loc = (b.match(/la-map-marker[\s\S]*?<p class="text-sm font-semibold">([^<]+)<\/p>/) || [])[1];
    const date = (b.match(/(\d{2})\.(\d{2})\.(\d{4})\.?/) || []);

    let city = null;
    let format = null;
    if (loc) {
      const parts = loc.split("|").map((s) => s.trim());
      city = parts[0] || null;
      format = parts[1] || null;
    }
    jobs.push({
      id: `hw-${id}`,
      source: "helloworld",
      source_url: BASE + href,
      title_sr: title.replace(/\s+/g, " ").trim(),
      city,
      salary_raw: null,
      requirements_short: format,
      company_short: company ? company.replace(/\s+/g, " ").trim() : null,
      snippet: null,
      category_tag: (() => {
        const t = categoryTag(title);
        return t === "drugo" ? "it" : t;
      })(),
      posted_at: date[3] ? `${date[3]}-${date[2]}-${date[1]}` : null,
      parsed_at: new Date().toISOString(),
    });
  }
  return jobs;
}

function main() {
  const db = openDb();
  console.log(`DB: ${DB_PATH}`);
  let saved = 0;
  let failed = 0;

  for (let page = 1; page <= PAGES; page++) {
    const url = page === 1 ? `${BASE}/oglasi-za-posao/` : `${LISTING}${page}`;
    const html = fetchHtml(url);
    const jobs = parsePage(html);
    if (!jobs.length) {
      console.log(`page ${page}: пусто (bytes=${html.length}) — стоп`);
      break;
    }
    for (const job of jobs) {
      try {
        if (upsertJob(db, job)) saved++;
      } catch (e) {
        failed++;
        console.error(`skip ${job.id}: ${e.message}`);
      }
    }
    console.log(`page ${page}: ${jobs.length} jobs`);
    // пауза 800 мс — правило режима выживания
    const end = Date.now() + 800;
    while (Date.now() < end) { /* busy wait to keep sync main simple */ }
  }

  const count = db.prepare("SELECT COUNT(*) AS n FROM jobs").get().n;
  const hwCount = db.prepare("SELECT COUNT(*) AS n FROM jobs WHERE source = 'helloworld'").get().n;
  console.log(`Done. Saved: ${saved}, failed: ${failed}, hw in db: ${hwCount}, total: ${count}`);
  db.close();
}

main();
