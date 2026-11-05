# Полная инструкция: как устроен и работает проект

Это сквозное описание: что происходит от нажатия «запусти парсер» до сообщения
в Telegram, какие файлы за это отвечают, какие инструкции читает ИИ и что в
репозитории не используется. Главный документ проекта — `AGENTS.md`; при
противоречии побеждает он.

## 1. Одна фраза

Проект собирает вакансии с четырёх сербских площадок, складывает их в одну
SQLite-базу, переводит названия должностей на русский, пополняет словарь
сербских слов, делает выгрузки для сайта и публикует короткие карточки в
Telegram.

```
Infostud / KupujemProdajem / HaloOglasi / HelloWorld
        │
        ▼
scrapers/*.js  ──►  data/jobs.db  ──►  translate  ──►  enrich
                                        │              │
                                        ▼              ▼
                                   export CSV/JSON   glossary / job_words
                                        │
                          ┌─────────────┼─────────────┐
                          ▼             ▼             ▼
                     jobs.json      snapshots/    Telegram
                          │
                          ▼
                  index.html + viewer
```

## 2. Полный путь одной вакансии (по шагам)

1. **Запрос пользователя.** «Запусти парсер» — это не одна команда, а выбор
   одного из двух сценариев:
   - точечно: `npm run scrape:kp`, `npm run scrape:infostud`, `npm run scrape:ho`,
     `npm run scrape:hw`;
   - полный цикл: `npm run runAll` (он же `bash tools/daily.sh`).
2. **Стартовая проверка (для ИИ).** По `AGENTS.md`: `git status`, поиск в памяти
   `node tools/memory.js search "<задача>"`, затем `npm run verify`.
3. **Скрейп.** Каждый файл `scrapers/<источник>.js`:
   - скачивает страницы листинга (`fetch` или `curl` через `scrapers/common.js`);
   - достаёт данные из `__NEXT_DATA__` (Infostud, KupujemProdajem) или из
     SSR-разметки (HaloOglasi, HelloWorld);
   - приводит поля к единому виду (`mapJob`);
   - отдаёт массив в `saveJobs` → `upsertJob` (`scrapers/db.js`).
4. **Нормализация и запись в БД.** `scrapers/db.js`:
   - чистит HTML-сущности и пробелы;
   - разбирает зарплату (`salary_min`, `salary_max`, `salary_raw`);
   - определяет город, дату (`posted_at`), категорию (`category_tag`);
   - отбрасывает зарубежные вакансии и даты из будущего;
   - делает `INSERT ... ON CONFLICT` по `id`/`source_url`, обновляет `parsed_at`
     (last_seen) при каждом показе вакансии в листинге.
5. **Статистика источников.** `node tools/source-stats.js` считает вакансии по
   источникам и пишет историю в `logs/source-counts.jsonl`. Просадка меньше 50 %
   от среднего за 7 дней — предупреждение, а не падение.
6. **Перевод должностей.** `node tools/translate-titles.js [роль] [пачка]`:
   - берёт только `title_sr`, у которых ещё нет `title_ru` и нет записи в кеше
     `professions`;
   - собирает промпт из `prompts/worker-core.md` + `prompts/worker-routine.md`;
   - вызывает воркер через `tools/ai.js` → `tools/ask.py`;
   - проверяет ответ валидатором `tools/validators.js`;
   - пишет перевод в `professions` и обновляет `jobs.title_ru`.
   Повторный запуск не тратит токены на уже переведённое.
7. **Обогащение.** `node tools/batch-enrich.js`:
   - берёт вакансии с `enriched_at IS NULL`;
   - просит воркер перевести текст и вытащить термины;
   - пополняет `glossary`, `job_words`, `glossary_categories`;
   - ставит `enriched_at`, поэтому повторно не обрабатывает.
8. **Очистка.** `node tools/cleanup.js [дней]` удаляет вакансии, которые не
   показывались в листингах дольше 30 дней (критерий — `parsed_at`, а не
   `posted_at`). Защита: остановившийся источник пропускается целиком; удаление
   больше 50 % базы требует `--force`; `--dry` только печатает план.
