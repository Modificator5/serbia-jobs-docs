# Операции: запуск, пайплайн, публикация, git

## Команды

```bash
npm run verify          # doctor + тесты + docs:check (зелёный — перед любой задачей)
npm run runAll          # полный дневной цикл = bash tools/daily.sh (лог: logs/daily-YYYY-MM-DD.log)
npm run scrape:kp       # точечный скрейп (kp / infostud / ho / hw)
npm run translate       # перевод новых title_sr через кеш professions (ollama)
npm run enrich          # батч-обогащение: перевод + термины → glossary/job_words
npm run cleanup         # удалить вакансии, невиденные >30 дней (last_seen)
npm run export:csv      # снимок snapshots/jobs.csv (бэкап + тесты без сети)
npm run export:json     # публичный jobs.json
npm run viewer          # локальный сайт http://127.0.0.1:7788
node tools/memory.js search "запрос [тег]"   # память задач
./tools/ask.py <gemini|groq|ollama|openrouter|claude> "промпт"   # воркеры
```

## Цикл

Локально: `daily.sh` (парсинг → перевод → обогащение → очистка → экспорт → check).
Cron (ночь): `bash tools/daily.sh` — flock не даст запуститься дважды; код возврата
отражает упавшие шаги. Сырой прогон всех источников: редкое событие по явной команде.

## Очистка данных

Правило 30 дней по **last_seen**: вакансия считается неактуальной, если её не
показывали в листингах 30 дней (`parsed_at` — момент последнего показа).
`posted_at` — вспомогательное поле (дата публикации); даты из будущего → NULL.
Запуск входит в `daily.sh`; вручную: `node tools/cleanup.js [дней]`.

## Публикация сайта (GitHub Pages)

`jobs.json` (корень) + `index.html` — статическая витрина; `index.html` сначала
пробует локальный `/api/jobs`, затем `jobs.json`. Включение Pages: Settings →
Pages → Deploy from branch → `main` / root. Данные обновляются `export:json` +
push `jobs.json` (в git входит только по явному решению — сейчас исключён).
Локальный viewer слушает **только 127.0.0.1** (в сеть не светится).

## Git

- `origin` = приватный `Modificator5/serbia-jobs` — единственный push по умолчанию.
- `mirror` = публичное `serbia-jobs-docs` — пушить только по явной задаче.
- В git входят: код, docs, prompts, `memory/`, `tools/`, `viewer/`, `index.html`.
- В git **не входят**: `data/`, `logs/`, `snapshots/`, `jobs.json`, `.env`,
  `.ai_memory/`, `*.db*`. Только явные пути (`git add <файлы>`), никогда `git add -A`.
- Коммит после каждой завершённой задачи; структурные изменения — обновить
  `docs/architecture.md` + запись в `docs/decisions.md` тем же коммитом.

## Бэкапы

- БД — локально (`data/jobs.db`, WAL). CSV-снимок `snapshots/jobs.csv` — ручной бэкап.
- `.env` — только локально, шаблон `.env.example` в git.

## Troubleshooting

- `daily.sh уже запущен` — второй экземпляр, подождать или снять `logs/.daily.lock`.
- `doctor FAIL` — смотреть пункт проверки; секреты в git чинить немедленно.
- Сбой площадки: точечный скрейп, `check` после; лог daily — `logs/daily-*.log`.
