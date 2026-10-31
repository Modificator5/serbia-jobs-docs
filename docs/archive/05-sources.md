# Площадки-источники

Статус: `idea` → `research` → `parser` → `active` → `discarded`

## Стартовый набор (парсим первыми)

| Площадка | URL | Что есть | Статус |
|---|---|---|---|
| Poslovi Infostud | poslovi.infostud.com | Главная площадка, ~10 000 вакансий, есть зарплаты | active |
| KupujemProdajem — Poslovi | kupujemprodajem.com/poslovi | Классифайды, физработа, мастера, доставка, HoReCa; исследование: [sources/kupujemprodajem.md](sources/kupujemprodajem.md) | active |
| Jooble Serbia | rs.jooble.org | Агрегатор; Cloudflare challenge (HTTP 403) — парсинг невозможен | discarded |

## Следующие

| Площадка | URL | Заметки | Статус |
|---|---|---|---|
| HaloOglasi — Posao | halooglasi.com/posao | Классифайд; парсер готов (`scrapers/halooglasi.js`); нет дат/сниппетов | active |
| NSZ (гос. служба занятости) | nsz.gov.rs | CSR / Сложный рендеринг $\to$ слишком затратно | discarded |
| Poslovi.rs | poslovi.rs | Категории, есть офферы; подтверждён бэктестом | research |
| MojOglas | mojoglas.rs | Классифайды | research |
| HelloWorld | helloworld.rs | IT-вакансии; парсер готов (scrapers/helloworld.js) | active |
| Joberty | joberty.rs | IT + отзывы о компаниях | research |
| Lako do posla | lakodoposla.com | Кадровый агрегатор; назван бэктестом | research |
| Oglasi.rs | oglasi.rs | Доска объявлений, раздел posao; назван бэктестом | research |

## Отложено

| Источник | Почему отложено |
|---|---|
| Facebook-группы | Много мусора, мало конкретики |
| Instagram | Сложный парсинг, API нет |
| LinkedIn | Агрессивная защита от парсинга |

## Технические заметки

- Перед парсингом любой площадки: изучить robots.txt и структуру пагинации.
- Всё, что спарсено, идёт в `data/raw/` $\to$ нормализация $\to$ короткая карточка.
- У каждой площадки свой модуль в `scrapers/`, общий интерфейс `fetch()`.
