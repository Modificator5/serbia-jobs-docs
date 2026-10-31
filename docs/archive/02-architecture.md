# Архитектура

```
Infostud / KP / HaloOglasi / HelloWorld
                  │
                  ▼
            scrapers/*.js
        fetch -> parse -> normalize
                  │
                  ▼
            data/jobs.db
        jobs + professions + glossary
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
  tools/export-json.js   tools/export-csv.js
        │                   │
        ▼                   ▼
     jobs.json          snapshots/jobs.csv
        │
        ▼
 index.html (GitHub Pages) + viewer/server.js
```

## Принципы

1. **Одна база.** `data/jobs.db` хранит вакансии (`jobs`), переводы (`professions`) и словарь (`glossary`).
2. **Парсеры изолированы.** Каждая площадка — отдельный модуль; общие функции в `scrapers/common.js`.
3. **Нормализация в одном месте.** `scrapers/db.js` чистит HTML-сущности, парсит зарплаты и даты, отсекает зарубежные вакансии.
4. **Один фронтенд.** Корневой `index.html` работает с локальным API и статическим `jobs.json`.
5. **Профессии переводятся единообразно.** Таблица `professions` не даёт переводить один заголовок повторно.
6. **Данные в git не попадают.** В репозитории только код и публичный `jobs.json` / CSV-снимок.

## Стек

- Node.js >= 22.5, `node:sqlite`, без npm-зависимостей.
- `curl` для площадок с TLS-защитой от обычного fetch.
- Python 3 для AI-моста `tools/ask.py`.
- GitHub Pages для статической витрины.
