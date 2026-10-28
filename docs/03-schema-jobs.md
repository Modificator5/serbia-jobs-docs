# Схема jobs.db

Короткая карточка вакансии. Без полных описаний.

```sql
CREATE TABLE jobs (
  id              TEXT PRIMARY KEY,          -- nanoid
  source          TEXT NOT NULL,             -- 'infostud' | 'kupujemprodajem' | 'jooble' | ...
  source_url      TEXT NOT NULL UNIQUE,      -- ссылка на оригинал
  title_sr        TEXT NOT NULL,             -- должность на сербском
  title_ru        TEXT,                      -- перевод (из professions или вручную)
  city            TEXT,                      -- Beograd, Niš, ...
  salary_raw      TEXT,                      -- как написано: 'neto 80.000 - 100.000 RSD'
  salary_min      INTEGER,                   -- число для фильтров
  salary_max      INTEGER,
  requirements_short TEXT,                   -- 1-2 главных требования
  company_short   TEXT,                      -- имя компании
  category_tag    TEXT,                      -- ugostiteljstvo | gradjevina | it | dostava | ...
  posted_at       TEXT,                      -- дата публикации (ISO)
  parsed_at       TEXT NOT NULL,             -- когда спарсили (ISO)
  is_published    INTEGER DEFAULT 0          -- 0/1: выложено ли в канал
);

CREATE INDEX idx_jobs_city ON jobs(city);
CREATE INDEX idx_jobs_category ON jobs(category_tag);
CREATE INDEX idx_jobs_published ON jobs(is_published);
```

## Таблица professions — переводы должностей

```sql
CREATE TABLE professions (
  title_sr  TEXT PRIMARY KEY,  -- 'Kuvar'
  title_ru  TEXT NOT NULL      -- 'повар'
);
```

Заполняется вручную и через Ollama; используется для единообразия title_ru.

## Таблица categories — теги

```sql
CREATE TABLE categories (
  tag      TEXT PRIMARY KEY,   -- 'ugostiteljstvo'
  name_ru  TEXT                -- 'HoReCa / рестораны'
);
```

## Правила

- `title_sr` обязателен; остальное — если площадка дала.
- `salary_min/max` — только числа RSD/EUR, всё остальное в salary_raw.
- `requirements_short` — максимум ~120 символов.
- `raw_text` в этой базе НЕ хранится.
