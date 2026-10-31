#!/usr/bin/env node
// Парсер halooglasi.com — раздел /posao (главная страница раздела, SSR-HTML).
// Особенности площадки (разведка 2026-10-28): без __NEXT_DATA__; карточки —
// firm-ad-box (блоки фирм) со ссылками объявлений; в листинге НЕТ дат и
// сниппетов (posted_at/snippet = null); есть компания и город.
// Запуск: node scrapers/halooglasi.js

const { openDb, categoryTag } = require("./db");
const { fetchHtml, saveJobs, report } = require("./common");

const BASE = "https://www.halooglasi.com";
const PAGE = `${BASE}/posao`;
const HEADERS = {
  accept: "text/html,application/xhtml+xml",
  "accept-language": "sr,en;q=0.7",
};

function extractAds(html) {
  const ads = new Map(); // ad_id -> данные (дедуп по id)
  const boxes = html.split('<div class="firm-ad-box">').slice(1);
  for (const box of boxes) {
    const firm = (box.match(/alt="([^"]+)"/) || [])[1] || null;
    const re =
      /href="(\/posao\/[^"]+?(\d+)\?kid=1)"[^>]*>([^<]+)<\/a>\s*(?:<a[^>]*>\s*<span>\(([^)]+)\)<\/span>)?/g;
    let m;
    while ((m = re.exec(box)) !== null) {
      const [, url, adId, title, city] = m;
      if (!ads.has(adId)) {
        ads.set(adId, { url, adId, title: title.trim(), city: (city || "").trim(), firm });
      }
    }
  }
  return [...ads.values()];
}

function cleanCity(city) {
  if (!city || /^vi[šs]e gradova$/i.test(city)) return null;
  return city;
}

function mapAd(ad) {
  const url = ad.url.replace(/\?kid=1$/, "");
  return {
    id: `ho-${ad.adId}`,
    source: "halooglasi",
    source_url: BASE + url,
    title_sr: ad.title,
    city: cleanCity(ad.city),
    salary_raw: null,
    requirements_short: null,
    company_short: ad.firm,
    snippet: null,
    category_tag: categoryTag(`${ad.title} ${url}`),
    posted_at: null,
    parsed_at: new Date().toISOString(),
  };
}

async function main() {
  const db = openDb();
  const html = fetchHtml(PAGE, HEADERS);
  const ads = extractAds(html);
  if (!ads.length) throw new Error("ни одного объявления — изменилась вёрстка?");
  const stats = saveJobs(db, ads.map(mapAd));
  report(db, "halooglasi", stats);
  db.close();
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

module.exports = { extractAds, cleanCity, mapAd };
