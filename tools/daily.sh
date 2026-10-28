#!/usr/bin/env bash
# Ночной ритуал проекта: свежий парс → перевод новых должностей → CSV-снимок.
# Запуск вручную: bash tools/daily.sh
# По расписанию (03:30): crontab -e →  30 3 * * * /home/delf/repositories/serbia-jobs/tools/daily.sh
# Лог: logs/daily-ГГГГ-ММ-ДД.log
set -uo pipefail
cd "$(dirname "$0")/.."

LOG="logs/daily-$(date +%F).log"
mkdir -p logs
{
  echo "== daily $(date '+%F %T') =="
  node scrapers/kupujemprodajem.js 5 || echo "WARN: kp failed"
  sleep 5
  node scrapers/infostud.js 2 || echo "WARN: infostud failed"
  sleep 5
  node scrapers/halooglasi.js || echo "WARN: ho failed"
  node tools/translate-titles.js ollama 70 || echo "WARN: translate failed"
  node tools/export-csv.js || echo "WARN: snapshot failed"
  echo "== done $(date '+%F %T') =="
} >> "$LOG" 2>&1
