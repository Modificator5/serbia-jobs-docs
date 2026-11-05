# SYSTEM.md — быстрая карта для внешних ИИ

> **Главный документ — `AGENTS.md`.** При противоречии побеждает он.
> Этот файл — сокращённый указатель для ИИ, привыкших к SYSTEM.md.

## Ссылки

- Правила: `AGENTS.md` (конституция, разделы 1–12)
- Операции: `docs/operations.md`
- Инструкции воркеров: `docs/agents.md`
- Промпты: `prompts/worker-core.md` + роли `worker-logic.md`, `worker-coder.md`, `worker-routine.md`; оркестратор `prompts/lead-engineer.md`

## Роли (кратко)

- **User**: цели, финальный аппрув.
- **OpenCode (Lead Engineer)**: оркестратор, код, git, синтез (`prompts/lead-engineer.md`).
- **Workers**: headless-исполнители (`prompts/worker-core.md` + ролевой файл).

Общение с пользователем (оркестратор): `[Сравнение] [Вердикт] [Результат] [Действие]`.
Общение с воркерами: только техзадание + Output Format, без вежливости.

## Матрица возможностей

- `LOGIC_CORE`: архитектура, глубокий анализ (Gemini / вторая модель на консенсус).
- `CODE_FAST`: синтаксис, рефакторинг (Groq).
- `ROUTINE_LOCAL`: переводы, батчи (Ollama).

## Backlog (актуальное)

1. Telegram-публикация — инструмент готов и работает (`publish:telegram`).
2. Новые источники: poslovi.rs, oglasi.rs, lakodoposla.com — см. `docs/sources.md`.
3. NLP-фильтр и локальная лемматизация.
4. Тесты парсеров — фикстуры в `tests/parsers.test.js`.
5. Ротация `logs/ask-journal.jsonl` — реализована (> 1 МБ → `logs/archive/`).
6. Ежедневная облачная автоматизация — `.github/workflows/daily.yml` (см. `docs/manual.md`).
