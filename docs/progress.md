# Прогресс

Хронология сеансов. Детальная история до 2026-10-31: `archive/07-progress.md`.

## 2026-10-28 → 10-30 (кратко)

Каркас → Infostud/KP/HaloOglasi/HelloWorld → единая `jobs.db` (≈725 вакансий) →
кеш перевода `professions` → глоссарий из `bazaznanja.txt` + вакансий → CSV/JSON
экспорт, локальный сайт → Jooble discarded (Cloudflare), NSZ discarded (CSR) →
refactor: `common.js`, `check.js`, `cleanup.js`, `ai.js`, единый `index.html`.

## 2026-10-31 — P0: стабилизация и конституция

Сделано:
- **Git**: один коммит структурной чистки; в git только код/docs/prompts/memory;
  `jobs.json`, `data/`, `logs/`, `.ai_memory/` — в `.gitignore`. Push в `origin`;
  двойной push-URL убран, добавлен remote `mirror` (зеркало docs, по явной задаче).
- **Конституция**: `AGENTS.md` (правила, память, git, экономия токенов, DoD),
  `CLAUDE.md` — указатель; `docs/README.md` — индекс канонов.
- **Память**: `memory/tasks.jsonl` + `tools/memory.js` (search/list/add, теги
  SOLVED/TRIED/REJECTED/PENDING).
- **Критические баги**:
  - `upsertJob`: конфликт по `id`/`source_url`, смена `title_sr` не теряет
    `title_ru` (перечитывается из `professions`); `normalizePostedAt` отбрасывает
    даты из будущем; в БД исправлены 37 будущих дат.
  - HelloWorld: дата в листинге — срок действия; `posted_at` больше не парсится.
  - `cleanup.js`: удаление по last_seen (`parsed_at`), не по `posted_at`;
    busy_timeout, валидация аргументов, транзакция.
  - `ask.py`: кеш — под фактическим провайдером; ключ кеша = sha256(provider|model|prompt);
    fallback ловит любые исключения, журнал помечает fallback; битый JSON → повтор/fallback.
  - `translate-titles.js`: backfill из `professions` для спарсенных заново вакансий;
    валидация JSON-ответа как объекта.
  - `batch-enrich.js`: пишет `professions`, `job_words.context_snippet`,
    детерминированный ORDER BY, защита от prompt-injection в данных, отмена
    противоречивого правила «First word Yes/No/Unknown».
  - `daily.sh`: flock, логирование шагов, ошибки не глотаются (exit 1),
    добавлены translate/enrich/cleanup/check; `runAll` = `daily.sh`.
  - viewer: слушает `127.0.0.1`, роут `/jobs.json`.
  - `tools/doctor.js`: окружение, git-гигиена, integrity БД, даты, `.env`.
- **Документы**: 16 старых файлов → `docs/archive/`; канонические
  `architecture`, `sources`, `decisions`, `operations`, `agents`, `onboarding`,
  `progress` + индекс `README.md`.

Задачи:
- [x] Конституция AGENTS.md + CLAUDE.md
- [x] Память задач с тегами
- [x] Критические баги P0 (upsert/даты/cleanup/ask.py/пайплайн)
- [x] Канонизация docs
- [x] GitHub Actions: verify на каждый push (CI)
- [x] Тесты парсеров по фикстурам (без сети)
- [x] Telegram-публикация карточек (инструмент; нужен токен/канал)
- [ ] Новые источники: Poslovi.rs, Oglasi.rs, Lako do posla (разведка сделана)

## 2026-10-31 (вторая сессия) — инструкции, CI, Telegram, ревизия

Сделано:
- **Инструкции**: `worker-core` + роли `worker-logic`/`worker-coder`/`worker-routine`,
  `lead-engineer` (4 блока внешнего ответа); `SYSTEM.md` — указатель на `AGENTS.md`;
  конверт воркера нормализуется `tools/ai.js`; `worker-analyst.md` удалён как
  противоречивый (требовал “First word Yes/No” при JSON-задачах).
- **doctor**: исправлен ложный FAIL по `memory/` (по конституции — в git);
  CI-режим: отсутствие локальной БД/артефактов — warning.
- **check**: работает без `jobs.json`/БД (CI); добавлены тесты `isAbroadJob`.
- **Тесты**: `tests/parsers.test.js` — офлайн-фикстуры Infostud/KP/Halo/HelloWorld
  (parse-функции экспортированы, `main` под `require.main === module`).
- **CI**: `.github/workflows/verify.yml`.
- **Telegram**: `tools/publish-telegram.js` (канон карточки, `is_published`,
  dry-run, 429-retry), `.env.example`, docs.
