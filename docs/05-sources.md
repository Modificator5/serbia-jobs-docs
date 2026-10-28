# Площадки-источники

Статус: `idea` → `research` → `parser` → `active`

## Стартовый набор (парсим первыми)

| Площадка | URL | Что есть | Статус |
|---|---|---|---|
| Poslovi Infostud | poslovi.infostud.com | Главная площадка, ~10 000 вакансий, есть зарплаты | active |
| KupujemProdajem — Poslovi | kupujemprodajem.com/poslovi | Классифайды, физработа, мастера, доставка, HoReCa; исследование: [sources/kupujemprodajem.md](sources/kupujemprodajem.md) | parser |
| Jooble Serbia | rs.jooble.org | Агрегатор | parser |

## Следующие

| Площадка | URL | Заметки | Статус |
|---|---|---|---|
| NSZ (гос. служба занятости) | nsz.gov.rs | База вакансий, много неофициальных | research |
| Poslovi.rs | poslovi.rs | Категории, есть офферы | research |
| MojOglas | mojoglas.rs | Классифайды | research |
| HelloWorld | helloworld.rs | IT-вакансии | research |
| Joberty | joberty.rs | IT + отзывы о компаниях | research |

## Отложено

| Источник | Почему отложено |
|---|---|
| Facebook-группы | Много мусора, мало конкретики; оставляем, будем фильтровать позже |
| Instagram | Сложный парсинг, API нет; вернёмся после MVP |
| LinkedIn | Агрессивная защита от парсинга; через API/вручную |

## Технические заметки

- Перед парсингом любой площадки: изучить robots.txt и структуру пагинации.
- Всё, что спарсено, идёт в `data/raw/` → нормализация → короткая карточка.
- У каждой площадки свой модуль в `scrapers/`, общий интерфейс `fetch()`.