9. **Экспорт.**
   - `node tools/export-json.js` → `jobs.json` (для сайта и viewer);
   - `node tools/export-csv.js` → `snapshots/jobs.csv` (бэкап/анализ).
   Оба пишут атомарно: читатель не увидит половину файла.
10. **Сайт.**
    - `node viewer/server.js` → `http://127.0.0.1:7788`, отдаёт `index.html` и
      `/api/jobs` из БД;
    - `jobs.json` — статический вариант для GitHub Pages (сам деплой не
      автоматизирован, см. раздел 10).
11. **Telegram.** `node tools/publish-telegram.js [N] [--dry] [--all]`:
    - выбирает `is_published = 0`, непустые `title_sr` и `title_ru`;
    - убирает межисточниковые дубли по `title_sr|city|company_short`;
    - собирает карточку по канону из `docs/architecture.md`;
    - удаляет телефоны и e-mail из сниппета;
    - отправляет через Bot API, ставит `is_published = 1`, пишет
      `logs/publish-YYYY-MM.log`;
    - `--all` публикует все подходящие, без `--all` — по умолчанию 5.
12. **Проверка.** `node tools/check.js` проверяет хелперы и согласованность
    артефактов; `npm run verify` = `doctor` + все тесты + `docs:check`.

## 3. Источники и способы парсинга

| Источник | Файл | URL листинга | Как читается | Ограничения |
|---|---|---|---|---|
| Infostud | `scrapers/infostud.js` | `https://poslovi.infostud.com/oglasi-za-posao?page=N` | `__NEXT_DATA__` из HTML, `initialSearchResults` | нет сниппетов; 2 страницы по умолчанию |
| KupujemProdajem | `scrapers/kupujemprodajem.js` | `https://www.kupujemprodajem.com/pretraga?categoryId=...&page=N` | `__NEXT_DATA__`, массив `ads` | зарплата редко, компании нет, дубли по городам; 5 страниц по умолчанию |
| HaloOglasi | `scrapers/halooglasi.js` | `https://www.halooglasi.com/...` | SSR-разметка через `curl` | нет дат и сниппетов в листинге |
| HelloWorld | `scrapers/helloworld.js` | `https://www.helloworld.rs/oglasi-za-posao/` | SSR-разметка, блоки `<h3>` | дата в листинге — срок действия, не парсится; 3 страницы по умолчанию |

Отброшенные источники: NSZ (CSR, парсер удалён), Jooble (Cloudflare 403).
Исследуются: poslovi.rs, oglasi.rs, lakodoposla.com — см. `docs/sources.md`.

## 4. База данных: таблицы и правила

Файл: `data/jobs.db` (локально, в git не входит). Режим WAL, схема версионируется
через `PRAGMA user_version`; миграции идемпотентны.

```sql
jobs(id TEXT PK, source, source_url UNIQUE, title_sr, title_ru, city,
     salary_raw, salary_min, salary_max, requirements_short, company_short,
     snippet, category_tag, posted_at, parsed_at, is_published, enriched_at)
professions(title_sr PK, title_ru)          -- кеш переводов
glossary(id, category_id, term UNIQUE, definition, created_at)
job_words(job_url, word_id, context_snippet, PK(job_url, word_id))
glossary_categories(id, name UNIQUE)
```

Инварианты:

- `title_sr` обязателен; `source_url` уникален; `id` — стабильный (`infostud-123`,
  `kp-...`, `ho-...`, `hw-...`).
- `parsed_at` = последний показ в листинге (last_seen). `posted_at` —
  вспомогательная дата публикации; даты из будущего превращаются в `NULL`.
- `is_published` = 1 только после успешной отправки в Telegram.
- `enriched_at` = маркер обогащения; `NULL` значит «ещё не обрабатывали».
- `professions` — кеш «один `title_sr` → один `title_ru`»; перевод не теряется
  при повторном скрейпе.
- `glossary` пополняется только (`INSERT OR IGNORE`), существующие термины не
  перезаписываются; конфликт термина печатается предупреждением.

Теги `category_tag`: ugostiteljstvo, turizam, trgovina, it, gradjevina,
proizvodnja, zanat, medicina, administracija, prevoz, dostava, poljoprivreda,
obrazovanje, finansije, marketing, higijena, bezbednost, fizicki, njega, drugo.

