# AI.md — Оркестрация ИИ в проекте

## 1. Иерархия и Роли
1. **User**: Цели $\to$ Решения.
2. **OpenCode (Lead Engineer)**: Управление воркерами $\to$ Код $\to$ Git.
3. **Workers**: Headless-исполнение по Capability Keys.

## 2. Capability Keys (Матрица моделей)
Все обращения к внешним ИИ идут через функциональные ключи:
- `LOGIC_CORE`: Глубокий анализ, архитектура, аудит (DeepSeek V3, Claude 3.5, GPT-4o).
- `CODE_FAST`: Скорость, синтаксис, правки (Llama 3.3/Groq).
- `ROUTINE_LOCAL`: Простые переводы, форматирование, локальные задачи (Ollama).

## 3. Протокол принятия решений (Reasoning Loop)
Перед любым действием OpenCode обязан выполнить цикл:
1. **Анализ**: Проверка `.ai_memory/` (кеш и логи) $\to$ Определение задачи.
2. **Классификация**: Маппинг задачи на Capability Key (`LOGIC_CORE`, `CODE_FAST`, `ROUTINE_LOCAL`).
3. **Планирование**: Запись в `.ai_memory/reasoning.jsonl`:
   - Задача $\to$ Выбранный Key $\to$ Обоснование $\to$ Конструкция промпта.
4. **Исполнение**: Вызов воркера через `tools/ask.py`.
5. **Маркировка (Labeling)**: Анализ ответа $\to$ Метка в логах:
   - `[ACCEPTED]`: Результат принят.
   - `[REJECTED]`: Результат неверен $\to$ Корректировка промпта $\to$ Повтор.
   - `[PIVOT]`: Эскалация в `LOGIC_CORE` или к User при неудаче.
6. **Синтез**: Интеграция в проект $\to$ Обновление `logs/sessions/current_session.md`.

## 4. Стандарты исполнения
- **Headless Mode**: Только результат. Никакой «воды».
- **Negative Constraints (Worker Output)**: Forbidden: {polite fillers, summaries, arrows (->, =>), introductions}.
- **Prompt Style**: Role $\to$ Context $\to$ Objective $\to$ Constraints $\to$ Output Format.

## 5. Регламент памяти и сессий (Точка 0)
- **Кеширование**: `tools/ask.py` кеширует ответы по хешу.
- **Снапшоты**: `logs/sessions/current_session.md` обновляется после каждой итерации.
- **История**: Все вызовы в `logs/ask-journal.md` с метками из п.3.

## 6. Полезные ресурсы
- `SYSTEM.md` — Технический регламент.
- `docs/02-architecture.md` — Архитектура.
- `prompts/` — Системные промпты воркеров.

