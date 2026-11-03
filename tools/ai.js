const path = require("node:path");
const { execFileSync } = require("node:child_process");

const ASK = path.join(__dirname, "ask.py");

function ask(prompt, provider = "ROUTINE_LOCAL", timeout = 300000) {
  return execFileSync("python3", [ASK, provider, "-"], {
    input: prompt,
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024,
    timeout,
  }).trim();
}

function parseJson(text) {
  const clean = String(text).replace(/```(?:json)?/gi, "").trim();
  const starts = ["{", "["]
    .map((ch) => ({ ch, at: clean.indexOf(ch) }))
    .filter((x) => x.at !== -1)
    .sort((a, b) => a.at - b.at);
  if (!starts.length) return null;
  const { ch } = starts[0];
  const end = clean.lastIndexOf(ch === "{" ? "}" : "]");
  if (end < 0) return null;
  try {
    return JSON.parse(clean.slice(starts[0].at, end + 1));
  } catch {
    return null;
  }
}

// Воркер должен вернуть строгий JSON. Допускаем два вида:
//   1) конверт {"status":"success","data":...} (стандарт WORKER-ROUTINE),
//   2) «сырой» JSON (объект/массив) — обратная совместимость со старыми промптами.
function normalizeWorkerJson(text) {
  const parsed = parseJson(text);
  if (parsed === null) throw new Error("worker: ответ не является JSON");
  if (parsed && typeof parsed === "object" && !Array.isArray(parsed) &&
      Object.prototype.hasOwnProperty.call(parsed, "status")) {
    const status = String(parsed.status).toLowerCase();
    if (status !== "success") {
      throw new Error(`worker: status=${parsed.status}${parsed.message ? ` (${parsed.message})` : ""}`);
    }
    if (!Object.prototype.hasOwnProperty.call(parsed, "data")) {
      throw new Error("worker: конверт без поля data");
    }
    return parsed.data;
  }
  return parsed;
}

module.exports = { ask, parseJson, normalizeWorkerJson };