## 5. Кто за что отвечает: иерархия инструкций

| Документ | Роль | Кто читает |
|---|---|---|
| `AGENTS.md` | Конституция: правила, память, git, DoD, язык, startup checklist | Любой ИИ и человек; при противоречии побеждает |
| `AI.md` | Уникальные детали оркестрации: capability keys, reasoning loop | Оркестратор |
| `SYSTEM.md` | Короткая карта для внешних ИИ, ссылки на канон | Внешний ИИ |
| `CLAUDE.md` | Указатель на `AGENTS.md` | Claude |
| `docs/architecture.md` | Конвейер, схема БД, карточка, ограничения | Разработчик/ИИ |
| `docs/sources.md` | Статусы площадок | Разработчик/ИИ |
| `docs/decisions.md` | Журнал архитектурных решений (ADR) | Разработчик/ИИ |
| `docs/operations.md` | Команды, cron, публикация, бэкап, git | Оператор |
| `docs/agents.md` | Провайдеры, промпты, протокол воркеров | Оркестратор |
| `docs/onboarding.md` | Подключение внешнего ИИ | Пользователь |
| `docs/progress.md` | Что сделано и что дальше | Все |
| `docs/README.md` | Индекс документов и статусов | Все |
| `docs/manual.md` | Этот сквозной документ | Пользователь/внешний ИИ |
| `prompts/worker-core.md` | База промпта воркера | `ask.py` / translate / enrich |
| `prompts/worker-routine.md` | Батчи и перевод | translate / enrich |
| `prompts/worker-logic.md` | Анализ логов и архитектуры | Аналитические задачи |
| `prompts/worker-coder.md` | Генерация кода | Кодовые задачи |
| `prompts/lead-engineer.md` | Протокол оркестратора | OpenCode |
| `prompts/START.md` | Вход для внешнего аналитика | Внешний ИИ |
| `prompts/BRIEF.md` | Короткая карточка онбординга | Внешний ИИ (опционально) |
| `prompts/ru-sr-translator.md` | Отдельный промпт RU→SR | Не используется текущим конвейером |
| `config/providers.json` | Роли → провайдеры/модели/fallback/external | `ask.py` |
| `memory/tasks.jsonl` | Журнал задач со статусами и тегами | `tools/memory.js`, ИИ |

Правило языка (`AGENTS.md` §12): код, комментарии, коммиты и новые документы —
на английском; при правке существующего файла язык сохраняется. Этот документ
написан по-русски, потому что он пользовательский и продолжает язык `docs/`.

## 6. ИИ-слой: роли, провайдеры, журнал

- `config/providers.json` — единственное место, где заданы модели и порядок
  fallback. Секретов там нет.
- Роли:
  - `ROUTINE_LOCAL` — Ollama (`gemma4:cloud`), локальные переводы и батчи;
  - `CODE_FAST` — Groq → OpenRouter, быстрые правки и переводы;
  - `LOGIC_CORE` — Gemini → OpenRouter, глубокий анализ.
- `tools/ask.py` — единая точка вызова: читает `.env`, конфиг, кеш
  `.ai_memory/<provider>.jsonl`, журнал `logs/ask-journal.jsonl`; поддерживает
  `--allow-external`, `--tags`, `--origin`, `--expect json|text`, `--volatile`.
- `tools/ai.js` — мост Node → Python: `ask()` и `normalizeWorkerJson()`.
- `tools/memory.js` — поиск по `memory/tasks.jsonl` и журналу; команды
  `search`, `list`, `context`, `add`.
- Внешний провайдер для локальной роли по умолчанию запрещён; включается только
  явным `--allow-external`.

## 7. Автоматизация: локально и в GitHub

### 7.1 Локальный полный цикл

`bash tools/daily.sh` (или `npm run runAll`):

```
backup → glossary → scrape kp → scrape infostud → scrape ho → scrape hw
→ source-stats → translate → enrich → cleanup → export CSV → export JSON → check
```

