const { execFileSync } = require("node:child_process");
const { upsertJob, cleanText } = require("./db");

const UA = "Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0";

function fetchHtml(url, headers = {}) {
  const args = ["-fsSL", "--compressed", "-m", "30", "-H", `user-agent: ${UA}`];
  for (const [name, value] of Object.entries(headers)) {
    args.push("-H", `${name}: ${value}`);
  }
  args.push(url);
  return execFileSync("curl", args, { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 });
}

const MIN_DESCRIPTION = 40;

// JSON-LD JobPosting — самый устойчивый источник: его отдают почти все
// площадки, и там лежит текст без навигации и рекламы.
function extractJsonLdJob(html) {
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    let data;
    try {
      data = JSON.parse(m[1]);
    } catch {
      continue;
    }
    const found = findJobPosting(data);
    if (found) return found;
  }
  return null;
}

function findJobPosting(node) {
  if (!node || typeof node !== "object") return null;
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findJobPosting(item);
      if (found) return found;
    }
    return null;
  }
  const type = String(node["@type"] || "");
  if (type.includes("JobPosting")) return node;
  for (const value of Object.values(node)) {
    const found = findJobPosting(value);
    if (found) return found;
  }
  return null;
}

// HTML-фрагмент из JSON-строки вида "TextHtml":"<p>...</p>".
function extractJsonStringField(html, field) {
  const re = new RegExp(`"${field}"\\s*:\\s*("(?:\\\\.|[^"\\\\])*")`, "i");
  const m = html.match(re);
  if (!m) return null;
  try {
    return JSON.parse(m[1]);
  } catch {
    return null;
  }
}

function metaDescription(html) {
  const m =
    html.match(/<meta[^>]+(?:property|name)=["'](?:og|twitter):description["'][^>]+content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og|twitter):description["']/i);
  return m ? cleanText(m[1]) : null;
}

// Универсальная добыча полного текста: JSON-LD -> TextHtml/textAd -> meta.
function extractGenericDescription(html) {
  const job = extractJsonLdJob(html);
  const ld = cleanText(job?.description);
  if (ld && ld.length >= MIN_DESCRIPTION) return ld;

  for (const field of ["TextHtml", "textAd", "descriptionHtml", "description_html"]) {
    const raw = extractJsonStringField(html, field);
    const text = cleanText(raw);
    if (text && text.length >= MIN_DESCRIPTION) return text;
  }

  const meta = metaDescription(html);
  return meta && meta.length >= MIN_DESCRIPTION ? meta : null;
}

function fetchDescription(url, headers = {}) {
  const html = fetchHtml(url, headers);
  return extractGenericDescription(html);
}

// Детальные страницы нужны только новым вакансиям: старые уже имеют
// description (или их доберёт tools/fetch-descriptions.js).
function newJobsOnly(db, jobs) {
  const exists = db.prepare("SELECT 1 FROM jobs WHERE id = ?");
  return jobs.filter((job) => !exists.get(job.id));
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function attachDescriptions(jobs, fetchDetail, { limit = 40, delay = 400 } = {}) {
  let filled = 0;
  let attempted = 0;
  for (const job of jobs.slice(0, limit)) {
    if (job.description) continue;
    attempted++;
    try {
      const description = await fetchDetail(job);
      if (description) {
        job.description = description;
        filled++;
      }
    } catch (e) {
      console.error(`description ${job.source_url}: ${e.message}`);
    }
    if (delay) await sleep(delay);
  }
  return { attempted, filled };
}

function saveJobs(db, jobs) {
  let saved = 0;
  let skipped = 0;
  let failed = 0;
  for (const job of jobs) {
    try {
      if (upsertJob(db, job)) saved++;
      else skipped++;
    } catch (e) {
      failed++;
      console.error(`skip ${job.id || job.source_url}: ${e.message}`);
    }
  }
  return { saved, skipped, failed };
}

function report(db, source, stats) {
  const total = db.prepare("SELECT COUNT(*) AS n FROM jobs").get().n;
  const sourceCount = db.prepare("SELECT COUNT(*) AS n FROM jobs WHERE source = ?").get(source).n;
  console.log(
    `Done. Saved: ${stats.saved}, skipped: ${stats.skipped}, failed: ${stats.failed}, ` +
    `${source} in db: ${sourceCount}, total in db: ${total}`
  );
}

module.exports = {
  UA,
  fetchHtml,
  fetchDescription,
  extractJsonLdJob,
  extractJsonStringField,
  extractGenericDescription,
  newJobsOnly,
  attachDescriptions,
  saveJobs,
  report,
};
