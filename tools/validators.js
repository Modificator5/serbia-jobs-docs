// Валидаторы LLM-вывода перед записью в БД или публикацией (T2.5).
// Цель — не «идеальный» перевод, а отсев явного мусора: ссылок, пустых строк,
// простыней текста и латиницы, которая не является известным термином.

const MAX_TITLE = 200;
const MAX_DEFINITION = 500;

// Латиница допустима, если это узнаваемый термин/технология или аббревиатура
// из списка ниже. Всё остальное в title_ru должно быть кириллицей.
const ALLOWED_LATIN = new Set([
  "it", "hr", "qa", "ai", "ml", "bi", "erp", "crm", "sap", "seo", "sem",
  "ui", "ux", "api", "rest", "sql", "nosql", "etl", "vm", "vpn", "gpu",
  "javascript", "js", "typescript", "ts", "node", "nodejs", "python", "java",
  "php", "golang", "go", "rust", "kotlin", "swift", "dart", "scala", "ruby",
  "c", "c++", "c#", "net", "dotnet", "html", "css", "sass", "less", "react",
  "vue", "angular", "svelte", "flutter", "reactnative", "android", "ios",
  "aws", "azure", "gcp", "docker", "kubernetes", "k8s", "git", "linux",
  "windows", "excel", "word", "powerpoint", "photoshop", "figma", "wordpress",
  "magento", "shopify", "devops", "devsecops", "cybersecurity", "backend",
  "frontend", "fullstack", "web", "mobile", "cloud", "data", "mlops",
  "test", "testing", "automation", "embedded", "firmware", "iot", "cad",
  "cam", "cnc", "bim", "revit", "autocad", "unity", "unreal", "game",
  "1c", "1с", "b2b", "b2c", "sre", "dba", "pm", "ba", "qa/qc", "qc",
]);

function countMatches(value, re) {
  return (value.match(re) || []).length;
}

function isUrlLike(value) {
  return /https?:\/\/|www\.|<|>|\n|\r/i.test(value);
}

function latinTokens(value) {
  return value.match(/[A-Za-z][A-Za-z0-9.+#/_-]*/g) || [];
}

function isAllowedLatinToken(token) {
  const lower = token.toLowerCase().replace(/[._]$/, "");
  return ALLOWED_LATIN.has(lower);
}

function isValidTitleRu(value) {
  if (typeof value !== "string") return false;
  const t = value.trim();
  if (!t || t.length > MAX_TITLE) return false;
  if (isUrlLike(t)) return false;
  const cyr = countMatches(t, /[А-Яа-яЁё]/g);
  const lat = countMatches(t, /[A-Za-z]/g);
  if (cyr === 0) return false;
  if (cyr >= lat) return true;
  return latinTokens(t).every(isAllowedLatinToken);
}

function isValidDefinition(value) {
  if (typeof value !== "string") return false;
  const t = value.trim();
  if (!t || t.length > MAX_DEFINITION) return false;
  if (isUrlLike(t)) return false;
  return true;
}

module.exports = {
  MAX_TITLE,
  MAX_DEFINITION,
  isValidTitleRu,
  isValidDefinition,
  isAllowedLatinToken,
};
