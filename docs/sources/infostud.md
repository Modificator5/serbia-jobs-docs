# Infostud — техническое исследование

Статус: активен, парсер работает (`scrapers/infostud.js`).

- URL листинга: `https://poslovi.infostud.com/oglasi-za-posao?page=N`
- Пагинация: `?page=N`, 30 вакансий на страницу, всего ~3 374 (на 2026-10-28).
- Данные: в HTML есть `__NEXT_DATA__` → `props.pageProps.initialSearchResults.jobs.primary` — массив объектов со всеми полями: title, companyName, location, salary, standardizedPosition.name, primaryCategory.name, url, onlineViewDate, shift, workFromHome, hybridWork.
- HTML-скрейпинг не нужен — достаточно JSON из `__NEXT_DATA__`.
- Robots.txt: листинг `/oglasi-za-posao` и карточки `/posao/...` не запрещены.
- Зарплаты: есть не у всех; формат `neto 90.000 - 120.000 RSD` (точка — тысячи).
- Категории: чистые, из `primaryCategory.name` маппятся в category_tag (`scrapers/db.js`).