Порядок важен: `backup` первым, `cleanup` последним и только если бэкап и все
парсеры завершились успешно. Лок `logs/.daily.lock.d` не даёт запустить два
цикла одновременно. Лог: `logs/daily-YYYY-MM-DD.log`.

### 7.2 GitHub Actions: ежедневный парсинг + Telegram

Файл `.github/workflows/daily.yml`:

- запуск по расписанию `0 5 * * *` UTC (07:00 по Белграду) и вручную
  (`workflow_dispatch`, есть флаг `dry_run`);
- восстанавливает `data/` из кеша GitHub (`actions/cache`, ключ `jobs-db-*`);
- запускает четыре парсера и `source-stats`;
- переводит новые заголовки ролью `CODE_FAST`;
- делает `check`, `export:csv`, `export:json`;
- публикует в Telegram **только если есть новые подходящие вакансии**
  (`is_published = 0` + непустой `title_ru`), командой
  `npm run publish:telegram -- --all`;
- сохраняет обновлённую БД в кеш.

Секреты репозитория (Settings → Secrets and variables → Actions):

| Секрет | Зачем |
|---|---|
| `TELEGRAM_BOT_TOKEN` | отправка карточек |
| `TELEGRAM_CHANNEL_ID` | канал/группа |
| `GROQ_API_KEY` | перевод `CODE_FAST` (первый провайдер) |
| `OPENROUTER_API_KEY` | fallback перевода |
| `GEMINI_API_KEY` | необязательно, для `LOGIC_CORE` |

Важно: облачная БД в кеше GitHub и локальная `data/jobs.db` — **разные копии**.
`is_published` в них не синхронизируется. Чтобы не было дублей в канале, выбери
один центр публикации: либо GitHub Actions, либо ручной локальный запуск. Если
публикует GitHub, локально `publish:telegram` без `--dry` лучше не запускать.

Первый прогон облака скачает все страницы и переведёт накопившиеся заголовки —
это может занять десятки минут. Дальше кеш БД ускоряет цикл.

### 7.3 Локальный cron (альтернатива)

Если облако не нужно, добавь в `crontab -e`:

```cron
15 7 * * * cd /home/delf/repositories/serbia-jobs && bash tools/daily.sh >> logs/cron.log 2>&1
```

Но `daily.sh` не публикует в Telegram. Для публикации после успешного цикла:

```cron
30 8 * * * cd /home/delf/repositories/serbia-jobs && npm run publish:telegram -- --all >> logs/cron-publish.log 2>&1
```

Запускай что-то одно: облачный workflow или локальный cron, иначе возможны дубли.

## 8. Карта файлов и каталогов

### Корень

| Файл | Роль | Если удалить |
|---|---|---|
| `AGENTS.md` | Конституция проекта | ИИ теряет правила, DoD, память, git-политику |
| `AI.md` | Детали оркестрации | Оркестратор теряет reasoning loop |
| `SYSTEM.md` | Карта для внешних ИИ | Внешний ИИ теряет быстрый вход |
| `CLAUDE.md` | Указатель для Claude | Claude не находит конституцию |
| `README.md` | Вход для человека | Пользователь не видит, с чего начать |
| `index.html` | Статическая витрина | Не работает сайт/viewer |
| `package.json` | Скрипты и `engines` | Ломаются все команды |
| `.env.example` | Шаблон секретов | Новый пользователь не знает, какие ключи нужны |
| `.gitignore` | Что не попадает в git | В git утекут БД, логи, секреты |
| `.nvmrc` | Версия Node | CI/локально может взять несовместимый Node |
| `.github/workflows/verify.yml` | CI-проверка | Push/PR перестают проверяться |
| `.github/workflows/daily.yml` | Ежедневный парсинг + Telegram | Нет облачной автоматизации |

### `config/`

- `config/providers.json` — роли, провайдеры, модели, fallback, `external`.
  Критичен для `ask.py`; без него ИИ-слой не работает.

### `scrapers/`

| Файл | Роль |
|---|---|
| `common.js` | `curl`-загрузка HTML, `saveJobs`, отчёт |
| `db.js` | Схема, миграции, `upsertJob`, нормализация, фильтр зарубежных |
| `infostud.js` | Парсер Infostud |
| `kupujemprodajem.js` | Парсер KupujemProdajem |
| `halooglasi.js` | Парсер HaloOglasi |
| `helloworld.js` | Парсер HelloWorld |

