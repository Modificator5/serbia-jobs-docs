#!/usr/bin/env node
// Парсер kupujemprodajem.com — раздел Poslovi (categoryId=2546).
// Данные берутся из __NEXT_DATA__ в листинге /pretraga.
// Запуск: node scrapers/kupujemprodajem.js [страниц=5]
// Режим выживания: по умолчанию только свежие страницы; полный прогон: [страниц=20]
// Разведка: docs/sources/kupujemprodajem.md

const { openDb, categoryTag } = require("./db");
const { saveJobs, report } = require("./common");

const BASE = "https://www.kupujemprodajem.com";
const CATEGORY_ID = 2546;
const LISTING = `${BASE}/pretraga?categoryId=${CATEGORY_ID}&page=`;
const UA = "Mozilla/5.0 (compatible; serbia-jobs aggregator; +local personal project)";
const PAGES = parseInt(process.argv[2] || "5", 10);

// Мусор: ищут работу сами, продают бизнес, продают фрукты и т.п.
const NOISE = [
  /^tra[žz]im posao/i,
  /^prodajem posao/i,
  /^prodaja (posla|dunje|štene|stana|automobila)/i,
  /^kupujem posao/i,
];

// «1000 EUR mesečno», «početna plata 72.000 din», «od 600 do 800 evra»
const SALARY_RE =
  /(?:od\s+)?\d[\d.,]*\s*(?:do\s+\d[\d.,]*\s*)?(?:eur|eura?|evra?|€|din(?:ara?|\.|a)?|rsd)\b/i;

function extractNextData(html) {
  const m = html.match(/id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!m) throw new Error("__NEXT_DATA__ not found");
  return JSON.parse(m[1]);
}

function isNoise(title) {
  return NOISE.some((re) => re.test(title.trim()));
}

function salaryFromTitle(title) {
  const m = title.match(SALARY_RE);
  return m ? m[0].trim() : null;
}

function cleanCity(location) {
  if (!location) return null;
  const city = location.split("|")[0].trim();
  return city || null;
}

function postedDate(posted) {
  if (!posted) return null;
  const d = posted.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : null;
}

function mapAd(ad) {
  const title = (ad.name_decoded || ad.name || "").trim();
  const fromGroup = categoryTag(ad.group_name);
  return {
    id: `kp-${ad.ad_id}`,
    source: "kupujemprodajem",
    source_url: ad.ad_url.startsWith("http") ? ad.ad_url : BASE + ad.ad_url,
    title_sr: title,
    city: cleanCity(ad.location_name),
    salary_raw: salaryFromTitle(title),
    requirements_short: null,
    company_short: null,
    snippet: (ad.description_snippet_decoded || "").trim() || null,
    category_tag: fromGroup !== "drugo" ? fromGroup : categoryTag(title),
    posted_at: postedDate(ad.posted),
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
  const ads = data.props?.initialReduxState?.search?.lastSearchResult?.ads;
  if (!Array.isArray(ads)) throw new Error(`no ads array on page ${page}`);
  return ads;
}

async function main() {
  const db = openDb();
  const stats = { saved: 0, skipped: 0, failed: 0 };
  let noise = 0;

  for (let page = 1; page <= PAGES; page++) {
    const ads = await fetchPage(page);
    if (!ads.length) {
      console.log(`page ${page}: пусто — стоп`);
      break;
    }
    const jobs = [];
    for (const ad of ads) {
      const title = (ad.name_decoded || ad.name || "").trim();
      if (isNoise(title)) {
        noise++;
        continue;
      }
      jobs.push(mapAd(ad));
    }
    const pageStats = saveJobs(db, jobs);
    stats.saved += pageStats.saved;
    stats.skipped += pageStats.skipped;
    stats.failed += pageStats.failed;
    console.log(`page ${page}: ${ads.length} ads, мусор: ${noise}`);
    await new Promise((r) => setTimeout(r, 800));
  }

  report(db, "kupujemprodajem", stats);
  db.close();
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

module.exports = { extractNextData, isNoise, salaryFromTitle, cleanCity, postedDate, mapAd };
