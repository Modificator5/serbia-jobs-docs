# Площадки-источники

Статусы: `idea` → `research` → `parser` → `active` → `discarded`.

| Площадка | URL | Статус | Парсер | Заметки |
|---|---|---|---|---|
| Poslovi Infostud | poslovi.infostud.com | active | `scrapers/infostud.js` | `__NEXT_DATA__` JSON, ~30/стр., зарплаты есть, сниппетов нет. Разведка: [sources/infostud.md](sources/infostud.md) |
| KupujemProdajem — Poslovi | kupujemprodajem.com/poslovi | active | `scrapers/kupujemprodajem.js` | классифайды, зарплата в заголовках, сниппеты у всех. Разведка: [sources/kupujemprodajem.md](sources/kupujemprodajem.md) |
| HaloOglasi — Posao | halooglasi.com/posao | active | `scrapers/halooglasi.js` | curl вместо fetch (TLS-отпечаток); нет дат/сниппетов |
| HelloWorld | helloworld.rs | active | `scrapers/helloworld.js` | IT; дата в листинге — срок действия, `posted_at` не парсим (баг исправлен 2026-10-31) |
| Jooble Serbia | rs.jooble.org | discarded | — | Cloudflare challenge (HTTP 403); без обхода ToS. Документ не удаляем — чтобы не исследовать заново |
| NSZ | nsz.gov.rs | discarded | — | CSR/сложный рендеринг → слишком затратно; старый парсер удалён |

## Очередь research

| Площадка | URL | Заметки |
|---|---|---|
| Poslovi.rs | poslovi.rs | категории, офферы; назван бэктестом |
| MojOglas | mojoglas.rs | классифайды |
| Joberty | joberty.rs | IT + отзывы о компаниях |
| Lako do posla | lakodoposla.com | кадровый агрегатор; назван бэктестом |
| Oglasi.rs | oglasi.rs | доска объявлений, раздел posao |

## Отложено

- Facebook-группы — много мусора, мало конкретики.
- Instagram — сложный парсинг, API нет.
- LinkedIn — агрессивная защита от парсинга.
- Glassdoor/Indeed — антибот / закрытие локальных редакций.

## Технические правила

- Перед парсингом площадки: robots.txt и структура пагинации.
- У каждой площадки свой модуль в `scrapers/`, общий интерфейс — сборка массива `jobs` + `upsertJob`.
- Дефолты страниц маленькие (KP 5, Infostud 2); полный прогон — явной командой.
