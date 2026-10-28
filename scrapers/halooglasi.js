#!/usr/bin/env node
// Парсер halooglasi.com — раздел /posao (главная страница раздела, SSR-HTML).
// Особенности площадки (разведка 2026-10-28): без __NEXT_DATA__; карточки —
// firm-ad-box (блоки фирм) со ссылками объявлений; в листинге НЕТ дат и
// сниппетов (posted_at/snippet = null); есть компания и город.
// Запуск: node scrapers/halooglasi.js

const { execFileSync } = require("node:child_process");
const { openDb, upsertJob, categoryTag, DB_PATH } = require("./db");

const BASE = "https://www.halooglasi.com";
const PAGE = `${BASE}/posao`;
const UA = "Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0";

// Площадка отдаёт 403 на node-fetch (TLS-отпечаток); curl проходит — грузим через него.
function fetchHtml(url) {
  return execFileSync("curl", [
    "-sL", "-m", "30",
    "-H", `user-agent: ${UA}`,
    "-H", "accept: text/html,application/xhtml+xml",
    "-H", "accept-language: sr,en;q=0.7",
    url,
  ], { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 });
}

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
  console.log(`DB: ${DB_PATH}`);
  const html = fetchHtml(PAGE);
  const ads = extractAds(html);
  if (!ads.length) throw new Error("ни одного объявления — изменилась вёрстка?");

  let saved = 0;
  let failed = 0;
  for (const ad of ads) {
    try {
      upsertJob(db, mapAd(ad));
      saved++;
    } catch (e) {
      failed++;
      console.error(`skip ho-${ad.adId}: ${e.message}`);
    }
  }
  const count = db.prepare("SELECT COUNT(*) AS n FROM jobs").get().n;
  const hoCount = db
    .prepare("SELECT COUNT(*) AS n FROM jobs WHERE source = 'halooglasi'")
    .get().n;
  console.log(
    `Done. Ads on page: ${ads.length}, saved: ${saved}, failed: ${failed}, ` +
    `ho in db: ${hoCount}, total in db: ${count}`
  );
  db.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
