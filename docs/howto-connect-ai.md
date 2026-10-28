# Как подключить внешние ИИ к этому репозиторию

## Главное: публичное зеркало (рабочий путь)

Приватный репозиторий `Modificator5/serbia-jobs` — основное хранилище. Для внешних ИИ есть публичное read-only зеркало **`Modificator5/serbia-jobs-docs`** (только код/документы/промпты, без data/ и секретов). Оно синхронизируется автоматически: любой `git push` уходит в оба репозитория одной командой.

Что читать ИИ (публичные raw-ссылки, работают у всех без авторизации):

- https://raw.githubusercontent.com/Modificator5/serbia-jobs-docs/main/CLAUDE.md
- https://raw.githubusercontent.com/Modificator5/serbia-jobs-docs/main/docs/07-progress.md
- https://raw.githubusercontent.com/Modificator5/serbia-jobs-docs/main/prompts/BRIEF.md

## Известный баг claude.ai (важно)

«+ → Add from GitHub» с **приватным** репозиторием часто не даёт Claude инструмент чтения (все галочки в настройках зелёные, а чат получает только URL). Это баг Anthropic — см. github.com/anthropics/claude-code issues #96351, #97723, #68517. Публичные репозитории при этом читаются исправно. Поэтому для Claude используем зеркало `serbia-jobs-docs`.

## Claude (claude.ai, бесплатно)

Способ А (коннектор, надёжно с зеркалом):
1. Настройки профиля → **Customize → Connectors → GitHub Integration → Connect**.
2. В чате **«+»** → **Add from GitHub** → выбрать **`Modificator5/serbia-jobs-docs`** (публичное) → Add repository.
3. Задача: «Прочитай CLAUDE.md из подключённого репозитория и выполни его инструкции».

Способ Б (без коннектора): вставить в чат raw-ссылку на CLAUDE.md (выше) + задачу.

Попытки с приватным `serbia-jobs` через коннектор: переподключить интеграцию (disconnect → connect), пробовать в новом чате; следить за фиксом в issue #97723.

## ChatGPT (бесплатно)

Коннектор: chatgpt.com/plugins → GitHub → Install (на Free работает нестабильно). Гарантированно: вставить raw-ссылку на CLAUDE.md зеркала + задачу — публичные raw читаются всегда.

## DeepSeek (бесплатно)

Коннекторов нет. Вставить raw-ссылку на CLAUDE.md зеркала (публичный raw работает) или содержимое файла.

## Ollama (локально)

Ничего подключать не нужно — текст передаётся пачками напрямую.

## Секреты

- Приватный `serbia-jobs` — основной, с ним работаю я (git push уходит в оба репо).
- `data/` и `.env` в git не входят нигде: их нет ни в приватном, ни в зеркале.
- ZIP-архив (Code → Download ZIP) — запасной ручной вариант для любого ИИ.
