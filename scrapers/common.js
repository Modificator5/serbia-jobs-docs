const { execFileSync } = require("node:child_process");
const { upsertJob } = require("./db");

const UA = "Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0";

function fetchHtml(url, headers = {}) {
  const args = ["-fsSL", "--compressed", "-m", "30", "-H", `user-agent: ${UA}`];
  for (const [name, value] of Object.entries(headers)) {
    args.push("-H", `${name}: ${value}`);
  }
  args.push(url);
  return execFileSync("curl", args, { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 });
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

module.exports = { UA, fetchHtml, saveJobs, report };
