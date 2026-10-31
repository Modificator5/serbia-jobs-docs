#!/usr/bin/env node
// Парсер helloworld.rs — IT-площадка Сербии (от создателей Infostud).
// Разведка 2026-10-28: SSR-HTML (без __NEXT_DATA__), 30 вакансий/страницу,
// пагинация /oglasi-za-posao/stranica/N, без Cloudflare.
// В листинге: заголовок, компания, город (+формат работы), дата. Зарплаты нет
// (только на странице вакансии — экономим, не заходим).
// Запуск: node scrapers/helloworld.js [страниц=3]

const { openDb, categoryTag } = require("./db");
const { fetchHtml, saveJobs, report } = require("./common");

const BASE = "https://www.helloworld.rs";
const LISTING = `${BASE}/oglasi-za-posao/stranica/`;
const HEADERS = { accept: "text/html,application/xhtml+xml" };
const PAGES = parseInt(process.argv[2] || "3", 10);

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

async function main() {
  const db = openDb();
  const stats = { saved: 0, skipped: 0, failed: 0 };

  for (let page = 1; page <= PAGES; page++) {
    const url = page === 1 ? `${BASE}/oglasi-za-posao/` : `${LISTING}${page}`;
    const html = fetchHtml(url, HEADERS);
    const jobs = parsePage(html);
    if (!jobs.length) {
      console.log(`page ${page}: пусто (bytes=${html.length}) — стоп`);
      break;
    }
    const pageStats = saveJobs(db, jobs);
    stats.saved += pageStats.saved;
    stats.skipped += pageStats.skipped;
    stats.failed += pageStats.failed;
    console.log(`page ${page}: ${jobs.length} jobs`);
    await new Promise((r) => setTimeout(r, 800));
  }

  report(db, "helloworld", stats);
  db.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
