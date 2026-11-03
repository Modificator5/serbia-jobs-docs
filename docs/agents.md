# ИИ-агенты: инструкции, роли, протокол

> **Конституция — `AGENTS.md`.** При противоречии побеждает он.
> Этот файл — справочник реализации: команды, конфиг, пути, эскалация.

## Команды

Единый инструмент: `./tools/ask.py <роль> "промпт"` (ключи — в `.env`,
шаблон `.env.example`; провайдеры, модели и порядок fallback — в
`config/providers.json`). Кеш `.ai_memory/<провайдер>.jsonl` (ключ =
sha256(provider|model|prompt)), fallback по цепочке роли, журнал
`logs/ask-journal.jsonl` с ротацией в `logs/archive/` при 1 МБ. При повторном
запросе — сначала кеш и журнал, не спрашивать заново.

| Команда | Назначение | Провайдеры (по порядку) | Статус |
|---|---|---|---|
| `ask.py ROUTINE_LOCAL` | рутина, переводы, батчи | локальная модель | активен |
| `ask.py CODE_FAST` | быстрое ревью кода | быстрая hosted-модель, затем запасная | активен |
| `ask.py LOGIC_CORE` | аналитика, архитектура | сильная reasoning-модель, затем запасная | активен |

Явное имя провайдера (`ask.py <провайдер> ...`) сохранено для отладки и
считается явным разрешением на внешний вызов. Локальность и внешность задаёт
поле `external` в `config/providers.json`; без `--allow-external` внешние
провайдеры не используются.

Проверка: `./tools/ask.py ROUTINE_LOCAL "Привет! Ты работаешь? Одна строка JS."`

## Память

- `.ai_memory/*.jsonl` — кеш ответов (автоматически через ask.py).
- `logs/ask-journal.jsonl` — что спрашивали и что ответили (ротация > 1 МБ).
- `memory/tasks.jsonl` — индекс задач с тегами (`tools/memory.js`).
- `node tools/memory.js context "слова"` — до 3 прошлых обменов для промпта.

## Пути репозитория

| Директория | Содержимое |
|---|---|
| `scrapers/` | парсеры (`infostud.js`, `kupujemprodajem.js`, `halooglasi.js`, `helloworld.js`), `common.js`, `db.js` |
| `tools/` | export, translation, enrichment, cleanup, Telegram, `ask.py`, `memory.js`, `doctor.js`, `docs-check.js`, `source-stats.js`, `file-utils.js` |
| `prompts/` | `worker-core.md` + роли: `worker-logic.md`, `worker-coder.md`, `worker-routine.md`; оркестратор: `lead-engineer.md` |
| `docs/` | канонические документы (индекс в `docs/README.md`) |
| `memory/tasks.jsonl` | журнал задач (в git) |
| `viewer/server.js` + `index.html` | локальный сайт (127.0.0.1:7788) |

## Инструкции (файлы)

| Ключ матрицы | Роль | Файл | Формат ответа |
|---|---|---|---|
| — | база для всех | `prompts/worker-core.md` | только результат, без вежливости |
| `LOGIC_CORE` | анализ, архитектура | `prompts/worker-logic.md` | `STATUS: [YES/NO/UNKNOWN]` + `FACTS:` |
| `CODE_FAST` | код, рефакторинг | `prompts/worker-coder.md` | сырой код без fences; ошибка: `ERROR: ...` |
| `ROUTINE_LOCAL` | переводы, батчи | `prompts/worker-routine.md` | конверт `{"status":"success","data":...}` |
| — | оркестратор (OpenCode) | `prompts/lead-engineer.md` | 4 блока: Сравнение/Вердикт/Результат/Действие |

Правило: один запрос = `worker-core` + один ролевой файл. Конверт
`{"status":"success","data":...}` нормализуется в `tools/ai.js`
(`normalizeWorkerJson`); сырой JSON тоже принимается для совместимости.

## Эскалация (лестница)

1. Нарушение формата у воркера → один повтор, затем следующий провайдер той же роли.
2. Рутинная задача требует рассуждений → переназначить на `LOGIC_CORE`.
3. Два воркера разошлись после консенсуса → мозг решает и логирует причину.
4. Необратимое действие или мозг не может решить → спросить пользователя.

## ru-sr-translator.md

Отдельный промпт для обратного перевода (RU→SR), для личного использования.
Не входит в матрицу ролей `ROUTINE_LOCAL`/`CODE_FAST`/`LOGIC_CORE`.

История: `archive/08-agents.md`, `archive/delegation-policy.md`, `archive/11-ai-network.md`.
