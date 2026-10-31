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
- [ ] GitHub Actions: verify на каждый push (CI)
- [ ] Тесты парсеров по фикстурам (без сети)
- [ ] Telegram-публикация карточек
- [ ] Новые источники: Poslovi.rs, Oglasi.rs, Lako do posla
