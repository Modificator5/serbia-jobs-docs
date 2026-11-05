# Сербия — работа для русскоязычных

Агрегатор вакансий Сербии -> единая база SQLite -> Telegram + интерактивный словарь.

Правила проекта (для людей и ИИ): [`AGENTS.md`](AGENTS.md) — конституция.
Индекс документов: [`docs/README.md`](docs/README.md).
Сквозная инструкция «от и до»: [`docs/manual.md`](docs/manual.md).

## Технический стек

- **Node.js >= 22.13** (встроенный `node:sqlite`, без npm-зависимостей).
- **SQLite**: `data/jobs.db` — вакансии, `professions` (кеш переводов) и глоссарий.
- **AI-слой**: `tools/ask.py` (Gemini, OpenRouter, Groq, Ollama, Claude).
- **Витрина**: Telegram-канал (`tools/publish-telegram.js`); локальный сайт
  (`viewer`, 127.0.0.1:7788) и статический `jobs.json` для GitHub Pages.

## Источники

| Площадка | Статус | Особенности |
|---|---|---|
| **Infostud** | Active | Основной источник, есть зарплаты |
| **KupujemProdajem** | Active | Масс-маркет, физическая работа |
| **HaloOglasi** | Active | Классифайд, без дат в листинге |
| **HelloWorld** | Active | IT-вакансии |
| **NSZ** | Discarded | CSR, парсер удалён |
| **Jooble** | Discarded | Cloudflare challenge |
| Poslovi.rs / Oglasi.rs / Lako do posla | Research | см. `docs/sources.md` |

## Команды

```bash
npm run verify            # doctor + тесты (хелперы+парсеры) + docs:check
npm run runAll            # полный цикл = bash tools/daily.sh (лог в logs/)
npm run scrape:infostud   # сбор вакансий (infostud/kp/ho/hw)
npm run translate         # перевод должностей через кеш professions
npm run enrich            # перевод + термины → glossary/job_words
npm run import:glossary   # импорт docs/glossary/bazaznanja.txt
npm run cleanup           # удаление вакансий, невиденных > 30 дней
npm run export:snapshot   # CSV-снимок snapshots/jobs.csv
npm run export:json       # публичный jobs.json
npm run viewer            # локальный просмотр: http://127.0.0.1:7788
npm run publish:telegram  # публикация карточек (DRY без токена; --dry)
```

## Структура

- `scrapers/` — парсеры и общие утилиты (`common.js`, `db.js`).
- `tools/` — импорт, перевод, очистка, экспорт, Telegram, AI-мост, диагностика.
- `tests/` — офлайн-тесты парсеров на фикстурах.
- `viewer/` — локальный HTTP-сервер (использует корневой `index.html`).
- `docs/` — архитектура, источники, решения, операции, прогресс.
- `prompts/` — инструкции воркеров и оркестратора.
- `memory/` — индекс задач с тегами (в git).
- `data/`, `.env`, `logs/`, `snapshots/`, `jobs.json` — локально, в git не входят.

## CI и публикация

`.github/workflows/verify.yml` запускает `npm run verify` на каждый push/PR.
`.github/workflows/daily.yml` раз в день (05:00 UTC) парсит источники, переводит
новые заголовки и публикует новые карточки в Telegram. Для облачного запуска
нужны секреты репозитория `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHANNEL_ID`,
`GROQ_API_KEY`, `OPENROUTER_API_KEY` (см. `docs/manual.md`).
Публикация карточек вручную: `npm run publish:telegram -- --all` (нужны
`TELEGRAM_BOT_TOKEN` и `TELEGRAM_CHANNEL_ID` в `.env`; без них — dry-run).
Подробнее: `docs/operations.md`.
