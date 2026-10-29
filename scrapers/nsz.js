#!/usr/bin/env node
// Парсер nsz.gov.rs — гос. служба занятости Сербии.
// Запуск: node scrapers/nsz.js
const { execFileSync } = require("node:child_process");
const { openDb, upsertJob, categoryTag, DB_PATH } = require("./db");

const BASE = "https://nsz.gov.rs";
const LISTING = `${BASE}/employee/jobs/search`;
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36";

function fetchHtml(url) {
  return execFileSync("curl", [
    "-sL", "-m", "30",
    "-H", `user-agent: ${UA}`,
    "-H", "accept: text/html,application/xhtml+xml",
    url,
  ], { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 });
}

function extractJobs(html) {
  const jobs = [];
  const rows = html.split('<tr'); 
  for (let i = 1; i < rows.length; i++) {
    const row = '<tr' + rows[i];
    const linkMatch = row.match(/href="([^"]+?)"[^>]*>([^<]+)<\/a>/);
    if (!linkMatch) continue;

    const url = linkMatch[1].startsWith('http') ? linkMatch[1] : BASE + linkMatch[1];
    const title = linkMatch[2].trim();
    const cityMatch = row.match(/<td[^>]*>([^<]+)<\/td>/);
    const city = cityMatch ? cityMatch[1].trim() : null;
    const companyMatch = row.match(/<td[^>]*>([^<]+)<\/td>/); 
    const company = companyMatch ? companyMatch[1].trim() : null;

    jobs.push({
      source_url: url,
      title_sr: title,
      city: city,
      company_short: company,
    });
  }
  return jobs;
}

async function main() {
  const db = openDb();
  console.log(`DB: ${DB_PATH}`);
  try {
    const html = fetchHtml(LISTING);
    const jobs = extractJobs(html);
    if (!jobs.length) {
      console.log("Ни одного объявления не найдено. Возможно, изменилась вёрстка.");
    }
    let saved = 0;
    for (const job of jobs) {
      try {
        upsertJob(db, {
          id: job.source_url,
          source: "nsz",
          source_url: job.source_url,
          title_sr: job.title_sr,
          city: job.city,
          salary_raw: null,
          requirements_short: null,
          company_short: job.company_short,
          snippet: null,
          category_tag: categoryTag(job.title_sr),
          posted_at: null,
          parsed_at: new Date().toISOString(),
        });
        saved++;
      } catch (e) {
        console.error(`skip ${job.source_url}: ${e.message}`);
      }
    }
    const count = db.prepare("SELECT COUNT(*) AS n FROM jobs").get().n;
    const nszCount = db.prepare("SELECT COUNT(*) AS n FROM jobs WHERE source = 'nsz'").get().n;
    console.log(`Done. Found: ${jobs.length}, saved: ${saved}, nsz in db: ${nszCount}, total: ${count}`);
  } catch (e) {
    console.error(`Fatal error: ${e.message}`);
  } finally {
    db.close();
  }
}

main();
