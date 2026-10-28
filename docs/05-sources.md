# Площадки-источники

Статус: `idea` → `research` → `parser` → `active`

## Стартовый набор (парсим первыми)

| Площадка | URL | Что есть | Статус |
|---|---|---|---|
| Poslovi Infostud | poslovi.infostud.com | Главная площадка, ~10 000 вакансий, есть зарплаты | active |
| KupujemProdajem — Poslovi | kupujemprodajem.com/poslovi | Классифайды, физработа, мастера, доставка, HoReCa; исследование: [sources/kupujemprodajem.md](sources/kupujemprodajem.md) | active |
| Jooble Serbia | rs.jooble.org | Агрегатор; проверено 2026-10-28: Cloudflare challenge (HTTP 403 «Just a moment») — без обхода антибота (ToS-риск) парсинг невозможен; возвращаемся, если появится открытый доступ или API | idea |

## Следующие

| Площадка | URL | Заметки | Статус |
|---|---|---|---|
| HaloOglasi — Posao | halooglasi.com/posao | Классифайд; парсер готов (`scrapers/halooglasi.js`, +106 ads); в листинге нет дат/сниппетов; node-fetch → 403, грузим через curl | active |
| NSZ (гос. служба занятости) | nsz.gov.rs | База вакансий, много неофициальных | research |
| Poslovi.rs | poslovi.rs | Категории, есть офферы; подтверждён бэктестом | research |
| MojOglas | mojoglas.rs | Классифайды | research |
| HelloWorld | helloworld.rs | IT-вакансии; подтверждён бэктестом (от создателей Infostud) | research |
| Joberty | joberty.rs | IT + отзывы о компаниях | research |
| Lako do posla | lakodoposla.com | Кадровый агрегатор; назван бэктестом | research |
| Oglasi.rs | oglasi.rs | Доска объявлений, раздел posao; назван бэктестом | research |

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
