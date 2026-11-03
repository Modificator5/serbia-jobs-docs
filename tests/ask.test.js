#!/usr/bin/env node
// Офлайн-тест слоя ask (T1): роли вместо моделей, кеш по валидному ответу,
// один повтор при нарушении формата, переход к следующему провайдеру,
// JSONL-журнал с полями, поиск памяти. Сеть — только локальный stub-сервер.
const assert = require("node:assert/strict");
const http = require("node:http");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFile } = require("node:child_process");
const { promisify } = require("node:util");

const ROOT = path.join(__dirname, "..");
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "serbia-ask-"));
const CONFIG = path.join(TMP, "providers.json");
const requests = [];

function responseFor(model) {
  if (model === "stub-bad") return "not json at all";
  if (model === "stub-text") return "plain text answer";
  return JSON.stringify({ status: "success", data: { ok: true, model } });
}

function makeConfig(port) {
  const base = `http://127.0.0.1:${port}`;
  return {
    providers: {
      stubbad: { base_url: base, api_key_env: "", format: "openai", external: true, default_model: "stub-bad" },
      stubgood: { base_url: base, api_key_env: "", format: "openai", external: true, default_model: "stub-good" },
      stubtext: { base_url: base, api_key_env: "", format: "openai", external: true, default_model: "stub-text" },
    },
    roles: {
      TEST: [
        { provider: "stubbad", model: "stub-bad" },
        { provider: "stubgood", model: "stub-good" },
      ],
      ONE: [{ provider: "stubgood", model: "stub-good" }],
      BAD: [{ provider: "stubbad", model: "stub-bad" }],
      LOCAL: [{ provider: "stubtext", model: "stub-text" }],
    },
    legacy: {},
  };
}

const execFileP = promisify(execFile);

async function runAsk(args, env = {}) {
  const { stdout } = await execFileP("python3", [path.join(ROOT, "tools", "ask.py"), ...args], {
    encoding: "utf8",
    env: { ...process.env, ASK_CONFIG: CONFIG, ASK_ROOT: TMP, ...env },
  });
  return stdout.trim();
}

async function main() {
  const server = http.createServer((req, res) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      let model = "unknown";
      try {
        model = JSON.parse(body).model;
      } catch {}
      requests.push(model);
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({
        model,
        choices: [{ message: { content: responseFor(model) } }],
      }));
    });
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  fs.writeFileSync(CONFIG, JSON.stringify(makeConfig(port)));

  try {
    // 1. Формат нарушен у первого провайдера: один повтор, затем второй.
    const out1 = await runAsk(["TEST", "hello", "--expect", "json", "--tags", "round1"]);
    assert.match(out1, /"ok":true/);
    assert.deepEqual(requests, ["stub-bad", "stub-bad", "stub-good"]);

    const journalPath = path.join(TMP, "logs", "ask-journal.jsonl");
    const lines = fs.readFileSync(journalPath, "utf8").trim().split("\n").map((l) => JSON.parse(l));
    assert.equal(lines.length, 3);
    assert.equal(lines[0].outcome, "fallback");
    assert.equal(lines[0].provider, "stubbad");
    assert.equal(lines[0].retries, 0);
    assert.equal(lines[1].outcome, "fallback");
    assert.equal(lines[1].provider, "stubbad");
    assert.equal(lines[1].retries, 1);
    assert.equal(lines[2].outcome, "accepted");
    assert.equal(lines[2].provider, "stubgood");
    assert.equal(lines[2].role, "TEST");
    assert.equal(lines[2].origin, "worker");
    assert.ok(lines[2].prompt_hash);
    assert.ok(lines[2].tags.includes("round1"));
    assert.ok(lines[2].answer.length > 0);

    // 2. Повторный идентичный вызов — из кеша, без сети (в т.ч. из второго провайдера).
    const before = requests.length;
    const out2 = await runAsk(["TEST", "hello", "--expect", "json", "--tags", "round1"]);
    assert.equal(out2, out1);
    assert.equal(requests.length, before);

    // 3. Кеш не пишется для невалидного формата: BAD всегда падает.
    let failed = null;
    try {
      await runAsk(["BAD", "x", "--expect", "json"]);
    } catch (e) {
      failed = e;
    }
    assert.ok(failed, "BAD должен завершиться ошибкой");
    assert.equal(failed.code, 2);
    assert.equal(fs.existsSync(path.join(TMP, ".ai_memory", "stubbad.jsonl")), false);

    // 4. Роль с локальным (external=false) провайдером не выходит наружу без флага.
    const localConfig = makeConfig(port);
    localConfig.providers.stubtext.external = false;
    localConfig.roles.LOCAL.push({ provider: "stubgood", model: "stub-good" });
    fs.writeFileSync(CONFIG, JSON.stringify(localConfig));
    const localOut = await runAsk(["LOCAL", "hi"]);
    assert.equal(localOut, "plain text answer");

    console.log("OK: ask layer (roles, retry, fallback, valid cache, journal, local-only)");
  } finally {
    server.close();
    fs.rmSync(TMP, { recursive: true, force: true });
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
