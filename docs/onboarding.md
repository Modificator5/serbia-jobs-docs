# Онбординг: подключение внешнего ИИ

Входной документ любого ИИ: [`AGENTS.md`](../AGENTS.md) (конституция; при
противоречии побеждает он). Быстрый старт: прочитать `AGENTS.md` → `npm run
verify` → `node tools/memory.js search "<задача>"`.

## Claude (claude.ai, бесплатно)

Коннектор «+ → Add from GitHub» с **приватными** репозиториями часто не даёт
чату инструмент чтения (баг Anthropic: anthropics/claude-code #96351, #97723,
#68517). Поэтому для Claude — публичное зеркало:

1. Settings → Customize → Connectors → GitHub Integration → Connect.
2. «+» → Add from GitHub → `Modificator5/serbia-jobs-docs` → Add.
3. Задача: «Прочитай AGENTS.md из подключённого репозитория и выполни».

Без коннектора: raw-ссылка на `AGENTS.md` зеркала
(`https://raw.githubusercontent.com/Modificator5/serbia-jobs-docs/main/AGENTS.md`)
+ задача. raw.githubusercontent.com читается исправно; github.com — нет (robots).

## ChatGPT / DeepSeek

Коннектор ChatGPT (Free) нестабилен: гарантированно — raw-ссылка на `AGENTS.md`
зеркала. У DeepSeek коннекторов нет — та же raw-ссылка или содержимое файла.

## Секреты и границы

- Основной репозиторий приватный; `data/` и `.env` не входят ни в него, ни в зеркало.
- Зеркало docs пушится только по явной задаче (см. `docs/operations.md`).
- ZIP (Code → Download ZIP) — запасной ручной вариант.

## Состояние системы

Пульс проекта: `AGENTS.md` §8 (карта), `docs/progress.md` (что сделано),
`docs/sources.md` (статусы площадок). Проверка окружения: `npm run verify`.

История: `archive/howto-connect-ai.md`, `archive/system-state.md`.
