# Схема glossary.db

Словарь сербских слов и фраз, добытых из реальных вакансий.

```sql
CREATE TABLE terms (
  id            TEXT PRIMARY KEY,   -- nanoid
  term_sr       TEXT NOT NULL,      -- 'potreban radnik sa iskustvom'
  translation_ru TEXT,              -- 'требуется работник с опытом'
  pronunciation TEXT,               -- произношение по-русски (опционально)
  example_url   TEXT,               -- откуда взято (source_url вакансии)
  status        TEXT DEFAULT 'draft', -- 'draft' | 'verified'
  created_at    TEXT NOT NULL,
  UNIQUE(term_sr)
);

CREATE TABLE phrasebook (
  id            TEXT PRIMARY KEY,
  phrase_sr     TEXT NOT NULL,      -- целая фраза из объявления
  phrase_ru     TEXT NOT NULL,
  context       TEXT,               -- короткий контекст: 'требования к повару'
  example_url   TEXT,
  status        TEXT DEFAULT 'draft',
  created_at    TEXT NOT NULL,
  UNIQUE(phrase_sr)
);
```

## Поток данных

1. Парсер находит свежие вакансии.
2. Тексты вакансий → DeepSeek или Ollama выделяют незнакомые слова/фразы.
3. Ollama переводит пачками.
4. Результат пишется в terms / phrasebook со status='draft'.
5. Ты ревьюишь: ставишь status='verified' или удаляешь мусор.
6. С verified можно делать «слово дня» и подсказки в боте.

## Правила

- Не тащить очевидное (da = да, ne = нет).
- Приоритет: слова из требований и обязанностей (iskustvo, smena, prijava, neto, bruto...).
- У каждой записи есть пример-источник (example_url) — иначе не проверять.
