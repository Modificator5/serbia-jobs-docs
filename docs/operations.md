# Операции: запуск, пайплайн, публикация, git, CI

## Команды

```bash
npm run verify          # doctor + тесты (хелперы+парсеры) + docs:check
npm run runAll          # полный дневной цикл = bash tools/daily.sh (logs/daily-YYYY-MM-DD.log)
npm run scrape:kp       # точечный скрейп (kp / infostud / ho / hw)
npm run translate       # перевод новых title_sr через кеш professions (роль ROUTINE_LOCAL)
npm run enrich          # батч-обогащение: перевод + термины → glossary/job_words (ROUTINE_LOCAL)
npm run cleanup         # удалить вакансии, невиденные >30 дней (last_seen); флаги --dry/--force
node tools/backup-db.js [keep=14]   # VACUUM INTO + integrity_check в snapshots/backups/
npm run export:csv      # снимок snapshots/jobs.csv (бэкап + тесты без сети)
npm run export:json     # публичный jobs.json
npm run viewer          # локальный сайт http://127.0.0.1:7788
npm run publish:telegram -- [N] [--dry]   # Telegram-публикация карточек
node tools/memory.js search "запрос [тег]"   # память задач
./tools/ask.py <ROUTINE_LOCAL|CODE_FAST|LOGIC_CORE> "промпт"   # воркеры (провайдеры — config/providers.json)
```

## Цикл

Локально: `daily.sh` (парсинг → перевод → обогащение → очистка → экспорт → check).
Cron (ночь): `bash tools/daily.sh` — flock не даст запуститься дважды; код возврата
отражает упавшие шаги. Сырой прогон всех источников: редкое событие по явной команде.

## Тесты и CI

- `npm test` — хелперы нормализации + офлайн-фикстуры всех парсеров
  (`tests/parsers.test.js`, без сети) + конверт воркера; артефакты (jobs.json/БД)
  проверяются, только если есть локально.
- `npm run verify` — doctor + тесты + docs:check; в CI отсутствие локальной БД и
  артефактов — warning, не ошибка.
- CI: `.github/workflows/verify.yml` на push/PR (Node 22, без зависимостей).

## Публикация карточек (Telegram)

1. `@BotFather` → `/newbot`; добавить бота админом в канал/группу.
2. В `.env`: `TELEGRAM_BOT_TOKEN=...`, `TELEGRAM_CHANNEL_ID=@username` (или `-100...`).
3. Проверка прав: `node tools/publish-telegram.js 1 --dry` (печать без сети).
4. `npm run publish:telegram -- 5` — отправляет до 5 новых (`is_published=0`),
   помечает отправленные, повторяет ТУ ЖЕ карточку при 429, пишет
   `logs/publish-YYYY-MM.log`, берёт `logs/.publish.lock` (нет двойной публикации).
5. Без токена/канала или с `--dry` — только печать (без сети и без пометок).
6. Автоматической публикации в `daily.sh` нет — канал пишется только явной командой.
7. Перед реальной отправкой выполняется `getMe`; отказ 401/403 (бот не админ) —
   остановка. Карточка собирается так, чтобы ссылка не обрезалась.

## Очистка данных

Правило 30 дней по **last_seen**: вакансия неактуальна, если её не показывали в
листингах 30 дней (`parsed_at` — момент последнего показа). `posted_at` —
вспомогательное поле; даты из будущего → NULL. Запуск входит в `daily.sh`;
вручную: `node tools/cleanup.js [дней] [--dry] [--force]`.

Защита от потери данных:
- источник, у которого нет ни одной свежей записи за N дней, считается
  остановившимся и пропускается целиком (его вакансии не удаляются);
- если к удалению набирается больше 50% всех вакансий, скрипт отказывается
  работать без `--force` (отказ действует и для `--dry`);
- `--dry` печатает план по источникам и ничего не удаляет.

## Резервные копии

`node tools/backup-db.js [keep=14]` делает `VACUUM INTO` копию в
`snapshots/backups/jobs-YYYY-MM-DD.db` (UTC), проверяет `PRAGMA integrity_check`
и хранит `keep` новейших файлов. `VACUUM INTO` обязателен: база в WAL-режиме,
поэтому простое копирование `jobs.db` может пропустить свежие записи из `jobs.db-wal`.
`snapshots/` в git не входит. `daily.sh` делает бэкап первым шагом и запускает
`cleanup` только если бэкап и все парсеры завершились успешно.

## Публикация сайта (GitHub Pages)

`index.html` сначала пробует локальный `/api/jobs`, затем `jobs.json`. `jobs.json`
генерируется локально и **не входит в git** (решение 2026-10-31): GitHub Pages
не обновляется автоматически. Для статической витрины нужен отдельный деплой
(коммит артефакта в ветку Pages или CI-шаг с БД) — пока витрина вторична,
основная — Telegram. Локальный viewer слушает только `127.0.0.1`.

## Git

- `origin` = приватный `Modificator5/serbia-jobs` — единственный push по умолчанию.
- `mirror` = публичное `serbia-jobs-docs` — снимок для внешних ИИ, синхронизируется
  ТОЛЬКО вручную: `git push mirror main docs` (без авто-пуша). Если зеркало не нужно —
  `git remote remove mirror`, тогда внешним ИИ доступен только приватный репозиторий.
- В git входят: код, docs, prompts, `tests/`, `memory/`, `tools/`, `viewer/`,
  `index.html`, `.github/`.
- В git **не входят**: `data/`, `logs/`, `snapshots/`, `jobs.json`, `.env`,
  `.ai_memory/`, `*.db*`. Только явные пути (`git add <файлы>`), никогда `git add -A`.
- Коммит после каждой завершённой задачи; структурные изменения — обновить
  `docs/architecture.md` + запись в `docs/decisions.md` тем же коммитом.

## Бэкапы

- БД — локально (`data/jobs.db`, WAL). CSV-снимок `snapshots/jobs.csv` — ручной бэкап.
- `.env` — только локально, шаблон `.env.example` в git.

## Журналы

- `logs/ask-journal.md` — вызовы воркеров; при > 1 МБ ротируется в
  `logs/archive/ask-journal-YYYY-MM.md` (без потери истории).
- `logs/daily-*.log` — пошаговый лог дневного цикла.

## Troubleshooting

- `daily.sh уже запущен` — второй экземпляр, подождать или снять `logs/.daily.lock`.
- `doctor FAIL` — смотреть пункт проверки; секреты в git чинить немедленно.
- Сбой площадки: точечный скрейп, `check` после; лог daily — `logs/daily-*.log`.
- Telegram `403/400` — бот не админ канала или неверный `TELEGRAM_CHANNEL_ID`.
