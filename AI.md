# AI.md — Оркестрация ИИ в проекте (уникальные фрагменты)

> **Конституция — `AGENTS.md`.** Общие правила там; здесь только уникальное.

## 1. Capability Keys — детали

| Ключ | Назначение | Модели (примеры) |
|---|---|---|
| `LOGIC_CORE` | Глубокий анализ, архитектура, аудит | DeepSeek V3, Claude 3.5 Sonnet, GPT-4o |
| `CODE_FAST` | Скорость, синтаксис, правки | Llama 3.3 (Groq) |
| `ROUTINE_LOCAL` | Простые переводы, форматирование, локальные задачи | Ollama (gemma4:cloud) |

Порядок и `external` флаги — в `config/providers.json`.

## 2. Протокол принятия решений (Reasoning Loop)

Перед любым действием OpenCode выполняет цикл:

1. **Анализ**: Проверка `.ai_memory/` (кеш и логи) → определение задачи.
2. **Классификация**: Маппинг задачи на Capability Key (`LOGIC_CORE`, `CODE_FAST`, `ROUTINE_LOCAL`).
3. **Планирование**: Запись в `.ai_memory/reasoning.jsonl`:
   - Задача → Выбранный Key → Обоснование → Конструкция промпта.
4. **Исполнение**: Вызов воркера через `tools/ask.py`.
5. **Маркировка (Labeling)**: Анализ ответа → Метка в логах:
   - `[ACCEPTED]`: Результат принят.
   - `[REJECTED]`: Результат неверен → Корректировка промпта → Повтор.
   - `[PIVOT]`: Эскалация в `LOGIC_CORE` или к User при неудаче.
6. **Синтез**: Интеграция в проект → Обновление `logs/sessions/current_session.md`.

## 3. Prompt Style

`Role → Context → Objective → Constraints → Output Format`.

## 4. Ресурсы

- `SYSTEM.md` — Технический регламет (быстрая карта).
- `docs/architecture.md` — Архитектура.
- `prompts/` — Системные промпты воркеров.

---
*Правила памяти, гигиены git, необратимых действий, языка, DoD, startup checklist — см. `AGENTS.md`.*
