const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");

const PORT = process.env.PORT || 7788;
const DB_PATH = process.env.JOBS_DB || path.join(__dirname, "..", "data", "jobs.db");
const HTML = path.join(__dirname, "index.html");

function getJobs() {
  if (!fs.existsSync(DB_PATH)) return [];
  const db = new DatabaseSync(DB_PATH, { readOnly: true });
  const jobs = db
    .prepare(
      `SELECT id, source, source_url, title_sr, title_ru, city, salary_raw,
              salary_min, salary_max, requirements_short, company_short,
              category_tag, posted_at, is_published
       FROM jobs
       ORDER BY posted_at DESC NULLS LAST, parsed_at DESC`
    )
    .all();
  const profs = db.prepare("SELECT title_sr, title_ru FROM professions").all();
  db.close();
  return { jobs, profs };
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname === "/api/jobs") {
    try {
      res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
      res.end(JSON.stringify(getJobs()));
    } catch (e) {
      res.writeHead(500, { "content-type": "application/json" });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }
  res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  res.end(fs.readFileSync(HTML));
});

server.listen(PORT, () => {
  console.log(`Просмотрщик вакансий: http://localhost:${PORT}`);
});
