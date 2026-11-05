#!/usr/bin/env bash
# Полный дневной цикл: резервная копия -> глоссарий -> скрейп -> полные тексты
# -> перевод -> обогащение -> очистка -> экспорт -> журнал -> проверка.
# Логи: logs/daily-YYYY-MM-DD.log (в git не входят).
# Скрипт завершается с кодом 1, если хоть один шаг упал (для cron/monitoring).
# Очистка (cleanup) — единственный разрушающий шаг: она выполняется только если
# резервная копия и все парсеры отработали без ошибок.
set -uo pipefail
cd "$(dirname "$0")/.."

LOG="logs/daily-$(date +%F).log"
mkdir -p logs

# Лок: параллельный запуск двух daily.sh пишет в одну БД — запрещён.
# mkdir атомарен и не требует flock (нет в части образов/BSD).
LOCK=logs/.daily.lock.d
if ! mkdir "$LOCK" 2>/dev/null; then
  if [ -f "$LOCK/pid" ] && kill -0 "$(cat "$LOCK/pid")" 2>/dev/null; then
    echo "daily.sh уже запущен (lock $LOCK, pid $(cat "$LOCK/pid")) — выходим."
    exit 1
  fi
  echo "Снимаю устаревший лок $LOCK (процесс не жив)."
  rm -rf "$LOCK"
  mkdir "$LOCK" || { echo "Не удалось взять лок $LOCK"; exit 1; }
fi
echo $$ > "$LOCK/pid"
release_lock() { rm -rf "$LOCK"; }
trap release_lock EXIT INT TERM

exec > >(tee -a "$LOG") 2>&1

FAILED=0
run() {
  local label="$1"; shift
  local t0=$(date +%s)
  printf '[%s] RUN  %s\n' "$(date +%T)" "$label"
  if "$@"; then
    printf '[%s] OK   %s (%ss)\n' "$(date +%T)" "$label" "$(( $(date +%s) - t0 ))"
  else
    printf '[%s] FAIL %s (exit %s)\n' "$(date +%T)" "$label" "$?"
    FAILED=1
  fi
}

echo "== daily start $(date '+%F %T') =="

# Копия состояния ДО любых изменений за день (переводы, глоссарий, вакансии).
run backup      node tools/backup-db.js
run glossary    node tools/import-glossary.js
run scrape:kp   node scrapers/kupujemprodajem.js 5
sleep 5
run scrape:in   node scrapers/infostud.js 2
sleep 5
run scrape:ho   node scrapers/halooglasi.js
sleep 5
run scrape:hw   node scrapers/helloworld.js 3
run source-counts node tools/source-stats.js

# Полные тексты нужны словарю: парсеры сохраняют их для новых вакансий,
# здесь постепенно добираем старые (по 40 за прогон, чтобы не злить площадки).
run descriptions node tools/fetch-descriptions.js 40

# Фиксируем, всё ли в порядке к этому моменту (копия + парсеры), до разрушающего шага.
SAFE_TO_CLEAN=$FAILED

run translate   node tools/translate-titles.js ROUTINE_LOCAL 70
run enrich      node tools/batch-enrich.js ROUTINE_LOCAL 20
if [ "$SAFE_TO_CLEAN" -eq 0 ]; then
  run cleanup   node tools/cleanup.js 30
else
  echo "[$(date +%T)] SKIP cleanup: резервная копия или парсер завершились с ошибкой"
fi
run export:csv  node tools/export-csv.js
run export:json node tools/export-json.js
run export:gloss node tools/export-glossary.js
run journal     node tools/journal.js ingest
run check       node tools/check.js

echo "== daily done $(date '+%F %T') failed=$FAILED =="
exit $FAILED