Удаление любого парсера убирает соответствующий источник, но не ломает
остальные: они изолированы.

### `tools/`

| Файл | Роль |
|---|---|
| `daily.sh` | Полный локальный цикл, лок, порядок шагов |
| `ask.py` | Вызов внешних/локальных ИИ по ролям, журнал, кеш |
| `ai.js` | Node-мост к `ask.py`, разбор JSON-конверта |
| `memory.js` | Поиск по памяти задач и журналу |
| `check.js` | Проверка хелперов и артефактов |
| `doctor.js` | Проверка окружения, Node, секретов, `ast.parse` |
| `docs-check.js` | Битая ссылка/путь в инструкциях |
| `backup-db.js` | `VACUUM INTO` + `integrity_check` + ротация |
| `import-glossary.js` | Импорт `docs/glossary/bazaznanja.txt` |
| `translate-titles.js` | Перевод `title_sr` → `title_ru` |
| `batch-enrich.js` | Перевод + термины → `glossary`/`job_words` |
| `validators.js` | Валидация `title_ru` и определений |
| `cleanup.js` | Удаление невиденных > N дней, защита от потери |
| `source-stats.js` | Счётчики и сигнал просадки источника |
| `export-json.js` | `jobs.json` |
| `export-csv.js` | `snapshots/jobs.csv` |
| `file-utils.js` | Атомарная запись, защита CSV от формул |
| `publish-telegram.js` | Карточки в Telegram, `--all`, `--dry`, лок |

`viewer/server.js` — локальный HTTP-сервер; не входит в `daily.sh`, запускается
вручную.

### `tests/`

16 офлайн-тестов: `check`, `parsers`, `publish`, `enrich`, `translate`,
`validators`, `ask`, `memory`, `export`, `source-stats`, `db`, `ai`, `backup`,
`cleanup`, `import-glossary`, `prompts`. Все входят в `npm test`; сеть не нужна.

### `prompts/`

См. таблицу в разделе 5. `worker-core.md` — база; ролевые файлы дополняют её.
`BRIEF.md`, `START.md`, `lead-engineer.md`, `ru-sr-translator.md` — для людей и
внешних ИИ, код их напрямую не вызывает.

### `docs/`

- Канон: `architecture.md`, `sources.md`, `decisions.md`, `operations.md`,
  `agents.md`, `onboarding.md`, `progress.md`, `README.md`, `manual.md`.
- `docs/glossary/bazaznanja.txt` — данные словаря (импортируются в БД).
- `docs/sources/*.md` — разведка площадок (справочно, не runtime).
- `docs/handoff/2026-11-03-fixes.md` — исторический handoff.
- `docs/archive/*` — прежние версии документов (история, не runtime).

### `memory/`

- `memory/tasks.jsonl` — журнал задач: `status` (`SOLVED|TRIED|REJECTED|PENDING`),
  `tags`, `refs`, `task`, `date`. Входит в git; читается `tools/memory.js`.

### Локальные (в git не входят)

| Путь | Что это |
|---|---|
| `data/jobs.db` | Главная база (WAL, `-shm`, `-wal`) |
| `data/raw/`, `data/normalized/` | Промежуточные артефакты (если используются) |
| `logs/ask-journal.md` | Журнал вызовов воркеров, ротация > 1 МБ |
| `logs/interaction_history.jsonl` | История обменов |
| `logs/sessions/` | Сессии/конспекты |
| `logs/publish-YYYY-MM.log` | Результаты публикации |
| `logs/source-counts.jsonl` | История счётчиков источников |
| `logs/daily-YYYY-MM-DD.log` | Лог дневного цикла |
| `.ai_memory/*.jsonl` | Кеш ответов провайдеров |
| `snapshots/` | CSV-снимки и бэкапы БД |
| `jobs.json` | Публичный JSON для сайта |
| `.env` | Секреты |

## 9. Что не используется, устарело или является историей

Это не «мусор»: часть нужна для аудита и внешних ИИ, но в ежедневном runtime
не участвует.

