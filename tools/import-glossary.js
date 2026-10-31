const { openDb } = require("../scrapers/db");
const fs = require("node:fs");
const path = require("path");

const BAZA_PATH = path.join(__dirname, "..", "docs/glossary/bazaznanja.txt");

async function importBazaznanja() {
  const db = openDb();
  const content = fs.readFileSync(BAZA_PATH, "utf8");
  const lines = content.split("\n");

  let currentCategory = "Общее";
  let processedTerms = 0;

  for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith("#")) {
      if (line.startsWith("##")) {
        const match = line.match(/##\s*\d*\.?\s*([^—:]+)/);
        if (match) currentCategory = match[1].trim();
      }
      continue;
    }

    if (line.startsWith("|")) {
      const cells = line.split("|").filter(c => c.trim() !== "").map(c => c.trim());
      if (cells.length >= 2 && !cells[0].toLowerCase().includes("сербский") && !cells[0].toLowerCase().includes(":---")) {
        const sr = cells[0];
        const ru = cells[1];
        const note = cells[2] || "";

        db.prepare("INSERT OR IGNORE INTO glossary_categories (name) VALUES (?)").run(currentCategory);
        const catId = db.prepare("SELECT id FROM glossary_categories WHERE name = ?").get(currentCategory).id;

        db.prepare("INSERT OR IGNORE INTO glossary (category_id, term, definition) VALUES (?, ?, ?)")
          .run(catId, sr, `${ru}. ${note}`);
        processedTerms++;
      }
    }
  }

  console.log(`Successfully imported ${processedTerms} terms from bazaznanja.txt`);
  db.close();
}

importBazaznanja().catch(console.error);
