const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");

const PORT = process.env.PORT || 7788;
const DB_PATH = process.env.JOBS_DB || path.join(__dirname, "..", "data", "jobs.db");
const HTML = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");

function getJobs() {
  if (!fs.existsSync(DB_PATH)) return [];
  const db = new DatabaseSync(DB_PATH, { readOnly: true });
  try {
    return db.prepare(
      `SELECT id, source, source_url, title_sr, title_ru, city, salary_raw,
              salary_min, salary_max, requirements_short, company_short,
              snippet, category_tag, posted_at, is_published
       FROM jobs
       ORDER BY posted_at DESC NULLS LAST, parsed_at DESC`
    ).all();
  } finally {
    db.close();
  }
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname === "/api/jobs" || url.pathname === "/jobs.json") {
    try {
      res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
      res.end(JSON.stringify(getJobs()));
    } catch (e) {
      res.writeHead(500, { "content-type": "application/json" });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }
  if (url.pathname === "/" || url.pathname === "/index.html") {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(HTML);
    return;
  }
  res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
  res.end("Not found");
});

// Только loopback: локальная витрина не должна светиться в сеть.
const HOST = "127.0.0.1";
server.listen(PORT, HOST, () => {
  console.log(`Просмотрщик вакансий: http://${HOST}:${PORT}`);
});
