#!/usr/bin/env node
// Офлайн-тесты парсеров на синтетических фикстурах (без сети).
// Фикстуры воспроизводят разметку, на которой работают regex-парсеры.
const assert = require("node:assert/strict");

const infostud = require("../scrapers/infostud");
const kp = require("../scrapers/kupujemprodajem");
const halo = require("../scrapers/halooglasi");
const hw = require("../scrapers/helloworld");

// --- Infostud: __NEXT_DATA__ ---
const infostudHtml = `<html><script id="__NEXT_DATA__" type="application/json">${JSON.stringify({
  props: { pageProps: { initialSearchResults: {
    totalPrimaryItems: 3374,
    jobs: { primary: [{
      id: 42, url: "https://poslovi.infostud.com/posao/42",
      title: "Konobar", standardizedPosition: { name: "Konobar" },
      location: "Beograd", salary: "neto 80.000 RSD", companyName: "Firma DOO",
      primaryCategory: { name: "Ugostiteljstvo" }, onlineViewDate: "28.10.2026",
      shift: "Smena", cvRequired: true,
    }] },
  } } },
})}</script></html>`;
const infostudJob = infostud.mapJob(
  infostud.extractNextData(infostudHtml).props.pageProps.initialSearchResults.jobs.primary[0]
);
assert.equal(infostudJob.id, "infostud-42");
assert.equal(infostudJob.title_sr, "Konobar");
assert.equal(infostudJob.city, "Beograd");
assert.equal(infostudJob.salary_raw, "neto 80.000 RSD");
assert.equal(infostudJob.company_short, "Firma DOO");
assert.equal(infostudJob.category_tag, "ugostiteljstvo");
assert.equal(infostudJob.posted_at, "2026-10-28");
assert.match(infostudJob.requirements_short, /Smena/);
assert.throws(() => infostud.extractNextData("<html></html>"), /__NEXT_DATA__/);

// --- KupujemProdajem: __NEXT_DATA__ + фильтры ---
const kpHtml = `<script id="__NEXT_DATA__" type="application/json">${JSON.stringify({
  props: { initialReduxState: { search: { lastSearchResult: { ads: [{
    ad_id: 99, name: "Konobar", name_decoded: "Konobar",
    location_name: "Beograd | Zemun", group_name: "Ugostiteljstvo",
    description_snippet_decoded: "Potreban konobar", posted: "2026-10-27T10:00:00",
    ad_url: "/poslovi/konobar/99",
  }] } } } },
})}</script>`;
const kpAd = kp.extractNextData(kpHtml)
  .props.initialReduxState.search.lastSearchResult.ads[0];
const kpJob = kp.mapAd(kpAd);
assert.equal(kpJob.id, "kp-99");
assert.equal(kpJob.source_url, "https://www.kupujemprodajem.com/poslovi/konobar/99");
assert.equal(kpJob.city, "Beograd");
assert.equal(kpJob.snippet, "Potreban konobar");
assert.equal(kpJob.category_tag, "ugostiteljstvo");
assert.equal(kpJob.posted_at, "2026-10-27");
assert.equal(kp.isNoise("Tražim posao negovatelja"), true);
assert.equal(kp.isNoise("Konobar"), false);
assert.equal(kp.salaryFromTitle("1000 EUR mesečno"), "1000 EUR");
assert.equal(kp.cleanCity("Niš | Centar"), "Niš");
assert.equal(kp.postedDate("bad"), null);

// --- HaloOglasi: SSR-блоки firm-ad-box ---
const haloHtml = `<div class="firm-ad-box"><img alt="Firma DOO">` +
  `<a href="/posao/konobar-beograd/12345?kid=1">Konobar</a>` +
  `<a href="#"><span>(Beograd)</span></a></div>`;
const haloAds = halo.extractAds(haloHtml);
assert.equal(haloAds.length, 1);
const haloJob = halo.mapAd(haloAds[0]);
assert.equal(haloJob.id, "ho-12345");
assert.equal(haloJob.source_url, "https://www.halooglasi.com/posao/konobar-beograd/12345");
assert.equal(haloJob.title_sr, "Konobar");
assert.equal(haloJob.city, "Beograd");
assert.equal(haloJob.company_short, "Firma DOO");
assert.equal(haloJob.posted_at, null);
assert.equal(halo.cleanCity("više gradova"), null);

// --- HelloWorld: SSR-блоки h3, дата = срок действия (posted_at null) ---
const hwHtml = `<h3><a data-job-id="777" href="/posao/konobar-777?x=1" class="__ga4_job_title">Konobar</a>` +
  `<a class="__ga4_job_company">Firma</a>` +
  `<span class="la-map-marker"></span><p class="text-sm font-semibold">Beograd | puno radno vreme</p></h3>`;
const hwJobs = hw.parsePage(hwHtml);
assert.equal(hwJobs.length, 1);
assert.equal(hwJobs[0].id, "hw-777");
assert.equal(hwJobs[0].source_url, "https://www.helloworld.rs/posao/konobar-777");
assert.equal(hwJobs[0].title_sr, "Konobar");
assert.equal(hwJobs[0].city, "Beograd");
assert.equal(hwJobs[0].requirements_short, "puno radno vreme");
assert.equal(hwJobs[0].company_short, "Firma");
assert.equal(hwJobs[0].posted_at, null);

// --- Фильтр зарубежных вакансий (поле city) ---
const { isAbroadJob } = require("../scrapers/db");
assert.equal(isAbroadJob({ city: "Kipar - Svi gradovi" }), true);
assert.equal(isAbroadJob({ city: "Nemačka" }), true);
assert.equal(isAbroadJob({ title_sr: "Kuvar", city: "Beograd" }), false);
assert.equal(isAbroadJob({ title_sr: "Konobar", city: "Novi Sad" }), false);
assert.equal(isAbroadJob({ title_sr: "Radnik", city: "Niš", snippet: "rad u Nemačkoj" }), true);

// --- Слой воркеров: конверт WORKER-ROUTINE ---
const { normalizeWorkerJson } = require("../tools/ai");
assert.deepEqual(normalizeWorkerJson('{"status":"success","data":[1,2]}'), [1, 2]);
assert.deepEqual(normalizeWorkerJson('[{"a":1}]'), [{ a: 1 }]);
assert.throws(() => normalizeWorkerJson('{"status":"error","message":"bad"}'), /status=error/);
assert.throws(() => normalizeWorkerJson("not json"), /не является JSON/);

console.log("OK: parser-фикстуры (infostud, kp, halooglasi, helloworld) + конверт воркера.");
