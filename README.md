# Сербия — работа для русскоязычных

Агрегатор вакансий Сербии -> единая база SQLite -> Telegram + интерактивный словарь.

## Технический стек

- **Node.js >= 22.5** (встроенный `node:sqlite`, без npm-зависимостей).
- **SQLite**: `data/jobs.db` — вакансии и глоссарий.
- **AI-слой**: `tools/ask.py` (Gemini, OpenRouter, Groq, Ollama, Claude).
- **Публичный сайт**: корневые `index.html` + `jobs.json` (GitHub Pages).

## Источники

| Площадка | Статус | Особенности |
|---|---|---|
| **Infostud** | Active | Основной источник, есть зарплаты |
| **KupujemProdajem** | Active | Масс-маркет, физическая работа |
| **HaloOglasi** | Active | Классифайд, без дат в листинге |
| **HelloWorld** | Active | IT-вакансии |
| **NSZ** | Discarded | CSR, парсер удалён |
| **Jooble** | Discarded | Cloudflare challenge |

## Команды

```bash
npm run check             # проверка хелперов, jobs.json и синхронизации с БД
npm run scrape:infostud   # сбор вакансий Infostud
npm run scrape:kp         # сбор вакансий KupujemProdajem
npm run scrape:ho         # сбор вакансий HaloOglasi
npm run scrape:hw         # сбор вакансий HelloWorld
npm run translate         # перевод должностей (ollama по умолчанию)
npm run enrich            # перевод + извлечение терминов в глоссарий
npm run import:glossary   # импорт docs/glossary/bazaznanja.txt
npm run cleanup           # удаление вакансий старше 30 дней
npm run export:snapshot   # CSV-снимок в snapshots/jobs.csv
npm run export:json       # публичный jobs.json для сайта
npm run viewer            # локальный просмотр: http://localhost:7788
```

Полный цикл: `bash tools/daily.sh`.

## Структура

- `scrapers/` — парсеры и общие утилиты (`common.js`, `db.js`).
- `tools/` — импорт, перевод, очистка, экспорт, AI-мост.
- `viewer/` — локальный HTTP-сервер (использует корневой `index.html`).
- `docs/` — архитектура, источники, решения, прогресс.
- `prompts/` — системные промпты воркеров.
- `data/`, `.env` — локальные данные и секреты, в git не попадают.

## Публикация

`npm run export:json` перезаписывает корневой `jobs.json`. Корневой `index.html`
работает и с локальным API (`npm run viewer`), и со статическим `jobs.json` на
GitHub Pages. Подробнее: `docs/howto-publish.md`.
