# Прогресс

Хронология: что сделано, что в работе, что дальше. Обновлять после каждого сеанса.

## 2026-10-28 — Фаза 0: каркас

Сделано:
- Создан репозиторий со структурой (docs, prompts, scrapers, bot, api, data).
- Написаны документы: vision, mvp, architecture, схемы jobs.db и glossary.db, sources, decisions.
- Созданы промпты-роли для внешних ИИ (BRIEF, research, normalize, translate).
- Перенесён промпт ru-sr-translator.md.
- Согласован формат карточки вакансии для Telegram.
- Стартовые площадки: Infostud, KupujemProdajem, Jooble.

## 2026-10-28 — Фаза 1: первый парсер

Сделано:
- Репозиторий, документы, промпты-роли.
- Infostud разобран: данные в `__NEXT_DATA__`, robots.txt ок — см. `docs/sources/infostud.md`.
- Парсер `scrapers/infostud.js` + общая БД `scrapers/db.js` (node:sqlite, без зависимостей).
- Первый прогон: 60 вакансий в `data/jobs.db` (должность, город, зарплата, категория, компания).
- Докатегоризированы складские (magacin → prevoz) и HR/финансовые вакансии.

## 2026-10-28 — Переезд на GitHub

Сделано:
- Приватный репозиторий на GitHub, git-процесс: коммит после задачи → push.
- `data/` и `.env` исключены из git (секреты и базы только локально).
- Канбан упразднён: трекер задач — чекбоксы ниже.
- Просмотрщик базы: `npm run viewer` → http://localhost:7788 (список вакансий с фильтрами по городу/категории/поиску).
- CLAUDE.md в корне — авто-входная точка для Claude.
- Публичное зеркало `Modificator5/serbia-jobs-docs` для внешних ИИ (авто-синхронизация при push).
- `prompts/START.md` — единая raw-точка входа для Claude (обход бага коннектора).
- Исследование KupujemProdajem от Claude → `docs/sources/kupujemprodajem.md` (группы, пагинация, риски).
- Мост делегирования `tools/ask.py`: gemini (бесплатный ключ) + ollama в связке со мной, claude — заглушка до API-ключа (см. `docs/08-agents.md`). Журнал вызовов: `logs/ask-journal.md`.
- Парсер KupujemProdajem (`scrapers/kupujemprodajem.js`): 450 вакансий в базе, фильтр мусора («Tražim posao», «Prodajem posao»), зарплата из заголовков, сниппеты.
- Карточка v1: + сниппет (решение по консультации Gemini — 06-decisions); сайт показывает сниппеты.
- Словарь: личная база знаний импортирована → `data/glossary.db` (95 terms + 30 phrasebook, verified); оригинал в `docs/glossary/bazaznanja.txt`, загрузчик `tools/import-glossary.js`.
- Режим выживания: дефолты парсеров снижены, аудит кода и структуры → `docs/09-audit-economy.md`; CSV-снимок `snapshots/jobs.csv` (бэкап + тесты без сети).
- Карточки сайта — в телеграм-стиле (консенсус бэктеста gemini+ollama: пустые строки убраны, город первым, сниппет 3 строки).
- Бэктест двух сетей выполнен (журнал `logs/ask-journal.md`): следующий парсер — HaloOglasi; в очередь также helloworld.rs, lakodoposla.com, oglasi.rs (05-sources).

В работе: нет.

Задачи:
- [x] Каркас репозитория, документы, промпты-роли
- [x] Парсер Infostud → первые вакансии в jobs.db
- [x] Переезд на GitHub
- [ ] Парсер KupujemProdajem /poslovi → jobs.db
- [ ] Парсер Jooble Serbia → jobs.db
- [ ] Заполнить professions базовыми переводами должностей (Ollama)
- [ ] title_ru для спарсенных вакансий
- [ ] Извлечение слов из вакансий → glossary.db
- [ ] Telegram-канал: публикация карточек