- **ask.py**: ротация `logs/ask-journal.md` (>1 МБ → `logs/archive/`).
- **Фильтр зарубежных**: страны/регионы в поле `city` (Kipar, Nemačka, ...).
- **Источники**: разведка poslovi.rs/oglasi.rs/lakodoposla (robots, структура,
  ловушки) → `docs/sources.md`, решение — только research.
- **Доки**: README, operations, architecture, agents, decisions, SYSTEM, BRIEF/START.

Сверка с изначальной концепцией: агрегатор + словарь + Telegram — ядро сохранено;
Telegram был в MVP, но до сих пор отсутствовал (теперь инструмент есть); глоссарий
перенесён из отдельной базы в единую `jobs.db`; Jooble/NSZ отброшены, добавлены
HaloOglasi/HelloWorld; публичная витрина сместилась с GitHub Pages на Telegram.

## 2026-10-31 (третья сессия) — Telegram в проде

Сделано:
- Публикатор переписан после ревью двух воркеров: исправлен критический баг
  (токен из `.env` не попадал в URL), `--dry`, 429-retry той же карточки,
  `link_preview_options`; добавлены lock, `getMe`, лог, безопасная обрезка,
  тесты `tests/publish.test.js`.
- Бот `@HybridIntBot` подключён к `@DecentralizedCapitals`; проверены `getMe`,
  `getChat`, тестовая отправка и удаление, опубликована 1 карточка.
- Зеркало `mirror` сохранено, синхронизация — вручную.

## 2026-11-03 — Handoff T0: установлены доставленные файлы

Сделано:
- `AGENTS.md` переписан (англ., разделы 1–8 сохранены, добавлены 9–12: рабочие
  принципы, необратимые действия, длинные задачи/resume, язык и формат ответа).
- Новый `tools/backup-db.js` (`VACUUM INTO` + `integrity_check` + retention);
  `daily.sh` делает бэкап первым шагом и запускает `cleanup` только после успеха.
- `tools/cleanup.js`: пропуск остановившихся источников, отказ при >50% без
  `--force`, `--dry`.
- `tools/import-glossary.js`: транзакция, exit 1 при ошибке, пропуск
  разделителей/заголовка, предупреждения о конфликтах терминов.
- Публикатор из архива НЕ перезаписан: версия в репозитории новее (retry_after,
  lock, getMe, лог, тесты). Смоук: `cleanup --dry`, `backup-db`, `publish --dry`.

## 2026-11-03 — T2.3: batch-enrich

- Добавлен `jobs.enriched_at` (миграция в `openDb`); выборка идёт по маркеру.
- Перевод переиспользует `professions`; id сравниваются как строки; битый элемент
  пропускается без отката пачки; промпт переставлен (данные → задача).
- Тест: `tests/enrich.test.js`, включён в `npm test`.

## 2026-11-03 — T2.4: translate-titles

- Пачки нумеруются; ответ принимается по номеру (fallback по тексту).
- Промпт: `worker-core` + `worker-routine`, конверт, пометка «ненадёжные данные»,
  до 5 релевантных терминов из `glossary`.
- `openDb()` вместо ручного создания схемы; транзакция с `ROLLBACK` при ошибке.
- Тест: `tests/translate.test.js`, включён в `npm test`.

## 2026-11-03 — T2.5: валидаторы LLM-вывода

- Новый `tools/validators.js`: `isValidTitleRu`, `isValidDefinition`.
- Подключены в `batch-enrich` и `translate-titles` до записи в БД.
- Тест: `tests/validators.test.js`, включён в `npm test`.

## 2026-11-03 — T1: слой ask по ролям

- `tools/ask.py` переписан: роли вместо моделей, адаптеры OpenAI-compatible и
  Anthropic, конфиг `config/providers.json`, кеш с ротацией, журнал
  `logs/ask-journal.jsonl` (ротация 1 МБ), повтор при нарушении формата, fallback
  по цепочке, `--allow-external` (по умолчанию внешние провайдеры не вызываются),
  `--no-cache`, `--tags/--origin/--expect/--timeout/--volatile`.
- `tools/memory.js`: поиск по задачам и журналу, пропуск истёкших `volatile`,
  exit 0 при отсутствии совпадений, `context` (до 3 обменов, обрезка).
- Дефолты `daily.sh`, `translate-titles`, `batch-enrich`, `ai.js` переведены на
  роль `ROUTINE_LOCAL`; `.env.example` больше не задаёт модели.
- Тесты: `tests/ask.test.js` (stub-провайдер, кеш, повтор, fallback, журнал,
  локальность), `tests/memory.test.js`; оба в `npm test`.

## 2026-11-03 — T2 (остаток): мелкие баги и защита

- `check.js`: устаревший `jobs.json` — предупреждение (сверка только для свежего
  экспорта), все дефекты артефактов в одном отчёте; `tests/check.test.js`.
- `doctor`: Node >= 22.13 (+`.nvmrc`), проверка секретов в содержимом tracked-файлов,
  `ast.parse` вместо `py_compile` (без `__pycache__`).