| Что | Статус | Почему |
|---|---|---|
| `docs/archive/*` (18 файлов) | historical | Прежние версии документов; канон — в `docs/*.md` |
| `docs/sources/infostud.md`, `kupujemprodajem.md` | справочное | Разведка площадок; код их не читает |
| `docs/handoff/2026-11-03-fixes.md` | historical | Handoff завершённых задач |
| `prompts/BRIEF.md` | опционально | Карточка онбординга для внешнего ИИ |
| `prompts/START.md` | опционально | Вход для внешнего аналитика |
| `prompts/lead-engineer.md` | опционально | Протокол оркестратора, не вызывается скриптами |
| `prompts/ru-sr-translator.md` | не используется | Промпт RU→SR; конвейер переводит SR→RU |
| `SYSTEM.md` | указатель | Не читается кодом; его backlog отстаёт от `docs/progress.md` |
| `CLAUDE.md` | указатель | Только для Claude |
| `mirror` remote | вручную | Публичное зеркало docs, авто-пуша нет |
| `viewer/server.js` | вручную | Не входит в `daily.sh`; нужен для локального сайта |
| GitHub Pages | не автоматизировано | `jobs.json` не в git; статический деплой не настроен |
| `logs/`, `data/`, `snapshots/`, `.ai_memory/` | локально | Сознательно исключены из git |

Отдельно: `SYSTEM.md` в разделе Backlog всё ещё пишет, что Telegram «нужен
токен/канал», хотя публикатор уже работает. Актуальный статус — в
`docs/progress.md` и `docs/decisions.md`.

## 10. Известные пробелы и риски

- **Две копии БД.** Локальная и облачная (кеш GitHub) не синхронизируют
  `is_published`; выбирай один центр публикации.
- **Перевод — зависимость публикации.** Без `title_ru` карточка не публикуется.
  Если ИИ-провайдеры недоступны, новые вакансии останутся в БД, но не уйдут в
  Telegram.
- **Сеть площадок.** Любая площадка может сменить разметку или включить защиту;
  `source-stats` предупредит о просадке, но не починит парсер.
- **Telegram-лимиты.** Массовая публикация `--all` идёт с паузой ~1.1 с; при
  сотнях карточек это долго, а при 429 публикатор повторяет ту же карточку.
- **Бэкапы только локальные.** `snapshots/backups/` не уезжает с машины.
- **Секреты.** `.env` и GitHub Secrets не версионируются; при смене токена
  обнови оба места.
- **`daily.sh` не публикует.** Это осознанно: публикация — отдельный шаг с
  явным `--all`/`N`.

## 11. Быстрый справочник

```bash
npm run verify                  # doctor + тесты + docs:check
npm run runAll                  # полный локальный цикл
npm run scrape:kp               # точечный скрейп
npm run scrape:infostud
npm run scrape:ho
npm run scrape:hw
npm run translate               # ROUTINE_LOCAL
node tools/translate-titles.js CODE_FAST 25
npm run enrich
npm run import:glossary
npm run cleanup -- --dry
npm run export:csv
npm run export:json
npm run viewer                  # http://127.0.0.1:7788
npm run publish:telegram -- --all
npm run publish:telegram -- 5 --dry
node tools/memory.js search "тема [тег]"
node tools/memory.js add SOLVED "задача" --tags area,topic
node tools/backup-db.js 14
node tools/source-stats.js
```

Проверка окружения: `npm run doctor`. Если `doctor` ругается на Node — нужен
>= 22.13 (встроенный `node:sqlite` без флага). Если Telegram отвечает 401/403 —
бот не админ канала или неверный `TELEGRAM_CHANNEL_ID`. Если `daily.sh` пишет
«уже запущен» — дождись завершения или удали `logs/.daily.lock.d`.

## 12. Чек-лист после изменений

1. `npm run verify` — зелёный.
2. Изменил поведение — обнови `docs/architecture.md` и `docs/decisions.md`.
3. Изменил команду/флаг — обнови `docs/operations.md` и этот файл.
4. Коммить только явные пути (`git add <файл>`), никогда `git add -A`.
5. Секреты и `data/`/`logs/` — не в git.
