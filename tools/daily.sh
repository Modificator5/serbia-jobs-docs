#!/usr/bin/env bash
set -uo pipefail
cd "$(dirname "$0")/.."

LOG="logs/daily-$(date +%F).log"
mkdir -p logs

run() {
  if ! "$@"; then
    echo "WARN: $* failed"
  fi
}

{
  echo "== daily $(date '+%F %T') =="
  run node scrapers/kupujemprodajem.js 5
  sleep 5
  run node scrapers/infostud.js 2
  sleep 5
  run node scrapers/halooglasi.js
  sleep 5
  run node scrapers/helloworld.js 3
  run node tools/translate-titles.js ollama 70
  run node tools/cleanup.js 30
  run node tools/export-csv.js
  run node tools/export-json.js
  echo "== done $(date '+%F %T') =="
} >> "$LOG" 2>&1