- `docs-check`: якоря `file.md#anchor` и проверка путей репозитория в
  `AGENTS.md`/`AI.md`/`SYSTEM.md`/`prompts`; исправлена ссылка `AI.md`.
- Экспорт: общий `openReadOnlyDb`, атомарная запись (`tools/file-utils.js`),
  нейтрализация CSV-формул и `\r`; `tests/export.test.js`.
- Публикатор: только вакансии с непустым `title_ru`, телефоны/e-mail вырезаются
  из сниппета; `tests/publish.test.js` дополнен.
- `daily.sh`: портируемый лок через `mkdir` (без `flock`), `source-stats` с
  предупреждением о просадке источника; `tests/source-stats.test.js`.
- `scrapers/db.js`: `PRAGMA user_version` + идемпотентные миграции, индексы
  `parsed_at`/`source`/`glossary(term COLLATE NOCASE)`, обработка UNIQUE-коллизии
  `source_url`, `inostranstvo` с отрицанием; `tests/db.test.js`.
- Тесты добавлены в `npm test`: ai, backup, cleanup, import-glossary.

## 2026-11-05 — сквозная инструкция и ежедневный GitHub Actions

- `docs/manual.md` — полная инструкция: конвейер, источники, схема БД, иерархия
  инструкций, ИИ-слой, автоматизация, карта файлов и список неиспользуемого.
- `.github/workflows/daily.yml`: ежедневно 05:00 UTC парсит четыре источника,
  переводит новые заголовки `CODE_FAST`, делает `check`/экспорт и публикует
  новые карточки в Telegram только при наличии подходящих вакансий. БД между
  запусками живёт в кеше GitHub; есть ручной запуск с `dry_run`.
- `publish-telegram.js`: флаг `--all` (публикация всех подходящих, не только 5);
  тест обновлён.
- `scrapers/db.js`: каталог БД создаётся при первом открытии (чистый CI/checkout).
- `tools/ask.py`: браузерный `User-Agent` (Cloudflare 403/1010 у Groq), повтор
  при 429 с паузой; `config/providers.json`: актуальные модели Groq/OpenRouter.
- `translate-titles.js`: пауза между пачками (`<роль> <пачка> <мс>`) против TPM.
- Проверено: облачный dry-run собрал 239 вакансий и перевёл 202; реальный
  запуск опубликовал 228/228 карточек. HaloOglasi из облака отдаёт 403.

## 2026-11-05 — журнал, словарь из полных текстов, проверочные шаги

- `journal/`: курируемый журнал (`events.jsonl`, `sessions/YYYY-MM-DD.md`) —
  в git, `tools/journal.js` (add/ingest/search/list/stats). `ingest` переводит
  сырой `logs/ask-journal.jsonl` в `events.jsonl`, дедуп по hash, только
  `accepted`; авто-теги (`translation`, `glossary`, `scraping`, `telegram`, ...).
- `tools/memory.js`: ищет `memory/tasks.jsonl`, `journal/events.jsonl` и сырой
  журнал; вывод ответа (A) в `printEntry`.
- `scrapers/db.js`: схема v3 — `jobs.description`, `published_at`,
  `telegram_message_id`; `glossary.translation_ru`, `source`, `part_of_speech`,
  `level`, `example_sr`. Idempotent миграции.
- `scrapers/common.js`: `extractGenericDescription`, `extractJsonLdJob`,
  `extractJsonStringField`, `fetchDescription`, `newJobsOnly`, `attachDescriptions`.
- Парсеры: Infostud, HelloWorld, HaloOglasi получают детальные страницы и
  сохраняют полный текст. HelloWorld: блок `mtc-description`.
- `tools/fetch-descriptions.js`: добор пропусков по `description IS NULL` (по 40
  за прогон, `--source`).
- `tools/batch-enrich.js`: из `title + snippet + description` — термины с
  переводом, определением, частью речи, уровнем, примером и контекстом в
  `job_words`; `source='ai'` для новых терминов.
- `tools/export-glossary.js`: читаемый `snapshots/glossary.md` из БД.
- `tools/publish-telegram.js`: `published_at` + `telegram_message_id` проставляются
  отправке.
- Проверки: `tools/verify-publish.js`, `tools/verify-glossary.js`, тесты
  `tests/verify.test.js`, `tests/journal.test.js`; все входят в `npm test` и
  `npm run verify`.
- `.github/workflows/daily.yml`: шаги fetch-descriptions, enrich (`CODE_FAST`,
  батч 10), export:glossary, journal ingest, verify; upload-artifact для БД.
- `daily.sh`: шаги fetch-descriptions, export:glossary, journal ingest.
- Миграция локальной БД: user_version 3, дубли словаря по регистру склеены.
