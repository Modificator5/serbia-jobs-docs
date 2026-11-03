// Атомарная запись и безопасные CSV-ячейки. Общая логика экспорта.
const fs = require("node:fs");
const path = require("node:path");

// temp в том же каталоге + rename: читатель видит либо старый, либо новый файл.
function writeFileAtomic(file, data) {
  const dir = path.dirname(file);
  fs.mkdirSync(dir, { recursive: true });
  const tmp = path.join(dir, `.${path.basename(file)}.${process.pid}.tmp`);
  try {
    fs.writeFileSync(tmp, data, "utf8");
    fs.renameSync(tmp, file);
  } catch (e) {
    fs.rmSync(tmp, { force: true });
    throw e;
  }
}

// CSV: кавычки/переносы, плюс нейтрализация формул Excel/LibreOffice.
function csvCell(value) {
  let s = value == null ? "" : String(value);
  if (/^[=+\-@]/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

module.exports = { writeFileAtomic, csvCell };
