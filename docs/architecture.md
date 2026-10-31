# Архитектура

## Замысел и границы

Проблема: вакансии Сербии разбросаны по площадкам, всё на сербском, без переводов.
Решение: агрегатор коротких карточек + словарь из реальных объявлений для русскоязычных.
Не делаем: полные тексты вакансий в БД, замену площадок, деньги на старте.

Конвейер: скрейп → `data/jobs.db` → перевод (кеш `professions`) → обогащение
(словарь `glossary`/`job_words`) → экспорт (CSV/JSON) → витрина (viewer → Telegram).

## Схема потоков

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
 index.html (GitHub Pages) + viewer/server.js (127.0.0.1:7788)
```

## Принципы

1. **Одна база.** `data/jobs.db` хранит вакансии (`jobs`), переводы (`professions`) и словарь (`glossary`). Единственный источник правды; в git не входит.
2. **Перевод один раз.** Уникальный `title_sr` переводится один раз в `professions`; при upsert смена `title_ru` происходит только при смене `title_sr`. Потеря `title_ru` = сломанная экономика токенов.
3. **Парсеры изолированы.** Каждая площадка — отдельный модуль; общее — `scrapers/common.js`, нормализация — `scrapers/db.js` (чистка HTML, зарплаты, даты, фильтр зарубежных вакансий, `normalizePostedAt` — даты в будущем отбрасываются).
4. **last_seen, не posted_at.** Актуальность вакансии определяется давностью последнего показа в листинге (`parsed_at` обновляется при каждом показе); `cleanup` удаляет только невиденные дольше 30 дней.
5. **Один фронтенд.** Корневой `index.html` работает с локальным API и статическим `jobs.json`; viewer слушает только `127.0.0.1`.
6. **Данные в git не попадают.** В репозитории — код, docs, prompts, memory. `data/`, `logs/`, `snapshots/`, `jobs.json`, `.env`, `.ai_memory/` — локально.

## Схема jobs.db (кратко)

```sql
jobs(id TEXT PK, source, source_url UNIQUE, title_sr, title_ru, city,
     salary_raw, salary_min, salary_max, requirements_short, company_short,
     snippet, category_tag, posted_at, parsed_at, is_published)
professions(title_sr PK, title_ru)          -- кеш переводов
glossary(id, category_id, term UNIQUE, definition, created_at)
job_words(job_url, word_id, context_snippet, PK(job_url, word_id))
glossary_categories(id, name UNIQUE)
```

Теги `category_tag`: ugostiteljstvo, turizam, trgovina, it, gradjevina,
proizvodnja, zanat, medicina, administracija, prevoz, dostava, poljoprivreda,
obrazovanje, finansije, marketing, higijena, bezbednost, fizicki, njega, drugo.

Правила: `title_sr` обязателен; `salary_min/max` — числа, остальное в `salary_raw`;
`raw_text` не хранится. Полная схема: `scrapers/db.js`.

## Стек

- Node.js >= 22.5, `node:sqlite`, без npm-зависимостей.
- `curl` для площадок с TLS-защитой от обычного fetch.
- Python 3 для AI-моста `tools/ask.py`.
- GitHub: приватный `origin` (основной) + публичное зеркало docs `mirror` (по явной задаче).

## Карточка вакансии (канон, для Telegram и сайта)

Пустые поля не выводим («н.д.» не пишем). Формат:

```
{title_sr} — {title_ru}
📍 {city} · 💰 {salary_raw} · 📅 {posted_at}
{snippet (до 3 строк, серб. оригинал)}
{source_url}
#{category_tag}          # для drugo — без хэштега
```

Счётчики просмотров, промо-метка и «pre X dana» не выводятся. Подробнее: `docs/archive/10-telegram-card.md`.

## Известные ограничения (осознанные)

- KP: зарплата только в заголовках (~5/450), компания отсутствует в листинге, дубли по городам.
- Infostud: сниппетов нет; HaloOglasi: дат/сниппетов нет; HelloWorld: дата в листинге — срок действия (не парсим).
- Jooble: Cloudflare 403 → `discarded`.
