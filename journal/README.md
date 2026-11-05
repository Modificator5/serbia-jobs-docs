# Журнал проекта

Здесь лежит **курируемая** память: короткие записи о сделанном и ответы ИИ,
которые пригодились. Сырые логи (`logs/`, `.ai_memory/`) остаются локальными
и в git не входят.

- `events.jsonl` — машинно-читаемые события: `ts`, `type`, `title`, `text`,
  `tags`, `refs`. В git входит только этот файл.
- `sessions/YYYY-MM-DD.md` — человеческая сводка дня: что сделано, что
  осталось, какие решения приняты.

## Зачем теги

Поиск идёт по тексту и тегам. Теги ставятся автоматически при `ingest`
(`translation`, `glossary`, `scraping`, `telegram`, `db`, `code`, `tests`,
`git`, `bug`) и вручную через `--tags`. По ним можно найти прошлую задачу,
не перечитывая весь журнал.

## Команды

```bash
node tools/journal.js add "Починил публикацию --all" --tags telegram,bug --refs tools/publish-telegram.js
node tools/journal.js ingest              # logs/ask-journal.jsonl -> journal/events.jsonl
node tools/journal.js search "словарь"
node tools/journal.js search "публикация" --tag telegram
node tools/journal.js list --limit 10
node tools/journal.js stats
```

`ingest` идемпотентен: повторный запуск не создаёт дублей. Ответы ИИ
обрезаются, промпт сохраняется только фрагментом — этого достаточно, чтобы
вспомнить контекст и найти полезный ответ.

`tools/memory.js search` тоже читает `journal/events.jsonl`, поэтому старые
ответы находятся и через привычную команду памяти.
