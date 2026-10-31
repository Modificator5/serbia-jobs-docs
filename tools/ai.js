const path = require("node:path");
const { execFileSync } = require("node:child_process");

const ASK = path.join(__dirname, "ask.py");

function ask(prompt, provider = "ollama", timeout = 300000) {
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

module.exports = { ask, parseJson };
