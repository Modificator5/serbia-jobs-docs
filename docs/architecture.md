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
        ┌─────────┼──────────────┐
        ▼         ▼              ▼
 export-json  export-csv   publish-telegram
        │         │              │
        ▼         ▼              ▼
    jobs.json  snapshots/    Telegram-канал
        │
        ▼
 index.html (Pages) + viewer/server.js (127.0.0.1:7788)
```

## Принципы

1. **Одна база.** `data/jobs.db` хранит вакансии (`jobs`), переводы (`professions`) и словарь (`glossary`). Единственный источник правды; в git не входит.
2. **Перевод один раз.** Уникальный `title_sr` переводится один раз в `professions`; при upsert смена `title_ru` происходит только при смене `title_sr`. Потеря `title_ru` = сломанная экономика токенов.
3. **Парсеры изолированы.** Каждая площадка — отдельный модуль; общее — `scrapers/common.js`, нормализация — `scrapers/db.js` (чистка HTML, зарплаты, даты, фильтр зарубежных вакансий, `normalizePostedAt` — даты в будущем отбрасываются).
4. **last_seen, не posted_at.** Актуальность вакансии определяется давностью последнего показа в листинге (`parsed_at` обновляется при каждом показе); `cleanup` удаляет только невиденные дольше 30 дней. Разрушающий шаг защищён: остановившиеся источники пропускаются, удаление >50% требует `--force`, а перед циклом создаётся проверенная копия (`tools/backup-db.js`, `VACUUM INTO` + `integrity_check`).
5. **Один фронтенд.** Корневой `index.html` работает с локальным API и статическим `jobs.json`; viewer слушает только `127.0.0.1`.
6. **Данные в git не попадают.** В репозитории — код, docs, prompts, tests, memory. `data/`, `logs/`, `snapshots/`, `jobs.json`, `.env`, `.ai_memory/` — локально.
7. **Витрина: Telegram первичен.** Карточки публикуются `tools/publish-telegram.js`
   (пометка `is_published`, dry-run без токена). GitHub Pages — вторичный канал:
   `jobs.json` не в git, статический деплой включается отдельно (decision 2026-10-31).
8. **Слой воркеров.** `tools/ask.py` + `prompts/worker-core.md` + ролевой файл.
   Вызов идёт по роли (`ROUTINE_LOCAL`, `CODE_FAST`, `LOGIC_CORE`), а провайдеры,
   модели, внешность и порядок fallback заданы в `config/providers.json`. Рутина
   возвращает конверт `{"status":"success","data":...}`, нормализуемый
   `tools/ai.js`. Формат нарушен = синтаксическая ошибка (один повтор, затем fallback);
   журнал — `logs/ask-journal.jsonl`, кеш — `.ai_memory/<provider>.jsonl`.
9. **Офлайн-тесты.** `tests/*.test.js` проверяют парсеры (фикстуры), публикатор,
   ask/память, экспорт, backup/cleanup, схему БД без сети; `tools/check.js` —
   хелперы и синхронность артефактов (ошибки собираются в один отчёт, устаревший
   экспорт — warning); CI — `npm run verify`.

## Схема jobs.db (кратко)

```sql
jobs(id TEXT PK, source, source_url UNIQUE, title_sr, title_ru, city,
     salary_raw, salary_min, salary_max, requirements_short, company_short,
     snippet, category_tag, posted_at, parsed_at, is_published, enriched_at)
professions(title_sr PK, title_ru)          -- кеш переводов
glossary(id, category_id, term UNIQUE, definition, created_at)
job_words(job_url, word_id, context_snippet, PK(job_url, word_id))
glossary_categories(id, name UNIQUE)
```

Теги `category_tag`: ugostiteljstvo, turizam, trgovina, it, gradjevina,
proizvodnja, zanat, medicina, administracija, prevoz, dostava, poljoprivreda,
obrazovanje, finansije, marketing, higijena, bezbednost, fizicki, njega, drugo.

Правила: `title_sr` обязателен; `salary_min/max` — числа, остальное в `salary_raw`;
`raw_text` не хранится. `enriched_at` — маркер батч-обогащения: `batch-enrich`
берёт только строки с `NULL` и ставит отметку после обработки, поэтому повторный
запуск не тратит токены на уже обогащённое. Полная схема: `scrapers/db.js`.

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
