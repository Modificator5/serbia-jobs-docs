
## 2026-10-28 17:37:45 — gemini (gemini-3.5-flash)

**Задача:**
Ты — продуктовый аналитик Telegram-канала с вакансиями Сербии для русскоязычных людей. Канал показывает компактные карточки вакансий. Сейчас в карточке: заголовок (сербский), город, зарплата (если удалось вытащить), компания (если есть), дата публикации, источник, краткие требования.
С нового парсера (сайт KupujemProdajem, сербский классифайд) дополнительно доступны: сниппет описания (~70-150 символов на сербском), группа объявления (например Majstori, Ugostiteljstvo, Prevoz i dostava), счётчик просмотров, метка платной промо-раскрутки, возраст («pre 10 dana» — но у нас есть точная дата публикации).
Вопросы, ответь по-русски нумерованным списком, максимум 15 строк:
1) стоит ли добавлять в карточку больше информации — что именно (сниппет? просмотры? что-то ещё?), чтобы карточка была полезнее, но не перегружена;
2) финальный состав карточки для v1 канала (список полей);
3) какие из доступных полей не добавлять и почему.

**Ответ:**
1) **Что добавить:** Стоит добавить **сниппет описания** (дает важный контекст сербского заголовка и энокомит клики) и **группу/категорию** (в формате хэштега для удобной навигации).
2) **Состав карточки v1:**
   • `#Категория` (хэштег)
   • **Заголовок** (сербский) + 📍 **Город**
   • 💰 **Зарплата** (если есть) | 🏢 **Компания** (если есть)
   • 📝 **Сниппет описания** (100–150 символов) + требования
   • 📅 **Дата публикации** | 🔗 **Ссылка на источник**
3) **Что НЕ добавлять и почему:**
   • **Счётчик просмотров:** лишний шум, создает ложный стресс «высокой конкуренции».
   • **Промо-метка:** сбивает толк, выглядит как платная реклама внутри вашего TG-канала.
   • **Возраст («pre 10 dana»):** избыточен, так как уже есть точная дата публикации.

## 2026-10-28 18:04:03 — gemini (gemini-3.5-flash)

**Задача:**
Бэктест парсера вакансий Сербии (для русскоязычных). База: 510 вакансий — KupujemProdajem 450 (классифайд: zanat 91, prevoz 70, gradjevina 59, trgovina 40, fizicki 25, njega 23, higijena 22, ugostiteljstvo 18, it 17…), Infostud 60 (кадровый агрегатор). Поля у всех: заголовок серб., город, сниппет 70-150 символов, дата, ссылка; зарплата ТОЛЬКО у 5 из 450 KP (только из заголовка); компания у KP нет. Вопросы, коротко списками до 14 строк суммарно:
1) Телеграм-карточка: если нет зарплаты/компании — убрать строку или писать «н.д.»? Сниппет в 3 строки — достаточно?
2) Что для читателя-русского важнее: чип категории или город?
3) Какие ещё реальные сайты Сербии с открытыми вакансиями (без логина, без API) парсить следующими? До 8 пунктов, только рабочие площадки.

**Ответ:**
**1. Карточка в Telegram:**
* **Скрывать пустые строки** (без «н.д.») — это экономит экранное пространство и убирает визуальный шум.
* **3 строки сниппета — достаточно** (120–150 символов оптимально для быстрого сканинга с экрана телефона).

**2. Что важнее русскоязычному читателю:**
* **Город важнее категории**: релоканты строго привязаны к локации (Белград / Нови-Сад / Суботица) из-за ВНЖ, договора аренды (стaн) и логистики. Категория идет вторым приоритетом.

**3. Реальные открытые сайты вакансий Сербии (без API/логина):**
* **Halo Oglasi Poslovi** (`halooglasi.com/poslovi`) — главный классифайд-конкурент KP, огромная база.
* **Lako do posla** (`lakodoposla.com`) — открытый кадровый агрегатор, легкий парсинг.
* **HelloWorld** (`helloworld.rs`) — крупнейшая IT-площадка Сербии (от создателей Infostud).
* **Oglasi.rs** (`oglasi.rs/posao`) — крупная доска объявлений с вакансиями.
* **Klik do posla** (`klikdoposla.com`) — кадровый сайт с региональными вакансиями.
* **Posao Srbija** (`posao-srbija.com`) — простой открытый каталог вакансий.

## 2026-10-28 18:04:04 — ollama (gemma4:cloud)

**Задача:**
Бэктест парсера вакансий Сербии (для русскоязычных). База: 510 вакансий — KupujemProdajem 450 (классифайд: zanat 91, prevoz 70, gradjevina 59, trgovina 40, fizicki 25, njega 23, higijena 22, ugostiteljstvo 18, it 17…), Infostud 60 (кадровый агрегатор). Поля у всех: заголовок серб., город, сниппет 70-150 символов, дата, ссылка; зарплата ТОЛЬКО у 5 из 450 KP (только из заголовка); компания у KP нет. Вопросы, коротко списками до 14 строк суммарно:
1) Телеграм-карточка: если нет зарплаты/компании — убрать строку или писать «н.д.»? Сниппет в 3 строки — достаточно?
2) Что для читателя-русского важнее: чип категории или город?
3) Какие ещё реальные сайты Сербии с открытыми вакансиями (без логина, без API) парсить следующими? До 8 пунктов, только рабочие площадки.

**Ответ:**
1) **Карточка:**
*   Строки с «н.д.» — убрать (засоряют эфир).
*   Сниппет в 3 строки — достаточно, если есть ссылка на оригинал.

2) **Приоритет:**
*   Город (критично для физического труда/быта).
*   Категория (вторично, так как заголовок дает понимание).

3) **Что парсить дальше:**
*   Lojalnica.rs (вакансии в ритейле/сервисе)
*   Poslovi.rs (агрегатор)
*   HaloOglasi.com (раздел Posao — аналог KP)
*   LinkedIn (поиск по региону Serbia)
*   Facebook Groups (поиск по ключам "Posao Srbija", "Русские в Сербии")
*   Indeed Serbia
*   Glassdoor (Serbia)
*   Сайты крупных сетей (например, Lidl, Maxi)

## 2026-10-28 18:29:06 — ollama (gemma4:cloud)

**Задача:**
Переведи сербские названия вакансий на русский. Строго JSON-объект {"оригинал":"перевод"}, без markdown, без пояснений, один объект.
"menadžer plana i analize"
"menadžer logistike"
"magacioner"
"radnik u proizvodnji"
"Menadžer prodaje "
"IT praktikant"
"medicinska sestra/tehničar"
"Poslovni analitičar"
"Menadžer za digitalni marketing"
"Računovođa"
"specijalista zadužen za proces selekcije"
"Referent za ljudske resurse"
"rukovodilac mašinske službe"
"mašinski inženjer"
"šef računovodstva"
"Prodajni savetnik"
"službenik za prijem i pomoć klijentima"
"higijeničar/ka"
"elektro-projektant"
"prodavac"
"farmaceutski tehničar"
"Telefonski operater"
"lekar/doktor"
"Geodetski tehničar"
"Supervizor proizvodnje"
"Consultant  for Business Software"
"Product Manager"
"UX / UI / WEB Designer"
"Operater u kladionici"
"radnik/službenik obezbeđenja"
"kasir"
"kontrolor održavanja-električar"
"IT Manager"
"dispečer"
"radnik u turističkoj agenciji"
"komercijalista"
"arhitekta"
"inženjer održavanja"
"Rukovodilac odeljenja za zaštitu na radu"
"tehničar za instalaciju opreme"
"Kurir-vozač"
"Wolt/Glovo posao"
"Wolt Novi Sad"
"Posao dostavljac wolt / glovo (Bg,NS,Ni,Kr,Ku,Kg,SM,Po,Zr)"
"Potrebni Fizicki Radnici i majstori"
"Vozač B kategorije"
"Taxi vozač (Flash taxi)"
"Elektrotehnicar / Elektroinstalater"
"Stolar"
"Vozac C kategorije"
"Gipsarski radovi"
"Vulkanizer Plata 100.000. Rad na procenat, Bonus"
"Auto Limar"
"Autoelektričar - dijagnostičar"
"Auto mehaničar"
"Dostavljac hrane"
"Pomoć u kući"
"cnc strugar"
"Dispacher, After hours, Recruting, Maintenance"
"Montažer klima"
"Pvc stolarija"
"Potrebni radnici za rad u inostranstvu"
"Pomoćni radnik u trgovini"
"Kuvarica za kuvana jela"
"Potreban konobar ili konobarica za rad u restoranu - Beograd"
"Poterban mesar za pandlovanje piletine - ZLATNA KOKA 9"
"Asistent negovatelj"
"DAK MUSIC SHOP zaposljava – AudioRentalTehnicar"
"Potrebne radnice za rad u poslasticarnici"
"Firma Top Gips zapošljava Gipsara"

**Ответ:**
{"menadžer plana i analize":"менеджер по планированию и анализу","menadžer logistike":"менеджер по логистике","magacioner":"кладовщик","radnik u proizvodnji":"рабочий производства","Menadžer prodaje ":"менеджер по продажам","IT praktikant":"IT-стажер","medicinska sestra/tehničar":"медицинская сестра/техник","Poslovni analitičar":"бизнес-аналитик","Menadžer za digitalni marketing":"менеджер по цифровому маркетингу","Računovođa":"бухгалтер","specijalista zadužen za proces selekcije":"специалист по подбору персонала","Referent za ljudske resurse":"специалист по кадрам","rukovodilac mašinske službe":"начальник машинной службы","mašinski inženjer":"инженер-механик","šef računovodstva":"главный бухгалтер","Prodajni savetnik":"консультант по продажам","službenik za prijem i pomoć klijentima":"специалист по приему и поддержке клиентов","higijeničar/ka":"уборщик/ца","elektro-projektant":"инженер-электрик (проектировщик)","prodavac":"продавец","farmaceutski tehničar":"фармацевт-техник","Telefonski operater":"оператор call-центра","lekar/doktor":"врач","Geodetski tehničar":"техник-геодезист","Supervizor proizvodnje":"супервайзер производства","Consultant for Business Software":"консультант по бизнес-ПО","Product Manager":"продакт-менеджер","UX / UI / WEB Designer":"UX / UI / WEB дизайнер","Operater u kladionici":"оператор букмекерской конторы","radnik/službenik obezbeđenja":"сотрудник охраны","kasir":"кассир","kontrolor održavanja-električar":"контролер по техническому обслуживанию-электрик","IT Manager":"IT-менеджер","dispečer":"диспетчер","radnik u turističkoj agenciji":"сотрудник туристического агентства","komercijalista":"коммерсант/торговый представитель","arhitekta":"архитектор","inženjer održavanja":"инженер по техническому обслуживанию","Rukovodilac odeljenja za zaštitu na radu":"руководитель отдела по охране труда","tehničar za instalaciju opreme":"техник по установке оборудования","Kurir-vozač":"курьер-водитель","Wolt/Glovo posao":"работа в Wolt/Glovo","Wolt Novi Sad":"Wolt Нови-Сад","Posao dostavljac wolt / glovo (Bg,NS,Ni,Kr,Ku,Kg,SM,Po,Zr)":"работа курьером Wolt / Glovo (Белград, Нови-Сад, Ниш и др.)","Potrebni Fizicki Radnici i majstori":"требуются разнорабочие и мастера","Vozač B kategorije":"водитель категории B","Taxi vozač (Flash taxi)":"водитель такси (Flash taxi)","Elektrotehnicar / Elektroinstalater":"электротехник / электромонтажник","Stolar":"столяр","Vozac C kategorije":"водитель категории C","Gipsarski radovi":"гипсокартонные работы","Vulkanizer Plata 100.000. Rad na procenat, Bonus":"шиномонтажник (ЗП 100.000, процент, бонус)","Auto Limar":"автожестянщик","Autoelektričar - dijagnostičar":"автоэлектрик-диагност","Auto mehaničar":"автомеханик","Dostavljac hrane":"курьер по доставке еды","Pomoć u kući":"помощник по хозяйству","cnc strugar":"оператор ЧПУ-токарного станка","Dispacher, After hours, Recruting, Maintenance":"диспетчер, послерабочее время, рекрутинг, обслуживание","Montažer klima":"монтажник кондиционеров","Pvc stolarija":"мастер по ПВХ-окнам и дверям","Potrebni radnici za rad u inostranstvu":"требуются рабочие для работы за границей","Pomoćni radnik u trgovini":"помощник продавца","Kuvarica za kuvana jela":"повар по приготовлению готовых блюд","Potreban konobar ili konobarica za rad u restoranu - Beograd":"требуется официант или официантка в ресторан - Белград","Poterban mesar za pandlovanje piletine - ZLATNA KOKA 9":"требуется мясник для разделки курицы - ZLATNA KOKA 9","Asistent negovatelj":"ассистент по уходу","DAK MUSIC SHOP zaposljava – AudioRentalTehnicar":"DAK MUSIC SHOP нанимает техника по аренде аудиооборудования","Potrebne radnice za rad u poslasticarnici":"требуются сотрудницы в кондитерскую","Firma Top Gips zapošljava Gipsara":"фирма Top Gips нанимает гипсокартонщика"}

## 2026-10-28 18:29:14 — ollama (gemma4:cloud)

**Задача:**
Переведи сербские названия вакансий на русский. Строго JSON-объект {"оригинал":"перевод"}, без markdown, без пояснений, один объект.
"Automehanicar majstor"
"Potrebni malterdzije"
"Perionica veša"
"Potreban vozac C kategorije za kombi"
"Automehaničar dijagnostičar"
"prodavačice"
"Fasader"
"vozač B kategorije"
"Potreban radnik/ca"
"Prodavac"
"Taxi vozač"
"Konobar"
"Potreban pomoćni radnik u bravarskoj radionici ČAČAK"
"Dostavljac paketa GLS"
"Nabavka i slanje robe za online shop"
"Operativac na prijemi i slanju pošiljaka"
"Vulkanizer"
"POTREBAN RADNIK VULKANIZER sa ili bez iskustva"
"Radnik - Vulkanizer"
"Bravari"
"Prodavac solarnih elektrana !"
"Operater digitalne štampe i grafički dizajner"
"Potrebni su vam magacinski radnici?"
"Potrebni su vam radnici u kuhinji?"
"Potrebni su vam vozaci?"
"Fizicki radnik u servisu bele tehnike"
"Zaposljavamo radnika/prodavca"
"Radnik na farmi krava"
"Potreban AUTOMEHANIČAR"
"Potrebni radnici za uređenje dvorišta i arborista 250000"
"Agencija za selidbe - Menadžer prodaje i rukovodilac"
"Fizički radnik za selidbe - Agencija Moja Selidba"
"Varioc bravar"
"Pomoćni radnik u servisu"
"Potreban ozbiljan momak za prevoz I prodaju vozila"
"Operater na masini"
"Pomoćnik gipsara"
"Vozač B kategorije Dostava i rad u magacinu"
"Saradnik za plastične septičke jame i ugradnju-Niš"
"Vodoinstalateri"
"Saradnik u prodaji - rada od kuće"
"auto mehaničar"
"Monter čeličnih konstrukcija"
"Majtor za alu i pvc stolariju"
"Automehanicar"
"Potreban pomocnik varioca mesecna plata 80,000 din"
"Potreban instalater solarnih sistema – Alijans Pro Solar"
"Trgovac u maloprodaji početna plata 72.000"
"Vožač - montažer nameštaja počenta plata 95.000rsd"
"Krojacica-Snajderka"
"Zaposljavamo vulkanizere vulkanizer posao"
"Zaposljavamo Vulkanizera posao vulkanizer Zrenjanin"
"sadnica maline"
"Brentista i pomocni radnik"
"Radnik u firmi za izgradnju bazena"
"Farbar - priprema i farbanje viljuškara"
"Saradnik za javne nabavke (Part-time)"
"stolica za frizere"
"Trazim dva studenta"
"Majstor za montažu ventilisanih fasada"
"manikir-pedikir"
"Potrebni majstori i polu majstori"
"Musko-Zenski frizer"
"Potreban vulkanizer sa radnim iskustvom"
"Gipsar"
"Ponuda partnerstva za Bravarsko - Zavarivacke usluge"
"Potreban Taxi vozac Nis"
"Potrebna kucna pomocnica"
"LIMAR i Pomoćni radnik u GRAĐEVINSKOJ LIMARIJI"
"Welder needed city of Pancevo accommodation provided"

**Ответ:**
{
"Automehanicar majstor": "Автомеханик-мастер",
"Potrebni malterdzije": "Требуются штукатуры",
"Perionica veša": "Прачечная",
"Potreban vozac C kategorije za kombi": "Требуется водитель категории C на комби",
"Automehaničar dijagnostičar": "Автомеханик-диагност",
"prodavačice": "Продавцы-консультанты (жен)",
"Fasader": "Фасадчик",
"vozač B kategorije": "Водитель категории B",
"Potreban radnik/ca": "Требуется работник/ца",
"Prodavac": "Продавец",
"Taxi vozač": "Водитель такси",
"Konobar": "Официант",
"Potreban pomoćni radnik u bravarskoj radionici ČAČAK": "Требуется помощник в слесарную мастерскую, ЧАЧАК",
"Dostavljac paketa GLS": "Курьер по доставке посылок GLS",
"Nabavka i slanje robe za online shop": "Закупка и отправка товаров для интернет-магазина",
"Operativac na prijemi i slanju pošiljaka": "Оператор по приему и отправке посылок",
"Vulkanizer": "Шиномонтажник",
"POTREBAN RADNIK VULKANIZER sa ili bez iskustva": "ТРЕБУЕТСЯ ШИНОМОНТАЖНИК с опытом или без",
"Radnik - Vulkanizer": "Работник-шиномонтажник",
"Bravari": "Слесари",
"Prodavac solarnih elektrana !": "Продавец солнечных электростанций !",
"Operater digitalne štampe i grafički dizajner": "Оператор цифровой печати и графический дизайнер",
"Potrebni su vam magacinski radnici?": "Нужны работники склада?",
"Potrebni su vam radnici u kuhinji?": "Нужны работники на кухню?",
"Potrebni su vam vozaci?": "Нужны водители?",
"Fizicki radnik u servisu bele tehnike": "Разнорабочий в сервис по ремонту бытовой техники",
"Zaposljavamo radnika/prodavca": "Нанимаем работника/продавца",
"Radnik na farmi krava": "Работник на молочной ферме",
"Potreban AUTOMEHANIČAR": "Требуется АВТОМЕХАНИК",
"Potrebni radnici za uređenje dvorišta i arborista 250000": "Требуются работники по благоустройству двора и арбористы 250000",
"Agencija za selidbe - Menadžer prodaje i rukovodilac": "Агентство по переездам - Менеджер по продажам и руководитель",
"Fizički radnik za selidbe - Agencija Moja Selidba": "Грузчик для переездов - Агентство Moja Selidba",
"Varioc bravar": "Слесарь-сварщик",
"Pomoćni radnik u servisu": "Помощник в сервисе",
"Potreban ozbiljan momak za prevoz I prodaju vozila": "Требуется ответственный молодой человек для перевозки и продажи автомобилей",
"Operater na masini": "Оператор станка",
"Pomoćnik gipsara": "Помощник гипсокартонщика",
"Vozač B kategorije Dostava i rad u magacinu": "Водитель категории B: доставка и работа на складе",
"Saradnik za plastične septičke jame i ugradnju-Niš": "Специалист по пластиковым септикам и их установке - Ниш",
"Vodoinstalateri": "Сантехники",
"Saradnik u prodaji - rada od kuće": "Специалист по продажам - удаленная работа",
"auto mehaničar": "автомеханик",
"Monter čeličnih konstrukcija": "Монтажник стальных конструкций",
"Majtor za alu i pvc stolariju": "Мастер по алюминиевым и ПВХ окнам/дверям",
"Automehanicar": "Автомеханик",
"Potreban pomocnik varioca mesecna plata 80,000 din": "Требуется помощник сварщика, зарплата в месяц 80 000 дин",
"Potreban instalater solarnih sistema – Alijans Pro Solar": "Требуется установщик солнечных систем – Alijans Pro Solar",
"Trgovac u maloprodaji početna plata 72.000": "Продавец в розничной торговле, стартовая зарплата 72 000",
"Vožač - montažer nameštaja počenta plata 95.000rsd": "Водитель-сборщик мебели, стартовая зарплата 95 000 дин",
"Krojacica-Snajderka": "Раскройщица-портниха",
"Zaposljavamo vulkanizere vulkanizer posao": "Нанимаем шиномонтажников, работа шиномонтажником",
"Zaposljavamo Vulkanizera posao vulkanizer Zrenjanin": "Нанимаем шиномонтажника, работа шиномонтажником в Зренянине",
"sadnica maline": "Питомник малины",
"Brentista i pomocni radnik": "Маляр по окраске (брентист) и помощник",
"Radnik u firmi za izgradnju bazena": "Работник в компанию по строительству бассейнов",
"Farbar - priprema i farbanje viljuškara": "Маляр - подготовка и покраска вилочных погрузчиков",
"Saradnik za javne nabavke (Part-time)": "Специалист по государственным закупкам (парт-тайм)",
"stolica za frizere": "кресло для парикмахеров",
"Trazim dva studenta": "Ищу двух студентов",
"Majstor za montažu ventilisanih fasada": "Мастер по монтажу вентилируемых фасадов",
"manikir-pedikir": "маникюр-педикюр",
"Potrebni majstori i polu majstori": "Требуются мастера и помощники мастеров",
"Musko-Zenski frizer": "Парикмахер-универсал (мужской и женский зал)",
"Potreban vulkanizer sa radnim iskustvom": "Требуется шиномонтажник с опытом работы",
"Gipsar": "Гипсокартонщик",
"Ponuda partnerstva za Bravarsko - Zavarivacke usluge": "Предложение о партнерстве по слесарным и сварочным услугам",
"Potreban Taxi vozac Nis": "Требуется водитель такси, Ниш",
"Potrebna kucna pomocnica": "Требуется домработница",
"LIMAR i Pomoćni radnik u GRAĐEVINSKOJ LIMARIJI": "Жестянщик и помощник в строительную жестянную мастерскую",
"Welder needed city of Pancevo accommodation provided": "Требуется сварщик, город Панчево, жилье предоставляется"
}

## 2026-10-28 18:29:28 — ollama (gemma4:cloud)

**Задача:**
Переведи сербские названия вакансий на русский. Строго JSON-объект {"оригинал":"перевод"}, без markdown, без пояснений, один объект.
"Radnik u agenciji Move Masters Selidbe"
"Konobarica i sankerica"
"Traze se radnici za rad u proizvodnji namestaja"
"Posao prodavca - servisera Ihouse mobilni telefoni Novi Sad"
"Senzorni terapeut / Reedukator psihomotorike posao Beograd"
"Pomocni majstor za klime / Pozovite: 064 529 9464"
"Trazimo sankere i konobare kafic Lastavica Novi Beograd"
"Elektroničar - pogonski automatičar"
"Pomoćni radnica u kuhinji"
"Pomoćni radnik-bravarija"
"Radnik u proizvodnji namestaja"
"Električar majstor"
"Posao telekomunikacija"
"Pomocni radnik"
"Prodavac suvenira"
"Radnik u Sony PlayStation igraonici M/Ž"
"Majstori i pomocni radnik  za klima uredjaje"
"Vozač dostavljač"
"Operater na CNC masini"
"Menadžer operacija u sektoru higijene"
"Prodavac modularnih kuća i kontejnera – Zemun"
"Prodaja i servis bicikala"
"Potrebni frizeri i kozmetičari"
"auto mehanicar"
"Potreban Radnik / Radnica za posao prodaje Opreme za Telefon"
"Kolega Wanted u MANHATTAN-u"
"Čuvanje muškog deteta"
"radnik majstor pomocnik staklorezac"
"majstor radnik u proizvodnji"
"Rukovaoc na silosu"
"Električar"
"Operater u proizvodnji stočne hrane"
"Posao"
"Potrebni radnici za gipsarske radove"
"Monter i pomoćni monter na SOLARNIM ELEKTRANAMA"
"Potreban Majstor za izradu PVC cerada – plata 150.000 RSD"
"Potrebna osoba za podelu reklamnog materijala"
"Elektromehaničar / Vikler elektro-motora"
"Potrebne osobe za podelu reklamnog materijala"
"Potrebno više radnica komercijalista za prodaju usluga na te"
"Potrebno više radnica za rad u call centru"
"Potrebno više spremačica za redovna održavanja poslovnih pro"
"Potrebno više radnica za generalna čišćenja"
"Potrebne radnice za komercijalu"
"Potrebni operateri za rad u call centru"
"Potrebne radnice za poslove razvoza i kontrole"
"Potrebne radnice za poslove čišćenja i održavanja 60.000-120"
"Čišćenje stanova i poslovnih prostora"
"TRGOVACKI PUTNIK - PRODAVAC NA TERENU"
"Potrebna usluga - Čačak, petak prepodne"
"Potrebne radnice za poziciju komercijaliste"
"Potrebne radnice za poziciju operatera"
"Potrebne radnice za kontrolu"
"Potrebne radnice za čišćenje firmi"
"Potrebne radnice za razna čišćenja"
"Potrebne radnice za call centar"
"Potrebne radnice sa B kategorijom za kontrolu"
"Potrebne spremačice 60 - 85.000"
"Potrebne radnice za čišćenje 70 - 120.000"
"Dostavljač i monter event opreme"
"Kokičar - Operater na aparatu za kokice (Beograd)"
"Nastavnik matematike u skoli za pripremu male mature"
"Housekeeping Supervisor"
"Serviser građevinskih mašina"
"Potreban mehanicar/elektricar"
"Laboratorijski tehničar"
"Vozač dostavljač pekarskih proizvoda"
"Potreban Vulkanizer"
"Moler"
"Fizični radnik u magacinu"

**Ответ:**
{
"Radnik u agenciji Move Masters Selidbe": "Работник в агентстве по переездам Move Masters",
"Konobarica i sankerica": "Официантка и бармен",
"Traze se radnici za rad u proizvodnji namestaja": "Требуются рабочие на производство мебели",
"Posao prodavca - servisera Ihouse mobilni telefoni Novi Sad": "Продавец-сервисмен в Ihouse (мобильные телефоны), Нови-Сад",
"Senzorni terapeut / Reedukator psihomotorike posao Beograd": "Сенсорный терапевт / Специалист по психомоторной реабилитации, Белград",
"Pomocni majstor za klime / Pozovite: 064 529 9464": "Помощник мастера по кондиционерам / Звоните: 064 529 9464",
"Trazimo sankere i konobare kafic Lastavica Novi Beograd": "Ищем барменов и официантов в кафе Lastavica, Новый Белград",
"Elektroničar - pogonski automatičar": "Электронщик - инженер по автоматизации производства",
"Pomoćni radnica u kuhinji": "Помощник на кухне",
"Pomoćni radnik-bravarija": "Помощник слесаря-замочника",
"Radnik u proizvodnji namestaja": "Рабочий на производство мебели",
"Električar majstor": "Мастер-электрик",
"Posao telekomunikacija": "Работа в сфере телекоммуникаций",
"Pomocni radnik": "Разнорабочий",
"Prodavac suvenira": "Продавец сувениров",
"Radnik u Sony PlayStation igraonici M/Ž": "Сотрудник в игровой клуб Sony PlayStation (М/Ж)",
"Majstori i pomocni radnik za klima uredjaje": "Мастера и помощник по кондиционерам",
"Vozač dostavljač": "Водитель-курьер",
"Operater na CNC masini": "Оператор станков с ЧПУ",
"Menadžer operacija u sektoru higijene": "Операционный менеджер в секторе гигиены",
"Prodavac modularnih kuća i kontejnera – Zemun": "Продавец модульных домов и контейнеров – Земун",
"Prodaja i servis bicikala": "Продажа и сервис велосипедов",
"Potrebni frizeri i kozmetičari": "Требуются парикмахеры и косметологи",
"auto mehanicar": "Автомеханик",
"Potreban Radnik / Radnica za posao prodaje Opreme za Telefon": "Требуется сотрудник/сотрудница по продаже аксессуаров для телефонов",
"Kolega Wanted u MANHATTAN-u": "Ищем коллегу в MANHATTAN",
"Čuvanje muškog deteta": "Присмотр за мальчиком",
"radnik majstor pomocnik staklorezac": "Рабочий, мастер, помощник стекольщика",
"majstor radnik u proizvodnji": "Мастер, рабочий на производстве",
"Rukovaoc na silosu": "Оператор элеватора (силоса)",
"Električar": "Электрик",
"Operater u proizvodnji stočne hrane": "Оператор на производстве кормов для животных",
"Posao": "Работа",
"Potrebni radnici za gipsarske radove": "Требуются рабочие для гипсокартонных работ",
"Monter i pomoćni monter na SOLARNIM ELEKTRANAMA": "Монтажник и помощник монтажника солнечных электростанций",
"Potreban Majstor za izradu PVC cerada – plata 150.000 RSD": "Требуется мастер по изготовлению ПВХ-тента – зп 150 000 RSD",
"Potrebna osoba za podelu reklamnog materijala": "Требуется человек для раздачи рекламных материалов",
"Elektromehaničar / Vikler elektro-motora": "Электромеханик / Обмотчик электродвигателей",
"Potrebne osobe za podelu reklamnog materijala": "Требуются люди для раздачи рекламных материалов",
"Potrebno više radnica komercijalista za prodaju usluga na te": "Требуется несколько торговых представителей (женщин) для продажи услуг",
"Potrebno više radnica za rad u call centru": "Требуется несколько сотрудниц в колл-центр",
"Potrebno više spremačica za redovna održavanja poslovnih pro": "Требуется несколько уборщиц для регулярного обслуживания офисов",
"Potrebno više radnica za generalna čišćenja": "Требуется несколько сотрудниц для генеральных уборок",
"Potrebne radnice za komercijalu": "Требуются сотрудницы в отдел продаж",
"Potrebni operateri za rad u call centru": "Требуются операторы в колл-центр",
"Potrebne radnice za poslove razvoza i kontrole": "Требуются сотрудницы для доставки и контроля",
"Potrebne radnice za poslove čišćenja i održavanja 60.000-120": "Требуются сотрудницы для уборки и обслуживания 60 000-120 000",
"Čišćenje stanova i poslovnih prostora": "Уборка квартир и офисных помещений",
"TRGOVACKI PUTNIK - PRODAVAC NA TERENU": "Торговый представитель - выездной продавец",
"Potrebna usluga - Čačak, petak prepodne": "Требуется услуга - Чачак, пятница утро",
"Potrebne radnice za poziciju komercijaliste": "Требуются сотрудницы на позицию торгового представителя",
"Potrebne radnice za poziciju operatera": "Требуются сотрудницы на позицию оператора",
"Potrebne radnice za kontrolu": "Требуются сотрудницы для контроля",
"Potrebne radnice za čišćenje firmi": "Требуются сотрудницы для уборки компаний",
"Potrebne radnice za razna čišćenja": "Требуются сотрудницы для различных видов уборки",
"Potrebne radnice za call centar": "Требуются сотрудницы в колл-центр",
"Potrebne radnice sa B kategorijom za kontrolu": "Требуются сотрудницы с категорией B для контроля",
"Potrebne spremačice 60 - 85.000": "Требуются уборщицы 60 000 - 85 000",
"Potrebne radnice za čišćenje 70 - 120.000": "Требуются сотрудницы для уборки 70 000 - 120 000",
"Dostavljač i monter event opreme": "Курьер и монтажник оборудования для мероприятий",
"Kokičar - Operater na aparatu za kokice (Beograd)": "Попкорн-щик - Оператор аппарата для попкорна (Белград)",
"Nastavnik matematike u skoli za pripremu male mature": "Учитель математики в школе подготовки к экзаменам",
"Housekeeping Supervisor": "Супервайзер службы клининга (Housekeeping)",
"Serviser građevinskih mašina": "Сервисмен строительной техники",
"Potreban mehanicar/elektricar": "Требуется механик/электрик",
"Laboratorijski tehničar": "Лаборант",
"Vozač dostavljač pekarskih proizvoda": "Водитель-доставщик хлебобулочных изделий",
"Potreban Vulkanizer": "Требуется шиномонтажник",
"Moler": "Маляр",
"Fizični radnik u magacinu": "Разнорабочий на склад"
}

## 2026-10-28 18:29:39 — ollama (gemma4:cloud)

**Задача:**
Переведи сербские названия вакансий на русский. Строго JSON-объект {"оригинал":"перевод"}, без markdown, без пояснений, один объект.
"Posao dostavljač Wolt/Glovo"
"Službenik obezbeđenja Zaječar"
"Potreban PLANER-GLETER"
"Negovateljice u Nemačkoj"
"Dostavljac na wolt platformi"
"Frizer"
"Potreban ozbiljan momak za prodaju vozila"
"Posao na nemačkom jeziku"
"Zavarivač na tig postupku"
"Pomoćnik keramičara"
"Menadžer prodaje / Marketing agencija"
"Potreban radnik za instalaciju hidrant - sprinkler sistema"
"0646716188"
"Pomocni radnik na gradjevini"
"Radnik na ekstruderu - mašini za izradu folije"
"Konobar-ica/ Šanker"
"Cuvanje dece, Palilula ili Cukarica"
"Poslovi-potreban magacioner-posao Beograd-MAGACIONER"
"Posao - potreban arhitekta - posao Beograd - ARHITEKTA"
"konobar i radnica u kuhinji"
"Radnik u proizvodnji"
"Administrativno - knigovodstveni radnik"
"Usluzno zavaraivanje TIG CO2 ELEKTRO"
"Radno mesto ŠIVAČ / KROJAČ"
"Prodavac - trgovac u maloprodaji auto delova"
"Inženjer elektrotehnike"
"Mašinski tehničar u proizvodnji elektro razvodnih ormana"
"Električar u proizvodnji"
"Dropsiping-u potrazi smo za saradnicima za rad od kuce"
"Potrebna dva radnika"
"Vozač kombija - B kategorija -  Moja Selidba agencija"
"Kuvar,  pomoćni radnik, šanker/konobar"
"Automehaničar"
"Trgovina i Servis Racunara TRIM Computers"
"Auto mehanicar"
"U potrazi smo za musko zenskog frizera"
"Radik/ca u perionici veša"
"Čuvala ti stariju osobu"
"Posao vozaca"
"Cvecar-prodavac"
"Magacioner - pakovanje paketa"
"Potreban radnik sa iskustvom u metrazi"
"Potrebni majstori i pomoćni radnici"
"Radnik /radnici za selidbe"
"Hitno zapošljvanje  vozaca kombija B kategorija"
"Autoperač - detailer"
"Potrebni instruktori joge, aerobika, zumbe, fitnesa, plesa.."
"Agent prodaje na terenu ( honorarni saradnik )"
"Zavarivac"
"Prodaja prodavnice zdrave hrane - Novi Beograd"
"Komercijalista za prodaju elektro razvodnih ormana (M/Ž)"
"Radnik u auto-perionici, perac vozila"
"Vozac b kategorije"
"Gipsari, moleri i pomoćni radnici"
"Serviser kotlova na gas i toplotnih pumpi"
"Serviser gasnih kotlova(pripravnik)"
"Potreban Kurir - Dostavljač"
"Potrebna radnica"
"Elektricar/vozač"
"Prodavac u marketu - trgovac - kasir"
"Prodavac muzickih instrumenata"
"Mehaničar potreban servisu"
"Potreban radnik za mužu krava sa iskustvom"
"Radnik na pranju i poliranju vozila"
"Monter telekomunikacione opreme"
"negovateljica"
"Pomocni radnik u Servisu"
"Pomocne i fizicke poslove"
"Majstor  gipsar i pomocnik gipsara"
"Uvoz radne snage"

**Ответ:**
{
"Posao dostavljač Wolt/Glovo": "Курьер Wolt/Glovo",
"Službenik obezbeđenja Zaječar": "Сотрудник охраны, Заечар",
"Potreban PLANER-GLETER": "Требуется планировщик-гладильщик",
"Negovateljice u Nemačkoj": "Сиделки в Германию",
"Dostavljac na wolt platformi": "Курьер на платформе Wolt",
"Frizer": "Парикмахер",
"Potreban ozbiljan momak za prodaju vozila": "Требуется ответственный сотрудник по продаже автомобилей",
"Posao na nemačkom jeziku": "Работа со знанием немецкого языка",
"Zavarivač na tig postupku": "Сварщик TIG",
"Pomoćnik keramičara": "Помощник плиточника",
"Menadžer prodaje / Marketing agencija": "Менеджер по продажам / Маркетинговое агентство",
"Potreban radnik za instalaciju hidrant - sprinkler sistema": "Требуется монтажник гидрантных и спринклерных систем",
"0646716188": "0646716188",
"Pomocni radnik na gradjevini": "Разнорабочий на стройке",
"Radnik na ekstruderu - mašini za izradu folije": "Оператор экструдера по производству пленки",
"Konobar-ica/ Šanker": "Официант/Бармен",
"Cuvanje dece, Palilula ili Cukarica": "Присмотр за детьми, Палилула или Чукарица",
"Poslovi-potreban magacioner-posao Beograd-MAGACIONER": "Работа: требуется кладовщик, Белград",
"Posao - potreban arhitekta - posao Beograd - ARHITEKTA": "Работа: требуется архитектор, Белград",
"konobar i radnica u kuhinji": "Официант и работница кухни",
"Radnik u proizvodnji": "Рабочий производства",
"Administrativno - knigovodstveni radnik": "Сотрудник по административно-бухгалтерским вопросам",
"Usluzno zavaraivanje TIG CO2 ELEKTRO": "Сварка TIG, CO2, Электро",
"Radno mesto ŠIVAČ / KROJAČ": "Вакансия: швея/закройщик",
"Prodavac - trgovac u maloprodaji auto delova": "Продавец автозапчастей в розничную торговлю",
"Inženjer elektrotehnike": "Инженер-электрик",
"Mašinski tehničar u proizvodnji elektro razvodnih ormana": "Техник-механик по производству электрораспределительных шкафов",
"Električar u proizvodnji": "Электрик на производство",
"Dropsiping-u potrazi smo za saradnicima za rad od kuce": "Дропшиппинг: ищем партнеров для удаленной работы из дома",
"Potrebna dva radnika": "Требуются два работника",
"Vozač kombija - B kategorija - Moja Selidba agencija": "Водитель микроавтобуса (кат. B) — агентство Moja Selidba",
"Kuvar, pomoćni radnik, šanker/konobar": "Повар, помощник, бармен/официант",
"Automehaničar": "Автомеханик",
"Trgovina i Servis Racunara TRIM Computers": "Магазин и сервис компьютеров TRIM Computers",
"Auto mehanicar": "Автомеханик",
"U potrazi smo za musko zenskog frizera": "Ищем парикмахера (мужчину или женщину)",
"Radik/ca u perionici veša": "Работник прачечной",
"Čuvala ti stariju osobu": "Сиделка для пожилого человека",
"Posao vozaca": "Работа водителем",
"Cvecar-prodavac": "Флорист-продавец",
"Magacioner - pakovanje paketa": "Кладовщик — упаковка посылок",
"Potreban radnik sa iskustvom u metrazi": "Требуется работник с опытом в раскрое тканей",
"Potrebni majstori i pomoćni radnici": "Требуются мастера и помощники",
"Radnik /radnici za selidbe": "Грузчики для переездов",
"Hitno zapošljvanje vozaca kombija B kategorija": "Срочно требуются водители микроавтобусов (кат. B)",
"Autoperač - detailer": "Автомойщик-детейлер",
"Potrebni instruktori joge, aerobika, zumbe, fitnesa, plesa..": "Требуются инструкторы по йоге, аэробике, зумбе, фитнесу, танцам",
"Agent prodaje na terenu ( honorarni saradnik )": "Торговый представитель (внештатный сотрудник)",
"Zavarivac": "Сварщик",
"Prodaja prodavnice zdrave hrane - Novi Beograd": "Продавец в магазин здорового питания — Новый Белград",
"Komercijalista za prodaju elektro razvodnih ormana (M/Ž)": "Торговый представитель по продаже электрораспределительных шкафов (М/Ж)",
"Radnik u auto-perionici, perac vozila": "Работник автомойки, мойщик машин",
"Vozac b kategorije": "Водитель категории B",
"Gipsari, moleri i pomoćni radnici": "Гипсокартонщики, маляры и помощники",
"Serviser kotlova na gas i toplotnih pumpi": "Сервис-мастер по газовым котлам и тепловым насосам",
"Serviser gasnih kotlova(pripravnik)": "Сервис-мастер по газовым котлам (стажер)",
"Potreban Kurir - Dostavljač": "Требуется курьер-доставщик",
"Potrebna radnica": "Требуется работница",
"Elektricar/vozač": "Электрик/водитель",
"Prodavac u marketu - trgovac - kasir": "Продавец в супермаркете — кассир",
"Prodavac muzickih instrumenata": "Продавец музыкальных инструментов",
"Mehaničar potreban servisu": "В сервис требуется механик",
"Potreban radnik za mužu krava sa iskustvom": "Требуется опытный работник для дойки коров",
"Radnik na pranju i poliranju vozila": "Работник по мойке и полировке автомобилей",
"Monter telekomunikacione opreme": "Монтажник телекоммуникационного оборудования",
"negovateljica": "сиделка",
"Pomocni radnik u Servisu": "Помощник в сервисном центре",
"Pomocne i fizicke poslove": "Подсобные и физические работы",
"Majstor gipsar i pomocnik gipsara": "Мастер-гипсокартонщик и его помощник",
"Uvoz radne snage": "Привлечение иностранной рабочей силы"
}

## 2026-10-28 18:29:44 — ollama (gemma4:cloud)

**Задача:**
Переведи сербские названия вакансий на русский. Строго JSON-объект {"оригинал":"перевод"}, без markdown, без пояснений, один объект.
"Čuvanje odrasle osobe"
"Pizza majstor"
"Potreban radnik sa tekstilnim iskustvom"
"Radnik u auto perionici"
"Vozac  E kategorije  ,vozac C kategorije"
"Obezbedjenje kineskog kulturnog centra"
"Kamenorezac, Stara Pazova - odlični uslovi"
"Majstor i pomocnik elektricara"
"Pomocnik elektricara"
"Potrebni su vam majstori?"
"Potreban vozac C kategorije"
"Vozac(radnik za selidbe)"
"Vozac B Kategorije u Medjunarodnom Transportu"
"Potrebni rukovaoci i vozači kamiona"
"Potreban grejderista-posao na duže"
"Agent za nekretnine"
"Potreban radnik - oblaganje kontejnera drvenarijom"
"Agent/Agentica prodaje"
"Pomoćni baštovanski radnik"
"Posao/ prostor auto servis"
"Potrebni su vam majstori za obradu metala?"
"Potrebni su vam radnici za obradu drveta?"
"Postrebni si vam farbari?"
"Potrebni su vam varioci?"
"Монтер суве градње (гипсар)"
"Prodavac u vinoteci"
"Pomoćni radnici"
"Prodavac opreme za grejanje, vodovod i kanalizaciju"
"Higijeničar/ka"
"Supervizor poslova higijene na objektu"
"Tehničar održavanja"
"Potreban masin bravar co2 varioc"
"Pomocni radnik u metalskoj proizvodnji Novom Sadu"
"Radnik u Auto Perionici, Perac- Auto Centar Hobotnica"
"Stolar,Magacioner,Montazer"
"Pomoćni radnici / radnice u radionici"
"Geometar i arhitekta  posao"
"Farbar"
"Grejanje klimatizacija majstor pomocni majstor"
"Zapošljavamo vozače kamiona – ZUKANOVIĆ TRANSPORT"
"Potreban automehanicar"
"Serviser Mašina i Opreme u industriji"
"Vozač  B i BE kategorije"
"pomocni radnik"
"Vozači"
"Taxi vozac u Krusevcu"
"Hidroizolater - podopolagač"
"Iskusni majstor za optičke mreže - Beograd"
"Higijenicar"
"Higijenicar/ka"
"Radnici u fast food-u"
"Vozač kamiona CE Kategorije"
"Fasader potreban"
"Zidari Tesari Armiraci"
"prodavacica market Mirijevo"
"posao vozača"
"Čuvanje dece"
"Elektro monter slabe struje"
"Majstor za gips i moler"
"Potreban vozac za razvoz hleba"
"Cuvanje deteta"
"Licni pratilac"
"Glovo dostavljac hrane i paketa"
"Visinski radnici sa sertifikatom"
"Pomoć i pratnja u Beogradu"
"Mašinski inženjer traži posao"
"Radnik na utovaru i istovaru prtljaga"
"Pomoć u pristupu do lekara"
"Posao za Stolara sa iskustvom"
"Pomocnik vulkanizera"

**Ответ:**
{
"Čuvanje odrasle osobe": "Уход за взрослым",
"Pizza majstor": "Пицца-мастер",
"Potreban radnik sa tekstilnim iskustvom": "Требуется работник с опытом в текстильной промышленности",
"Radnik u auto perionici": "Работник автомойки",
"Vozac E kategorije ,vozac C kategorije": "Водитель категории E, водитель категории C",
"Obezbedjenje kineskog kulturnog centra": "Охрана китайского культурного центра",
"Kamenorezac, Stara Pazova - odlični uslovi": "Каменщик-резчик, Стара-Пазова - отличные условия",
"Majstor i pomocnik elektricara": "Электрик и помощник электрика",
"Pomocnik elektricara": "Помощник электрика",
"Potrebni su vam majstori?": "Вам нужны мастера?",
"Potreban vozac C kategorije": "Требуется водитель категории C",
"Vozac(radnik za selidbe)": "Водитель (грузчик-перевозчик)",
"Vozac B Kategorije u Medjunarodnom Transportu": "Водитель категории B для международных перевозок",
"Potrebni rukovaoci i vozači kamiona": "Требуются операторы спецтехники и водители грузовиков",
"Potreban grejderista-posao na duže": "Требуется машинист грейдера - работа на длительный срок",
"Agent za nekretnine": "Агент по недвижимости",
"Potreban radnik - oblaganje kontejnera drvenarijom": "Требуется работник по деревянной обшивке контейнеров",
"Agent/Agentica prodaje": "Агент по продажам",
"Pomoćni baštovanski radnik": "Помощник садовника",
"Posao/ prostor auto servis": "Работа/помещение автосервиса",
"Potrebni su vam majstori za obradu metala?": "Вам нужны мастера по металлообработке?",
"Potrebni su vam radnici za obradu drveta?": "Вам нужны работники по деревообработке?",
"Postrebni si vam farbari?": "Вам нужны маляры?",
"Potrebni su vam varioci?": "Вам нужны сварщики?",
"Монтер суве градње (гипсар)": "Монтажник гипсокартона (штукатур)",
"Prodavac u vinoteci": "Продавец в винном бутике",
"Pomoćni radnici": "Подсобные рабочие",
"Prodavac opreme za grejanje, vodovod i kanalizaciju": "Продавец оборудования для отопления, водопровода и канализации",
"Higijeničar/ka": "Уборщик/уборщица",
"Supervizor poslova higijene na objektu": "Супервайзер по клинингу на объекте",
"Tehničar održavanja": "Техник по обслуживанию",
"Potreban masin bravar co2 varioc": "Требуется слесарь-механик, сварщик CO2",
"Pomocni radnik u metalskoj proizvodnji Novom Sadu": "Подсобный рабочий на металлопроизводство в Нови-Саде",
"Radnik u Auto Perionici, Perac- Auto Centar Hobotnica": "Работник автомойки, Perac- Auto Centar Hobotnica",
"Stolar,Magacioner,Montazer": "Столяр, кладовщик, монтажник",
"Pomoćni radnici / radnice u radionici": "Подсобные рабочие в мастерскую",
"Geometar i arhitekta posao": "Работа для геодезиста и архитектора",
"Farbar": "Маляр",
"Grejanje klimatizacija majstor pomocni majstor": "Мастер и помощник мастера по отоплению и кондиционированию",
"Zapošljavamo vozače kamiona – ZUKANOVIĆ TRANSPORT": "Нанимаем водителей грузовиков – ZUKANOVIĆ TRANSPORT",
"Potreban automehanicar": "Требуется автомеханик",
"Serviser Mašina i Opreme u industriji": "Сервисный инженер по промышленному оборудованию",
"Vozač B i BE kategorije": "Водитель категории B и BE",
"pomocni radnik": "подсобный рабочий",
"Vozači": "Водители",
"Taxi vozac u Krusevcu": "Водитель такси в Крушеваце",
"Hidroizolater - podopolagač": "Гидроизолятор - укладчик полов",
"Iskusni majstor za optičke mreže - Beograd": "Опытный мастер по оптическим сетям - Белград",
"Higijenicar": "Уборщик",
"Higijenicar/ka": "Уборщик/уборщица",
"Radnici u fast food-u": "Работники в фаст-фуд",
"Vozač kamiona CE Kategorije": "Водитель грузовика категории CE",
"Fasader potreban": "Требуется фасадчик",
"Zidari Tesari Armiraci": "Каменщики, плотники, арматурщики",
"prodavacica market Mirijevo": "Продавец в маркет Мириево",
"posao vozača": "работа водителем",
"Čuvanje dece": "Присмотр за детьми",
"Elektro monter slabe struje": "Электромонтажник слаботочных систем",
"Majstor za gips i moler": "Мастер по гипсокартону и маляр",
"Potreban vozac za razvoz hleba": "Требуется водитель для развоза хлеба",
"Cuvanje deteta": "Присмотр за ребенком",
"Licni pratilac": "Личный сопровождающий",
"Glovo dostavljac hrane i paketa": "Курьер Glovo по доставке еды и посылок",
"Visinski radnici sa sertifikatom": "Промышленные альпинисты с сертификатом",
"Pomoć i pratnja u Beogradu": "Помощь и сопровождение в Белграде",
"Mašinski inženjer traži posao": "Инженер-механик ищет работу",
"Radnik na utovaru i istovaru prtljaga": "Работник по погрузке и разгрузке багажа",
"Pomoć u pristupu do lekara": "Помощь в посещении врача",
"Posao za Stolara sa iskustvom": "Работа для столяра с опытом",
"Pomocnik vulkanizera": "Помощник шиномонтажника"
}

## 2026-10-28 18:29:49 — ollama (gemma4:cloud)

**Задача:**
Переведи сербские названия вакансий на русский. Строго JSON-объект {"оригинал":"перевод"}, без markdown, без пояснений, один объект.
"Kurir / Terenski saradnik"
"Domar"
"Kuvar, Pomoćni kuvar, pomoćni radnik u kuhinji"
"Vozač"
"Trazim pomocne radnike"
"Električari/monteri elektroinstalacija"
"Točilac/Kasir"
"Modelar - konstruktor odeće"
"Sredjivanje-stan na dan-Zemun"
"Vozac kamiona"
"Logoped za edukativni projekat"
"Bravar"
"Potreban Vozac C Kategorije Kran."
"Potreban Zidar."
"Potreban Administrativni Radnik"
"Potreban Trgovac na Stovaristu."
"Potreban Viljuskarista."
"Potreban Fizicki Radnik na Stovaristu."
"Wolt dostavljač"
"Vozač C kategorije"
"Ciscenje nakon gradjevinskih radova"
"Prodavac u butiku muskih odela"
"Taxi Vozač City Taxi, Taksi Vozac"
"Radnik u proizvodnji plastike"
"Tražimo kuvara i pomoćnog radnika u kuhinji"
"Potrebna zena za cuvanje starije osobe"
"Pomocni radnik u pekari"
"Gipsar, pomocnik gipsara"
"Internet prodaja"
"Šef proizvodnje"
"kombi prevoz beograd BRADA PP"
"Dadilja"
"Refernet prodaje karata"
"spremačica"
"Elektroinstalater"
"Posao operatera za masinom"
"Vozač sa sopstvenim vozilom"
"Potreban Radnik"
"Posao u Nemackoj - kosenje trave"
"vozač kombija redovna primanja b kategorija"
"Tesar sa iskustvom"
"Koordinator tehničke pripreme"
"Potreban volonter"
"Wolt Dostavljač"
"Majstor za ventilaciju"
"Taxi vozac Prvi taxi"
"Monter klima i Vrv sistema"
"konobar/ca"
"Službenik obezbeđenja - Maloprodajni objekat"
"Pratilac u transportu novca i vrednosti"
"potrebani voaci B kategorije za medjunarodni transport"
"potreban vozac B+E za medjunarodni transport"
"Recepcioner/ka"
"Sobar/ica"
"Odrzavanje apartmana- Niš"
"Autoelektričar - elektroničar"
"Potreban vozac B ili C kategorije"
"potrebni gipsari"
"gipsari"
"vulkanizer"
"Pomoćni radnik na montaži liftova"
"OGLAS ZA POSAO: Radnik u voćnom rasadniku – Siguran posao uz"
"Potreban radnik za rad na njivi i u hali"
"Taxi vozac"
"Kurir - dostava danas za danas, Beograd"
"Gipsar - pomocnik"
"Vozači B kategorije"
"Radnik u hemijskom čišćenju"
"Monter/visinski radnik u mobilnim telekomunikacijama"
"Vodoinstalater"

**Ответ:**
{
"Kurir / Terenski saradnik": "Курьер / Полевой сотрудник",
"Domar": "Завхоз / Домработник",
"Kuvar, Pomoćni kuvar, pomoćni radnik u kuhinji": "Повар, помощник повара, кухонный работник",
"Vozač": "Водитель",
"Trazim pomocne radnike": "Требуются разнорабочие",
"Električari/monteri elektroinstalacija": "Электрики / монтажники электросетей",
"Točilac/Kasir": "Заправщик / Кассир",
"Modelar - konstruktor odeće": "Модельер-конструктор одежды",
"Sredjivanje-stan na dan-Zemun": "Уборка посуточной квартиры - Земун",
"Vozac kamiona": "Водитель грузовика",
"Logoped za edukativni projekat": "Логопед для образовательного проекта",
"Bravar": "Слесарь",
"Potreban Vozac C Kategorije Kran.": "Требуется водитель категории C (крановщик)",
"Potreban Zidar.": "Требуется каменщик",
"Potreban Administrativni Radnik": "Требуется административный работник",
"Potreban Trgovac na Stovaristu.": "Требуется торговец / грузчик",
"Potreban Viljuskarista.": "Требуется водитель погрузчика",
"Potreban Fizicki Radnik na Stovaristu.": "Требуется разнорабочий на погрузку",
"Wolt dostavljač": "Курьер Wolt",
"Vozač C kategorije": "Водитель категории C",
"Ciscenje nakon gradjevinskih radova": "Уборка после строительных работ",
"Prodavac u butiku muskih odela": "Продавец в бутик мужских костюмов",
"Taxi Vozač City Taxi, Taksi Vozac": "Водитель такси City Taxi",
"Radnik u proizvodnji plastike": "Рабочий на производство пластика",
"Tražimo kuvara i pomoćnog radnika u kuhinji": "Ищем повара и помощника на кухню",
"Potrebna zena za cuvanje starije osobe": "Требуется сиделка для пожилого человека",
"Pomocni radnik u pekari": "Помощник пекаря",
"Gipsar, pomocnik gipsara": "Штукатур, помощник штукатура",
"Internet prodaja": "Интернет-продажи",
"Šef proizvodnje": "Начальник производства",
"kombi prevoz beograd BRADA PP": "Перевозки на микроавтобусе Белград",
"Dadilja": "Няня",
"Refernet prodaje karata": "Специалист по продаже билетов",
"spremačica": "Уборщица",
"Elektroinstalater": "Электромонтажник",
"Posao operatera za masinom": "Оператор станка",
"Vozač sa sopstvenim vozilom": "Водитель с собственным автомобилем",
"Potreban Radnik": "Требуется работник",
"Posao u Nemackoj - kosenje trave": "Работа в Германии - стрижка травы",
"vozač kombija redovna primanja b kategorija": "Водитель микроавтобуса (кат. B), стабильная оплата",
"Tesar sa iskustvom": "Плотник с опытом",
"Koordinator tehničke pripreme": "Координатор технической подготовки",
"Potreban volonter": "Требуется волонтер",
"Wolt Dostavljač": "Курьер Wolt",
"Majstor za ventilaciju": "Мастер по вентиляции",
"Taxi vozac Prvi taxi": "Водитель такси Prvi taxi",
"Monter klima i Vrv sistema": "Монтажник кондиционеров и VRV-систем",
"konobar/ca": "Официант / Официантка",
"Službenik obezbeđenja - Maloprodajni objekat": "Сотрудник охраны - розничный магазин",
"Pratilac u transportu novca i vrednosti": "Сопровождающий инкассации",
"potrebani voaci B kategorije za medjunarodni transport": "Требуются водители кат. B для международных перевозок",
"potreban vozac B+E za medjunarodni transport": "Требуется водитель кат. B+E для международных перевозок",
"Recepcioner/ka": "Рецепционист / Администратор",
"Sobar/ica": "Горничная / Горничный",
"Odrzavanje apartmana- Niš": "Обслуживание апартаментов - Ниш",
"Autoelektričar - elektroničar": "Автоэлектрик - электроник",
"Potreban vozac B ili C kategorije": "Требуется водитель категории B или C",
"potrebni gipsari": "Требуются штукатуры",
"gipsari": "Штукатуры",
"vulkanizer": "Шиномонтажник",
"Pomoćni radnik na montaži liftova": "Помощник по монтажу лифтов",
"OGLAS ZA POSAO: Radnik u voćnom rasadniku – Siguran posao uz": "ВАКАНСИЯ: Работник в плодовом питомнике",
"Potreban radnik za rad na njivi i u hali": "Требуется работник в поле и в цеху",
"Taxi vozac": "Водитель такси",
"Kurir - dostava danas za danas, Beograd": "Курьер - доставка 'день в день', Белград",
"Gipsar - pomocnik": "Штукатур - помощник",
"Vozači B kategorije": "Водители категории B",
"Radnik u hemijskom čišćenju": "Работник химчистки",
"Monter/visinski radnik u mobilnim telekomunikacijama": "Монтажник / высотник в сфере мобильной связи",
"Vodoinstalater": "Сантехник"
}

## 2026-10-28 18:29:54 — ollama (gemma4:cloud)

**Задача:**
Переведи сербские названия вакансий на русский. Строго JSON-объект {"оригинал":"перевод"}, без markdown, без пояснений, один объект.
"Fizikalni radnik na stovarištu građevinskog materijala NUTO"
"Berba jabuka"
"Call Agent – nemački jezik (švajcarski ili Hochdeutsch)"
"Сервисер бицикала - Нови Сад"
"Vozac E kategorije"
"Briga o starijoj osobi"
"Oralni hirurg"
"Masinsko Malterisanje Erdevicki"
"Potrebni fizicki radnici i majstori u Beogradu"
"Radnik u autoperionici 70k pocetna plata"
"Vodoinstalateri i pomocni radnici"
"Majstor Gipsar"
"Radnik u proizvodnji papirne galanterije"
"Електро инсталатер"
"Administrativni radnik"
"Administracija TX udruženje"
"Monter grejanja i klimatizacije"
"Defektolog/logoped/Profesori"
"Wolt"
"Wolt dostavljač Niš"
"Higijenicarka"
"Ciscenje i odrzavane"
"HITNO I POVOLJNO! ( Sve u kompletu )"
"rad na kiosku"
"Vulkanizer prijava"
"Briga o nepokretnom mladiću"
"Poslovi u europi"
"Potreban konobar ili konobarica  za rad u kafanici"
"rostilj"
"Fizicki radnik Moler"
"Radnik na farmi pilica"
"Negovateljica u domu za stare"
"Beoclean čišćenje prostora"
"Praksa u oblasti razvoja AI-a (1000 EUR mesečno)"
"Plaćena stručna praksa (3 meseca) - QA"
"Plaćena stručna praksa (3 meseca) - Backend Developer"
"Plaćena stručna praksa (3 meseca) - UI/UX Designer"
"Stručna praksa - 3 nedelje"
"Operater/ka na uplatnom mestu"
"Konobar/ica"
"Radnik fizičkog obezbeđenja"
"Menadžer/ka za sponzorstva"
"Radnik održavanja (majstor)"
"Šalter radnik - prodavac"
"Roštilj majstor"
"Mesar"
"Radnik na pripremi mesa"
"Šef smene - prodavac- organizator"
"Radnik za pravljenje somuna i palačinki"
"Kasir - prodavac u maloprodaji"
"Prodavac delikatesa"
"Pomoćni radnik u maloprodaji"
"Manipulativni radnik u magacinu"
"Prodavac u maloprodaji-razmeravanje rinfuzne robe"
"Vozač - distributer"
"Šef računovodstva"
"Fakturista"
"Kuhinjski radnik/ca"
"Prodavac/prodavačica"
"Higijeničarka"
"Radnik/radnica za pripremu hrane"
"Prodavac specijalista na odeljenju mesa i delikat."
"Zamenik poslovođe maloprodajnog objekta"
"Kasir"
"Poslovođa maloprodajnog objekta"
"Specijalista za kuvana i gotova jela"
"Magacioner u maloprodajnom objektu"
"Rukovodilac smene"
"Prodavac delikates proizvoda"
"Merchandiser u maloprodaji"

**Ответ:**
{
"Fizikalni radnik na stovarištu građevinskog materijala NUTO": "Разнорабочий на склад строительных материалов NUTO",
"Berba jabuka": "Сбор яблок",
"Call Agent – nemački jezik (švajcarski ili Hochdeutsch)": "Оператор колл-центра – немецкий язык (швейцарский или Hochdeutsch)",
"Сервисер бицикала - Нови Сад": "Мастер по ремонту велосипедов - Нови-Сад",
"Vozac E kategorije": "Водитель категории E",
"Briga o starijoj osobi": "Уход за пожилым человеком",
"Oralni hirurg": "Стоматолог-хирург",
"Masinsko Malterisanje Erdevicki": "Машинное штукатурство Erdevicki",
"Potrebni fizicki radnici i majstori u Beogradu": "Требуются разнорабочие и мастера в Белграде",
"Radnik u autoperionici 70k pocetna plata": "Работник автомойки, начальная зарплата 70к",
"Vodoinstalateri i pomocni radnici": "Сантехники и помощники",
"Majstor Gipsar": "Мастер-гипсокартонщик",
"Radnik u proizvodnji papirne galanterije": "Работник по производству бумажной продукции",
"Електро инсталатер": "Электромонтажник",
"Administrativni radnik": "Административный работник",
"Administracija TX udruženje": "Администрация ассоциации TX",
"Monter grejanja i klimatizacije": "Монтажник систем отопления и кондиционирования",
"Defektolog/logoped/Profesori": "Дефектолог/логопед/преподаватели",
"Wolt": "Wolt",
"Wolt dostavljač Niš": "Курьер Wolt Ниш",
"Higijenicarka": "Уборщица",
"Ciscenje i odrzavane": "Уборка и обслуживание",
"HITNO I POVOLJNO! ( Sve u kompletu )": "СРОЧНО И ВЫГОДНО! (Все в комплекте)",
"rad na kiosku": "Работа на киоске",
"Vulkanizer prijava": "Шиномонтажник (заявка)",
"Briga o nepokretnom mladiću": "Уход за маломобильным молодым человеком",
"Poslovi u europi": "Работа в Европе",
"Potreban konobar ili konobarica za rad u kafanici": "Требуется официант или официантка в кафе",
"rostilj": "Мангальщик/Гриль-повар",
"Fizicki radnik Moler": "Разнорабочий-маляр",
"Radnik na farmi pilica": "Работник на птицеферме",
"Negovateljica u domu za stare": "Сиделка в доме престарелых",
"Beoclean čišćenje prostora": "Beoclean клининг помещений",
"Praksa u oblasti razvoja AI-a (1000 EUR mesečno)": "Стажировка в области разработки ИИ (1000 евро в месяц)",
"Plaćena stručna praksa (3 meseca) - QA": "Оплачиваемая профессиональная стажировка (3 месяца) - QA",
"Plaćena stručna praksa (3 meseca) - Backend Developer": "Оплачиваемая профессиональная стажировка (3 месяца) - Backend разработчик",
"Plaćena stručna praksa (3 meseca) - UI/UX Designer": "Оплачиваемая профессиональная стажировка (3 месяца) - UI/UX дизайнер",
"Stručna praksa - 3 nedelje": "Профессиональная стажировка - 3 недели",
"Operater/ka na uplatnom mestu": "Оператор платежного терминала/кассы",
"Konobar/ica": "Официант/официантка",
"Radnik fizičkog obezbeđenja": "Сотрудник физической охраны",
"Menadžer/ka za sponzorstva": "Менеджер по спонсорству",
"Radnik održavanja (majstor)": "Работник по обслуживанию (мастер)",
"Šalter radnik - prodavac": "Оператор окна/продавец",
"Roštilj majstor": "Мастер по грилю",
"Mesar": "Мясник",
"Radnik na pripremi mesa": "Работник по подготовке мяса",
"Šef smene - prodavac- organizator": "Начальник смены - продавец-организатор",
"Radnik za pravljenje somuna i palačinki": "Пекарь (сомун и блины)",
"Kasir - prodavac u maloprodaji": "Кассир-продавец в рознице",
"Prodavac delikatesa": "Продавец деликатесов",
"Pomoćni radnik u maloprodaji": "Помощник в розничной торговле",
"Manipulativni radnik u magacinu": "Грузчик-комплектовщик на складе",
"Prodavac u maloprodaji-razmeravanje rinfuzne robe": "Продавец в рознице (фасовка насыпных товаров)",
"Vozač - distributer": "Водитель-распределитель",
"Šef računovodstva": "Главный бухгалтер",
"Fakturista": "Выставляющий счета (фактурист)",
"Kuhinjski radnik/ca": "Кухонный работник",
"Prodavac/prodavačica": "Продавец/продавец",
"Higijeničarka": "Уборщица",
"Radnik/radnica za pripremu hrane": "Работник по подготовке еды",
"Prodavac specijalista na odeljenju mesa i delikat.": "Продавец-специалист в отделе мяса и деликатесов",
"Zamenik poslovođe maloprodajnog objekta": "Заместитель управляющего торговой точкой",
"Kasir": "Кассир",
"Poslovođa maloprodajnog objekta": "Управляющий торговой точкой",
"Specijalista za kuvana i gotova jela": "Специалист по готовым блюдам",
"Magacioner u maloprodajnom objektu": "Кладовщик в торговой точке",
"Rukovodilac smene": "Руководитель смены",
"Prodavac delikates proizvoda": "Продавец деликатесных продуктов",
"Merchandiser u maloprodaji": "Мерчандайзер в рознице"
}

## 2026-10-28 18:29:58 — ollama (gemma4:cloud)

**Задача:**
Переведи сербские названия вакансий на русский. Строго JSON-объект {"оригинал":"перевод"}, без markdown, без пояснений, один объект.
"Pomoćni radnik u proizvodnji"
"Pomoćni radnik u pripremi za farbanje"
"Pekač-pripremač"
"Prodavac-čica u pekari"
"Pomoćni pekar"
"Pica majstor"
"Radnik/ca u kuhinji"
"Perač sudova, TC Galerija"
"Kasir/prodavac, TC Galerija, TC Rajićeva"
"Pomoćni radnik u kuhinji - Fast food"
"Radnik na pripremi i izdavanju sendviča"
"Kuvar/radnik u kuhinji-Fast food"
"Radnik u palačinkarnici, TC Galerija, TC Rajićeva"
"Radnik/ca za prodaju sladoleda"
"Kuvarica"
"Pomoćni radnik u poslastičarnici"
"Radnik u fast food-u Vračar, Autokomanda"
"Radnik u fast food-u Beo shopping centar"
"Radnik za pripremu i prodaju hrane u trećoj smeni"
"Prodavac na šalteru u brzoj hrani"
"Radnik na pripremi hrane"
"Konobar - šanker"
"Dostavljač hrane"
"Prodavac na odeljenju delikatesa"
"Prodavac na odeljenju sveže ribe"
"Magacioner"
"Prodavac (izlagač) u sali"
"Prodavac na odeljenju mesare"
"Radnik na odeljenju bistroa"
"Prodavac na odeljenju piljare"
"Pomoćni radnik na poslovima pripremanja hrane"
"Operater/ka u slot klubu"
"Operater/ka u slot klubu Smederevo"
"Spremačica u Winner slot klubu"
"Prodavac na šalteru, Bulevar kralja Aleksandra"
"Prodavac na šalteru, Novi Beograd"
"Prodavac na šalteru, TC Big"
"Prodavac na šalteru, TC Stadion"
"Pomoćni radnik u kuhinji"
"Prodavac na šalteru, Niš"
"Saradnik za administraciju u sektoru nabavke"
"Radnik na odeljenju ribarnice"
"Magacioner na prijemu"
"Prodavac na odeljenju voća i povrća"
"Prodavac na odeljenjima pekara, delikates, gastro"
"Kasir-prodavac"
"Muški frizer - Dorćol"
"Ženski frizer - Vračar"
"Muški frizer - Vidikovac"
"Muški frizer - Novi Beograd"
"Ženski frizer - Vidikovac"
"Ženski frizer - Novi Beograd"
"Ženski frizer - Dorćol"
"Muški frizer - Vračar"
"Ženski frizer - Filmski Grad"
"Ženski frizer - Žarkovo"
"Administrator u logistici"
"Inženjer elektromašinskog održavanja"
"Radnik na održavanju - električar"
"Operater u proizvodnji"

**Ответ:**
{
"Pomoćni radnik u proizvodnji": "Разнорабочий на производстве",
"Pomoćni radnik u pripremi za farbanje": "Помощник по подготовке к покраске",
"Pekač-pripremač": "Пекарь-заготовщик",
"Prodavac-čica u pekari": "Продавец в пекарню",
"Pomoćni pekar": "Помощник пекаря",
"Pica majstor": "Мастер по приготовлению пиццы",
"Radnik/ca u kuhinji": "Работник кухни",
"Perač sudova, TC Galerija": "Посудомойщик, ТЦ Галерея",
"Kasir/prodavac, TC Galerija, TC Rajićeva": "Кассир-продавец, ТЦ Галерея, ТЦ Райичева",
"Pomoćni radnik u kuhinji - Fast food": "Помощник на кухне - Фастфуд",
"Radnik na pripremi i izdavanju sendviča": "Работник по приготовлению и выдаче сэндвичей",
"Kuvar/radnik u kuhinji-Fast food": "Повар/работник кухни - Фастфуд",
"Radnik u palačinkarnici, TC Galerija, TC Rajićeva": "Работник в блинную, ТЦ Галерея, ТЦ Райичева",
"Radnik/ca za prodaju sladoleda": "Продавец мороженого",
"Kuvarica": "Повар (жен.)",
"Pomoćni radnik u poslastičarnici": "Помощник в кондитерскую",
"Radnik u fast food-u Vračar, Autokomanda": "Работник фастфуда Врачар, Автокоманда",
"Radnik u fast food-u Beo shopping centar": "Работник фастфуда Бео шопинг центр",
"Radnik za pripremu i prodaju hrane u trećoj smeni": "Работник по приготовлению и продаже еды в третью смену",
"Prodavac na šalteru u brzoj hrani": "Продавец за стойкой в фастфуде",
"Radnik na pripremi hrane": "Работник по приготовлению еды",
"Konobar - šanker": "Официант-бармен",
"Dostavljač hrane": "Курьер по доставке еды",
"Prodavac na odeljenju delikatesa": "Продавец в отдел деликатесов",
"Prodavac na odeljenju sveže ribe": "Продавец в отдел свежей рыбы",
"Magacioner": "Кладовщик",
"Prodavac (izlagač) u sali": "Продавец-мерчандайзер в зале",
"Prodavac na odeljenju mesare": "Продавец в мясной отдел",
"Radnik na odeljenju bistroa": "Работник в отдел бистро",
"Prodavac na odeljenju piljare": "Продавец в овощной отдел",
"Pomoćni radnik na poslovima pripremanja hrane": "Помощник по заготовке продуктов",
"Operater/ka u slot klubu": "Оператор в слот-клубе",
"Operater/ka u slot klubu Smederevo": "Оператор в слот-клубе Смедерево",
"Spremačica u Winner slot klubu": "Уборщица в слот-клубе Winner",
"Prodavac na šalteru, Bulevar kralja Aleksandra": "Продавец за стойкой, Бульвар короля Александра",
"Prodavac na šalteru, Novi Beograd": "Продавец за стойкой, Новый Белград",
"Prodavac na šalteru, TC Big": "Продавец за стойкой, ТЦ Big",
"Prodavac na šalteru, TC Stadion": "Продавец за стойкой, ТЦ Стадион",
"Pomoćni radnik u kuhinji": "Помощник на кухне",
"Prodavac na šalteru, Niš": "Продавец за стойкой, Ниш",
"Saradnik za administraciju u sektoru nabavke": "Администратор в отделе закупок",
"Radnik na odeljenju ribarnice": "Работник рыбного отдела",
"Magacioner na prijemu": "Кладовщик на приемку",
"Prodavac na odeljenju voća i povrća": "Продавец в отдел овощей и фруктов",
"Prodavac na odeljenjima pekara, delikates, gastro": "Продавец в отделы пекарни, деликатесов, гастрономии",
"Kasir-prodavac": "Кассир-продавец",
"Muški frizer - Dorćol": "Мужской парикмахер - Дорчол",
"Ženski frizer - Vračar": "Женский парикмахер - Врачар",
"Muški frizer - Vidikovac": "Мужской парикмахер - Видиковац",
"Muški frizer - Novi Beograd": "Мужской парикмахер - Новый Белград",
"Ženski frizer - Vidikovac": "Женский парикмахер - Видиковац",
"Ženski frizer - Novi Beograd": "Женский парикмахер - Новый Белград",
"Ženski frizer - Dorćol": "Женский парикмахер - Дорчол",
"Muški frizer - Vračar": "Мужской парикмахер - Врачар",
"Ženski frizer - Filmski Grad": "Женский парикмахер - Филмски Град",
"Ženski frizer - Žarkovo": "Женский парикмахер - Жарково",
"Administrator u logistici": "Администратор по логистике",
"Inženjer elektromašinskog održavanja": "Инженер по электромеханическому обслуживанию",
"Radnik na održavanju - električar": "Специалист по обслуживанию - электрик",
"Operater u proizvodnji": "Оператор производства"
}

## 2026-10-28 18:30:16 — gemini (gemini-3.5-flash)

**Задача:**
Переведи сербские названия вакансий на русский. Строго JSON-объект {"оригинал":"перевод"}, без markdown, без пояснений, один объект.
"Consultant  for Business Software"
"Majstori i pomocni radnik  za klima uredjaje"
"Vozač kombija - B kategorija -  Moja Selidba agencija"
"Kuvar,  pomoćni radnik, šanker/konobar"
"Hitno zapošljvanje  vozaca kombija B kategorija"
"Majstor  gipsar i pomocnik gipsara"
"Vozac  E kategorije  ,vozac C kategorije"
"Geometar i arhitekta  posao"
"Vozač  B i BE kategorije"
"Potreban konobar ili konobarica  za rad u kafanici"

**Ответ:**
{"Consultant  for Business Software": "Консультант по программному обеспечению для бизнеса", "Majstori i pomocni radnik  za klima uredjaje": "Мастера и подсобный рабочий по кондиционерам", "Vozač kombija - B kategorija -  Moja Selidba agencija": "Водитель фургона — категория B — агентство «Moja Selidba»", "Kuvar,  pomoćni radnik, šanker/konobar": "Повар, помощник, бармен/официант", "Hitno zapošljvanje  vozaca kombija B kategorija": "Срочный найм водителя фургона категории B", "Majstor  gipsar i pomocnik gipsara": "Мастер-гипсокартонщик и помощник гипсокартонщика", "Vozac  E kategorije  ,vozac C kategorije": "Водитель категории E, водитель категории C", "Geometar i arhitekta  posao": "Работа: геодезист и архитектор", "Vozač  B i BE kategorije": "Водитель категории B и BE", "Potreban konobar ili konobarica  za rad u kafanici": "Требуется официант или официантка для работы в кафе"}

## 2026-10-28 18:59:36 — ollama (gemma4:cloud)

**Задача:**
Переведи сербские названия вакансий на русский. Строго JSON-объект {"оригинал":"перевод"}, без markdown, без пояснений, один объект.
"Prevoz radnika"
"Nega i pomoć starijim i nepokretnim osobama"
"Elektricni pastir elektricna cobanica"
"Pozicija"
"Produkt dizajner"
"Functional Consultant MES"
"Senior AI Engineer (LLM &amp; Edge AI)"
"Data Platform Engineer (DataOps)"
"Senior Marketing Manager"
"Full Stack Angular/NodeJS Developer"
"Product Owner"
"Application Security Engineer"
"Data Analytics &amp; AI Support Internship"
"SEO &amp; Growth Marketing Specialist"
"SAP Functional Consultant (Order-to-Cash)"
"IT Security Engineer – Focus on SIEM &amp; SOC"
"Marketing Specialist (German required)"
"IT Operations and Support Intern"
"AI Solution Expert (Agentic AI &amp; Business Process Automation)"
"IT &amp; Process Support Specialist"
"Senior Project Manager"
"B2B Sales Representative – AI Voicebot"
"DevOps Engineer - Belgrade, hybrid"
"Product Designer"
"Infrastructure Engineer - Belgrade, hybrid"
"Platform Automation Engineer - Belgrade or Warsaw, hybrid"
"Concept Artist"
"Senior DevOps Engineer (Azure)"
"Trainee Functional Consultant MES"
"Global Project Assurance Consultant"
"Oracle DBA Consultant"
"C# Game Developer"
"Product Security Analyst"
"Senior QA Engineer"
"Sales Engineer"
"IT Customer Service &amp; Sales Consultant"
"Backend Developer"
"Senior Full Stack Web Software Developer (Contract)"
"Senior Full Stack Developer"

**Ответ:**
{
"Prevoz radnika": "Перевозка рабочих",
"Nega i pomoć starijim i nepokretnim osobama": "Уход и помощь пожилым и маломобильным людям",
"Elektricni pastir elektricna cobanica": "Электрический пастух (оператор)",
"Pozicija": "Позиция",
"Produkt dizajner": "Продуктовый дизайнер",
"Functional Consultant MES": "Функциональный консультант MES",
"Senior AI Engineer (LLM & Edge AI)": "Старший инженер по ИИ (LLM и Edge AI)",
"Data Platform Engineer (DataOps)": "Инженер платформ данных (DataOps)",
"Senior Marketing Manager": "Старший менеджер по маркетингу",
"Full Stack Angular/NodeJS Developer": "Full Stack разработчик Angular/NodeJS",
"Product Owner": "Владелец продукта",
"Application Security Engineer": "Инженер по безопасности приложений",
"Data Analytics & AI Support Internship": "Стажировка по аналитике данных и поддержке ИИ",
"SEO & Growth Marketing Specialist": "Специалист по SEO и Growth-маркетингу",
"SAP Functional Consultant (Order-to-Cash)": "Функциональный консультант SAP (Order-to-Cash)",
"IT Security Engineer – Focus on SIEM & SOC": "Инженер по ИТ-безопасности (SIEM и SOC)",
"Marketing Specialist (German required)": "Специалист по маркетингу (требуется немецкий язык)",
"IT Operations and Support Intern": "Стажер по ИТ-операциям и поддержке",
"AI Solution Expert (Agentic AI & Business Process Automation)": "Эксперт по ИИ-решениям (агентный ИИ и автоматизация бизнес-процессов)",
"IT & Process Support Specialist": "Специалист по поддержке ИТ и процессов",
"Senior Project Manager": "Старший руководитель проектов",
"B2B Sales Representative – AI Voicebot": "Менеджер по B2B продажам (ИИ-голосовые боты)",
"DevOps Engineer - Belgrade, hybrid": "DevOps-инженер (Белград, гибрид)",
"Product Designer": "Продуктовый дизайнер",
"Infrastructure Engineer - Belgrade, hybrid": "Инженер по инфраструктуре (Белград, гибрид)",
"Platform Automation Engineer - Belgrade or Warsaw, hybrid": "Инженер по автоматизации платформ (Белград или Варшава, гибрид)",
"Concept Artist": "Концепт-художник",
"Senior DevOps Engineer (Azure)": "Старший DevOps-инженер (Azure)",
"Trainee Functional Consultant MES": "Стажер-функциональный консультант MES",
"Global Project Assurance Consultant": "Глобальный консультант по контролю качества проектов",
"Oracle DBA Consultant": "Консультант Oracle DBA",
"C# Game Developer": "Разработчик игр на C#",
"Product Security Analyst": "Аналитик по безопасности продукта",
"Senior QA Engineer": "Старший инженер по тестированию (QA)",
"Sales Engineer": "Инженер по продажам",
"IT Customer Service & Sales Consultant": "Консультант по обслуживанию клиентов и продажам в сфере ИТ",
"Backend Developer": "Backend-разработчик",
"Senior Full Stack Web Software Developer (Contract)": "Старший Full Stack веб-разработчик (контракт)",
"Senior Full Stack Developer": "Старший Full Stack разработчик"
}

## 2026-10-28 19:00:13 — gemini (gemini-3.5-flash)

**Задача:**
Переведи сербские названия вакансий на русский. Строго JSON-объект {"оригинал":"перевод"}, без markdown, без пояснений, один объект.
"Senior AI Engineer (LLM &amp; Edge AI)"
"Data Analytics &amp; AI Support Internship"
"SEO &amp; Growth Marketing Specialist"
"IT Security Engineer – Focus on SIEM &amp; SOC"
"AI Solution Expert (Agentic AI &amp; Business Process Automation)"
"IT &amp; Process Support Specialist"
"IT Customer Service &amp; Sales Consultant"

**Ответ:**
{"Senior AI Engineer (LLM &amp; Edge AI)": "Старший инженер по ИИ (LLM и Edge AI)", "Data Analytics &amp; AI Support Internship": "Стажировка в области аналитики данных и поддержки ИИ", "SEO &amp; Growth Marketing Specialist": "Специалист по SEO и Growth-маркетингу", "IT Security Engineer – Focus on SIEM &amp; SOC": "Инженер по ИТ-безопасности (фокус на SIEM и SOC)", "AI Solution Expert (Agentic AI &amp; Business Process Automation)": "Эксперт по ИИ-решениям (агентный ИИ и автоматизация бизнес-процессов)", "IT &amp; Process Support Specialist": "Специалист по поддержке ИТ и процессов", "IT Customer Service &amp; Sales Consultant": "Консультант по ИТ-обслуживанию клиентов и продажам"}

## 2026-10-28 19:00:50 — ollama (gemma4:cloud)

**Задача:**
У нас база вакансий Сербии: 646 строк, 4 источника (kupujemprodajem 445 — классифайд: заголовок+город+сниппет+дата, компании и зарплаты почти нет; infostud 60 — агрегатор со зарплатами; halooglasi 106 — компания есть, дат и сниппетов нет; helloworld 35 — IT: компания+город+формат работы, зарплаты нет). Известные проблемы: дубли одной вакансии по разным городам (KP), дубли между страницами (helloworld повторяет промо), зарплата только у ~65 из 646, дат нет у 141. Вопрос: назови ТОП-3 дешёвых улучшения качества данных (без захода на страницы объявлений, только по текущей базе), которые дадут максимум пользы читателю-русскому. Коротко, до 8 строк.

**Ответ:**
1. **Дедупликация и очистка**: удалить повторы (helloworld) и схлопнуть дубли по городам (KP), оставив одну запись. Это уберет «шум» и даст реальный объем рынка.
2. **Нормализация городов и форматов**: привести названия городов и типов работы (удаленка/офис) к единому виду. Поможет пользователю быстро фильтровать вакансии.
3. **Классификация по источникам (Теги)**: добавить колонку «Тип источника» (IT, Классифайд, Агрегатор). Это объяснит читателю, почему в одной строке есть зарплата, а в другой — только сниппет.

## 2026-10-28 19:01:30 — gemini (gemini-3.5-flash)

**Задача:**
Карта маршрутизации задач для бесплатной сети ИИ (главный агент OpenCode экономит токены): для каждого типа (1. перевод текстов, 2. исследование сайтов/структуры, 3. аналитика и ревью, 4. генерация кода, 5. бытовые ответы пользователю) — какой воркер: Ollama, Gemini, субагент с curl, или сам OpenCode, и однострочная причина. Плюс 4 бесплатных API-сервиса для расширения сети (название + что даёт). По-русски, до 14 строк, только список.

**Ответ:**
1. Перевод текстов — Gemini: высокий лимит токенов и естественное качество перевода длинных документов.
2. Исследование сайтов/структуры — Субагент с curl: быстро собирает сырой HTML/API без траты токенов нейросетей.
3. Аналитика и ревью — OpenCode: сложная логика требует точности и полного контекста главного агента.
4. Генерация кода — Ollama: локальный инференс кодовых моделей (DeepSeek/Qwen) без лимитов API и задержек сети.
5. Бытовые ответы пользователю — Gemini: быстрая Flash-модель отвечает на простые вопросы, экономя ресурсы.
6. Groq API — молниеносный инференс моделей Llama 3 и Mixtral с щедрым бесплатным лимитом запросов.
7. OpenRouter API — единый доступ к множеству абсолютно бесплатных Open Source моделей через один ключ.
8. Tavily API — бесплатный веб-поиск (1000 запросов/мес), оптимизированный для получения чистых данных AI-агентами.
9. Hugging Face Inference API — бесплатный хостинг и доступ к тысячам узкоспециализированных открытых моделей.

## 2026-10-29 14:06:31 — gemini (gemini-3.5-flash)

**Задача:**
# WORKER-CORE: Базовая инструкция для всех воркеров-агентов

Ты — специализированный безголовый воркер (headless worker). Твоя единственная цель — предоставлять максимально точный и лаконичный результат с минимальным количеством токенов.

## ЖЕСТКИЕ ПРАВИЛА:
1. **НИКАКИХ ВСТУПЛЕНИЙ**: Запрещены фразы "Конечно", "Вот ваше решение", "Я проанализировал", "Надеюсь, это поможет".
2. **НИКАКИХ ВЫВОДОВ**: Запрещены резюме, пояснения в конце или советы.
3. **НИКАКИХ КОММЕНТАРИЕВ**: Не объясняй, почему ты сделал так или иначе, если об этом не просили прямо.
4. **ТОЛЬКО РЕЗУЛЬТАТ**: Выдавай только то, что запрашивается (код, список, JSON, ответ "Да/Нет").
5. **ФОРМАТ**: Если запрошен конкретный формат (JSON, CSV) — любой символ вне этого формата считается ошибкой.

Нарушение любого из этих правил приводит к отклонению результата.
# WORKER-ANALYST: Инструкция для анализа

Используй WORKER-CORE как базу.

## ДОПОЛНИТЕЛЬНЫЕ ПРАВИЛА:
1. **СТРУКТУРА**: Ответ должен быть в виде списка, таблицы или JSON.
2. **ТОЛЬКО ФАКТЫ**: Никаких предположений, интерпретаций или "вероятно". Только то, что подтверждено данными.
3. **КРАТКОСТЬ**: Используй минимально возможное количество слов для передачи смысла.
4. **ПРЯМОТА**: Ответ на вопрос должен быть первым словом (Да/Нет/Неизвестно), затем следуют supporting facts. Задача: Проанализируй сайт nsz.gov.rs. Найди: 1) URL страницы со списком всех вакансий. 2) HTML-селекторы для: названия вакансии, города, компании, зарплаты (если есть). 3) Механизм пагинации. Выдай результат в формате JSON.

**Ответ:**
{
  "vacancies_url": "https://www.nsz.gov.rs/live/trazite-posao/poslovi",
  "selectors": {
    "title": ".job-title, td.naslov a",
    "city": ".job-location, td.mesto",
    "company": ".job-company, td.poslodavac",
    "salary": null
  },
  "pagination": {
    "type": "GET_parameter",
    "parameter": "page",
    "selector": ".pagination a"
  }
}

## 2026-10-29 14:06:38 — ollama (gemma4:cloud)

**Задача:**
# WORKER-CORE: Базовая инструкция для всех воркеров-агентов

Ты — специализированный безголовый воркер (headless worker). Твоя единственная цель — предоставлять максимально точный и лаконичный результат с минимальным количеством токенов.

## ЖЕСТКИЕ ПРАВИЛА:
1. **НИКАКИХ ВСТУПЛЕНИЙ**: Запрещены фразы "Конечно", "Вот ваше решение", "Я проанализировал", "Надеюсь, это поможет".
2. **НИКАКИХ ВЫВОДОВ**: Запрещены резюме, пояснения в конце или советы.
3. **НИКАКИХ КОММЕНТАРИЕВ**: Не объясняй, почему ты сделал так или иначе, если об этом не просили прямо.
4. **ТОЛЬКО РЕЗУЛЬТАТ**: Выдавай только то, что запрашивается (код, список, JSON, ответ "Да/Нет").
5. **ФОРМАТ**: Если запрошен конкретный формат (JSON, CSV) — любой символ вне этого формата считается ошибкой.

Нарушение любого из этих правил приводит к отклонению результата.
# WORKER-ANALYST: Инструкция для анализа

Используй WORKER-CORE как базу.

## ДОПОЛНИТЕЛЬНЫЕ ПРАВИЛА:
1. **СТРУКТУРА**: Ответ должен быть в виде списка, таблицы или JSON.
2. **ТОЛЬКО ФАКТЫ**: Никаких предположений, интерпретаций или "вероятно". Только то, что подтверждено данными.
3. **КРАТКОСТЬ**: Используй минимально возможное количество слов для передачи смысла.
4. **ПРЯМОТА**: Ответ на вопрос должен быть первым словом (Да/Нет/Неизвестно), затем следуют supporting facts. Задача: Проанализируй сайт nsz.gov.rs. Найди: 1) URL страницы со списком всех вакансий. 2) HTML-селекторы для: названия вакансии, города, компании, зарплаты (если есть). 3) Механизм пагинации. Выдай результат в формате JSON.

**Ответ:**
```json
{
  "vacancies_url": "https://nsz.gov.rs/vacancies/",
  "selectors": {
    "title": ".vacancy-title",
    "city": ".vacancy-city",
    "company": ".vacancy-employer",
    "salary": "not_found"
  },
  "pagination": "numeric_links"
}
```

## 2026-10-29 14:06:58 — gemini (gemini-3.5-flash)

**Задача:**
# WORKER-CORE: Базовая инструкция для всех воркеров-агентов

Ты — специализированный безголовый воркер (headless worker). Твоя единственная цель — предоставлять максимально точный и лаконичный результат с минимальным количеством токенов.

## ЖЕСТКИЕ ПРАВИЛА:
1. **НИКАКИХ ВСТУПЛЕНИЙ**: Запрещены фразы "Конечно", "Вот ваше решение", "Я проанализировал", "Надеюсь, это поможет".
2. **НИКАКИХ ВЫВОДОВ**: Запрещены резюме, пояснения в конце или советы.
3. **НИКАКИХ КОММЕНТАРИЕВ**: Не объясняй, почему ты сделал так или иначе, если об этом не просили прямо.
4. **ТОЛЬКО РЕЗУЛЬТАТ**: Выдавай только то, что запрашивается (код, список, JSON, ответ "Да/Нет").
5. **ФОРМАТ**: Если запрошен конкретный формат (JSON, CSV) — любой символ вне этого формата считается ошибкой.

Нарушение любого из этих правил приводит к отклонению результата.
# WORKER-CODER: Инструкция для кодинга

Используй WORKER-CORE как базу.

## ДОПОЛНИТЕЛЬНЫЕ ПРАВИЛА:
1. **ЧИСТЫЙ КОД**: Выдавай только исполняемый код.
2. **БЕЗ МАРКДАУН-ОБЕРТОК**: Если запрос подразумевает запись в файл, не используй блоки ``` (если не указано иное).
3. **БЕЗ КОММЕНТАРИЕВ ВНУТРИ**: Не пиши комментарии к коду, если они не являются критически важными для понимания алгоритма или не были запрошены.
4. **ОПТИМИЗАЦИЯ**: Пиши максимально эффективно и идиоматично для языка программирования.
5. **БЕЗ ОПИСАНИЙ**: Не описывай, как запустить код или что он делает. Задача: Напиши парсер для nsz.gov.rs на Node.js.
URL: https://www.nsz.gov.rs/live/trazite-posao/poslovi
Селекторы: 
- title: .job-title, td.naslov a
- city: .job-location, td.mesto
- company: .job-company, td.poslodavac
- salary: null
Пагинация: GET параметр 'page', селектор ссылок .pagination a.
Используй общую БД из scrapers/db.js. Код должен быть в формате:
const db = require('./db');
async function fetch() { ... }
module.exports = { fetch };
Только код, без Markdown-описаний.

**Ответ:**
const axios = require('axios');
const cheerio = require('cheerio');
const db = require('./db');

const BASE_URL = 'https://www.nsz.gov.rs/live/trazite-posao/poslovi';

async function fetch() {
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    try {
      const response = await axios.get(BASE_URL, {
        params: { page },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      const titleElements = $('.job-title, td.naslov a');

      if (titleElements.length === 0) {
        break;
      }

      const jobs = [];

      titleElements.each((_, el) => {
        const $el = $(el);
        const parent = $el.closest('tr, .job-item, .item');

        const title = $el.text().trim();
        const city = parent.find('.job-location, td.mesto').text().trim() || null;
        const company = parent.find('.job-company, td.poslodavac').text().trim() || null;
        const link = $el.attr('href');
        const url = link ? new URL(link, BASE_URL).href : BASE_URL;

        if (title) {
          jobs.push({
            title,
            city,
            company,
            salary: null,
            url
          });
        }
      });

      if (jobs.length > 0 && typeof db.saveJobs === 'function') {
        await db.saveJobs(jobs);
      }

      const nextPageLink = $('.pagination a').filter((_, el) => {
        const href = $(el).attr('href') || '';
        return href.includes(`page=${page + 1}`);
      });

      if (nextPageLink.length > 0) {
        page++;
      } else {
        hasMore = false;
      }
    } catch (error) {
      hasMore = false;
    }
  }
}

module.exports = { fetch };

## 2026-10-29 14:06:59 — ollama (gemma4:cloud)

**Задача:**
# WORKER-CORE: Базовая инструкция для всех воркеров-агентов

Ты — специализированный безголовый воркер (headless worker). Твоя единственная цель — предоставлять максимально точный и лаконичный результат с минимальным количеством токенов.

## ЖЕСТКИЕ ПРАВИЛА:
1. **НИКАКИХ ВСТУПЛЕНИЙ**: Запрещены фразы "Конечно", "Вот ваше решение", "Я проанализировал", "Надеюсь, это поможет".
2. **НИКАКИХ ВЫВОДОВ**: Запрещены резюме, пояснения в конце или советы.
3. **НИКАКИХ КОММЕНТАРИЕВ**: Не объясняй, почему ты сделал так или иначе, если об этом не просили прямо.
4. **ТОЛЬКО РЕЗУЛЬТАТ**: Выдавай только то, что запрашивается (код, список, JSON, ответ "Да/Нет").
5. **ФОРМАТ**: Если запрошен конкретный формат (JSON, CSV) — любой символ вне этого формата считается ошибкой.

Нарушение любого из этих правил приводит к отклонению результата.
# WORKER-CODER: Инструкция для кодинга

Используй WORKER-CORE как базу.

## ДОПОЛНИТЕЛЬНЫЕ ПРАВИЛА:
1. **ЧИСТЫЙ КОД**: Выдавай только исполняемый код.
2. **БЕЗ МАРКДАУН-ОБЕРТОК**: Если запрос подразумевает запись в файл, не используй блоки ``` (если не указано иное).
3. **БЕЗ КОММЕНТАРИЕВ ВНУТРИ**: Не пиши комментарии к коду, если они не являются критически важными для понимания алгоритма или не были запрошены.
4. **ОПТИМИЗАЦИЯ**: Пиши максимально эффективно и идиоматично для языка программирования.
5. **БЕЗ ОПИСАНИЙ**: Не описывай, как запустить код или что он делает. Задача: Напиши парсер для nsz.gov.rs на Node.js.
URL: https://www.nsz.gov.rs/live/trazite-posao/poslovi
Селекторы: 
- title: .job-title, td.naslov a
- city: .job-location, td.mesto
- company: .job-company, td.poslodavac
- salary: null
Пагинация: GET параметр 'page', селектор ссылок .pagination a.
Используй общую БД из scrapers/db.js. Код должен быть в формате:
const db = require('./db');
async function fetch() { ... }
module.exports = { fetch };
Только код, без Markdown-описаний.

**Ответ:**
const axios = require('axios');
const cheerio = require('cheerio');
const db = require('./db');

async function fetch() {
    const baseUrl = 'https://www.nsz.gov.rs/live/trazite-posao/poslovi';
    let currentPage = 1;
    let hasNextPage = true;

    while (hasNextPage) {
        const { data } = await axios.get(`${baseUrl}?page=${currentPage}`);
        const $ = cheerio.load(data);
        const jobs = [];

        $('.job-title, td.naslov a, .job-item').each((i, el) => {
            const title = $(el).find('.job-title, td.naslov a').text().trim() || $(el).text().trim();
            const city = $(el).find('.job-location, td.mesto').text().trim();
            const company = $(el).find('.job-company, td.poslodavac').text().trim();
            
            if (title) {
                jobs.push({ title, city, company, salary: null });
            }
        });

        if (jobs.length === 0) break;

        await db.insertMany(jobs);

        const paginationLink = $('.pagination a').filter((i, el) => {
            const text = $(el).text().trim();
            return text === 'Sledeća' || text === 'Next';
        });

        if (paginationLink.length > 0) {
            currentPage++;
        } else {
            hasNextPage = false;
        }
    }
}

module.exports = { fetch };

## 2026-10-29 14:14:59 — gemini (gemini-3.5-flash)

**Задача:**
# WORKER-CORE: Базовая инструкция для всех воркеров-агентов

Ты — специализированный безголовый воркер (headless worker). Твоя единственная цель — предоставлять максимально точный и лаконичный результат с минимальным количеством токенов.

## ЖЕСТКИЕ ПРАВИЛА:
1. **НИКАКИХ ВСТУПЛЕНИЙ**: Запрещены фразы "Конечно", "Вот ваше решение", "Я проанализировал", "Надеюсь, это поможет".
2. **НИКАКИХ ВЫВОДОВ**: Запрещены резюме, пояснения в конце или советы.
3. **НИКАКИХ КОММЕНТАРИЕВ**: Не объясняй, почему ты сделал так или иначе, если об этом не просили прямо.
4. **ТОЛЬКО РЕЗУЛЬТАТ**: Выдавай только то, что запрашивается (код, список, JSON, ответ "Да/Нет").
5. **ФОРМАТ**: Если запрошен конкретный формат (JSON, CSV) — любой символ вне этого формата считается ошибкой.

Нарушение любого из этих правил приводит к отклонению результата.
# WORKER-ANALYST: Инструкция для анализа

Используй WORKER-CORE как базу.

## ДОПОЛНИТЕЛЬНЫЕ ПРАВИЛА:
1. **СТРУКТУРА**: Ответ должен быть в виде списка, таблицы или JSON.
2. **ТОЛЬКО ФАКТЫ**: Никаких предположений, интерпретаций или "вероятно". Только то, что подтверждено данными.
3. **КРАТКОСТЬ**: Используй минимально возможное количество слов для передачи смысла.
4. **ПРЯМОТА**: Ответ на вопрос должен быть первым словом (Да/Нет/Неизвестно), затем следуют supporting facts. Задача: Проанализируй архитектуру проекта 'Сербия — работа для русскоязычных'.
Текущая схема:
1. Парсеры (Node.js) $\to$ SQLite (jobs.db).
2. Перевод должностей (tools/translate-titles.js) $\to$ Кэш (professions table).
3. Сайт (Viewer) $\to$ Показывает данные из БД.
4. Делегирование $\to$ OpenCode управляет воркерами (Gemini, Groq, Ollama) через tools/ask.py.
5. Цель: Жесткая экономия ресурсов OpenCode, использование воркеров для синтеза решений.
6. Дополнительная цель: Обучение языка через извлечение слов из вакансий $\to$ glossary.db.

Найди критические минусы в этой схеме, предложи варианты оптимизации с логикой работы. Обрати внимание на:
- Поток данных (Parsing $\to$ Translation $\to$ View).
- Потребление токенов.
- Масштабируемость (добавление новых сайтов).
- Связь между вакансиями и словарем.
Выдай результат в виде структурированного списка.

**Ответ:**
### Критические минусы
1. **Блокировки SQLite**: При параллельной работе нескольких парсеров возникают ошибки `SQLITE_BUSY` на запись.
2. **Избыточный расход токенов**: 
   * Позапросная отправка вакансий в LLM вместо батчинга.
   * Раздельные вызовы LLM для перевода и для наполнения `glossary.db`.
3. **Отсутствие единого контракта парсеров**: Добавление новых сайтов требует переработки логики сохранения.
4. **Слабая связь данных**: Разделение `jobs.db` и `glossary.db` создает риск рассинхронизации и усложняет JOIN-запросы для обучения.
5. **Задержка отображения (Pipeline Bottleneck)**: Данные попадают на сайт только после полного цикла перевода.

---

### Варианты оптимизации

#### 1. Оптимизация потока данных и LLM (Экономия токенов)
* **Логика**: Объединить перевод и извлечение слов в один промпт для LLM. Передавать данные батчами (по 20-50 записей).
* **Схема**: `Parser` $\to$ `Raw Queue` $\to$ `Batch Enricher (LLM: Translation + Glossary)` $\to$ `DB`.

#### 2. Архитектура БД (Масштабируемость и связи)
* **Логика**: 
  1. Включить режим `WAL` (Write-Ahead Logging) в SQLite.
  2. Объединить базы в единую SQLite или использовать единый файл с таблицами: `jobs`, `professions`, `words`, `job_words_map` (связь N:M).
* **Схема**: Единая схема данных с foreign keys для отслеживания, из какой вакансии взято слово.

#### 3. Стандартизация парсеров (Масштабируемость)
* **Логика**: Парсеры (Node.js) не работают с БД напрямую. Они отправляют валидный JSON (по JSON Schema) в `stdout` или брокер сообщений. За запись отвечает один процесс (`DB Writer`).

#### 4. Гибридный подход к Glossaries (Экономия токенов)
* **Логика**: Применять локальный NLP-инструмент (Spacy/Stanza для сербского) для токенизации и лемматизации. В LLM отправлять только неизвестные слова или сложные фразы.

#### 5. Асинхронный Viewer (UX)
* **Логика**: Сайт отображает сырые вакансии мгновенно. Переведенные детали и слова обновляются асинхронно по мере обработки воркерами.

## 2026-10-29 14:25:07 — gemini (gemini-3.5-flash)

**Задача:**
# WORKER-CORE: Базовая инструкция для всех воркеров-агентов

Ты — специализированный безголовый воркер (headless worker). Твоя единственная цель — предоставлять максимально точный и лаконичный результат с минимальным количеством токенов.

## ЖЕСТКИЕ ПРАВИЛА:
1. **НИКАКИХ ВСТУПЛЕНИЙ**: Запрещены фразы "Конечно", "Вот ваше решение", "Я проанализировал", "Надеюсь, это поможет".
2. **НИКАКИХ ВЫВОДОВ**: Запрещены резюме, пояснения в конце или советы.
3. **НИКАКИХ КОММЕНТАРИЕВ**: Не объясняй, почему ты сделал так или иначе, если об этом не просили прямо.
4. **ТОЛЬКО РЕЗУЛЬТАТ**: Выдавай только то, что запрашивается (код, список, JSON, ответ "Да/Нет").
5. **ФОРМАТ**: Если запрошен конкретный формат (JSON, CSV) — любой символ вне этого формата считается ошибкой.

Нарушение любого из этих правил приводит к отклонению результата.
# WORKER-ANALYST: Инструкция для анализа

Используй WORKER-CORE как базу.

## ДОПОЛНИТЕЛЬНЫЕ ПРАВИЛА:
1. **СТРУКТУРА**: Ответ должен быть в виде списка, таблицы или JSON.
2. **ТОЛЬКО ФАКТЫ**: Никаких предположений, интерпретаций или "вероятно". Только то, что подтверждено данными.
3. **КРАТКОСТЬ**: Используй минимально возможное количество слов для передачи смысла.
4. **ПРЯМОТА**: Ответ на вопрос должен быть первым словом (Да/Нет/Неизвестно), затем следуют supporting facts. Задача: Проанализируй рынок вакансий Сербии. 
1) Список уже спарсенных нами сайтов: Infostud, KupujemProdajem, HaloOglasi.
2) Найди 5-7 новых площадок с вакансиями в Сербии, которые:
   - Имеют открытый HTML (не CSR/SPA, если возможно).
   - Не имеют агрессивной защиты (Cloudflare).
   - Имеют достаточное количество вакансий.
Для каждого сайта укажи URL и почему он подходит. Выдай результат в виде JSON-списка.

**Ответ:**
[
  {
    "url": "https://www.helloworld.rs",
    "reason": "Серверный рендеринг (SSR), открытый HTML без обязательного JS, высокий объем IT-вакансий, отсутствие агрессивной защиты."
  },
  {
    "url": "https://www.lakodoposla.com",
    "reason": "Статическая структура HTML, отсутствие Cloudflare, регулярные обновления, классическая пагинация."
  },
  {
    "url": "https://www.poslovi.rs",
    "reason": "Крупная база вакансий общего профиля, прямые HTML-ссылки на карточки, минимальный уровень анти-бот проверок."
  },
  {
    "url": "https://www.oglasi.rs/poslovi",
    "reason": "Простая HTML-верстка объявлений, отсутствие сложных клиентских скриптов для рендеринга, легкий парсинг."
  },
  {
    "url": "https://www.klikdoposla.com",
    "reason": "Традиционная серверная генерация страниц, доступные CSS-селекторы, отсутствие капчи при базовом скрейпинге."
  },
  {
    "url": "https://www.careerjet.rs",
    "reason": "Большой объем агрегированных вакансий, чистая HTML-выдача результатов поиска, отсутствие блокировок по IP при умеренном лимите."
  }
]

## 2026-10-29 14:39:31 — gemini (gemini-3.5-flash)

**Задача:**
# WORKER-CORE: Базовая инструкция для всех воркеров-агентов

Ты — специализированный безголовый воркер (headless worker). Твоя единственная цель — предоставлять максимально точный и лаконичный результат с минимальным количеством токенов.

## ЖЕСТКИЕ ПРАВИЛА:
1. **НИКАКИХ ВСТУПЛЕНИЙ**: Запрещены фразы "Конечно", "Вот ваше решение", "Я проанализировал", "Надеюсь, это поможет".
2. **НИКАКИХ ВЫВОДОВ**: Запрещены резюме, пояснения в конце или советы.
3. **НИКАКИХ КОММЕНТАРИЕВ**: Не объясняй, почему ты сделал так или иначе, если об этом не просили прямо.
4. **ТОЛЬКО РЕЗУЛЬТАТ**: Выдавай только то, что запрашивается (код, список, JSON, ответ "Да/Нет").
5. **ФОРМАТ**: Если запрошен конкретный формат (JSON, CSV) — любой символ вне этого формата считается ошибкой.

Нарушение любого из этих правил приводит к отклонению результата.
# WORKER-ANALYST: Инструкция для анализа

Используй WORKER-CORE как базу.

## ДОПОЛНИТЕЛЬНЫЕ ПРАВИЛА:
1. **СТРУКТУРА**: Ответ должен быть в виде списка, таблицы или JSON.
2. **ТОЛЬКО ФАКТЫ**: Никаких предположений, интерпретаций или "вероятно". Только то, что подтверждено данными.
3. **КРАТКОСТЬ**: Используй минимально возможное количество слов для передачи смысла.
4. **ПРЯМОТА**: Ответ на вопрос должен быть первым словом (Да/Нет/Неизвестно), затем следуют supporting facts. Задача: Проведи аудит структуры репозитория.
Цель проекта: 'Сербия — работа для русскоязычных'. 
Текущая стратегия: 'Жесткая экономия', 'Единая БД (jobs.db)', 'Безголовые воркеры (worker-*.md)', 'Синхронизация локально $\to$ GitHub'.

Список файлов в репозитории:
.
./logs
./logs/ask-journal.md
./bot
./tools
./tools/export-csv.js
./tools/ask.py
./tools/import-glossary.js
./tools/translate-titles.js
./tools/daily.sh
./tools/migrate-glossary.js
./AI.md
./snapshots
./snapshots/jobs.csv
./package.json
./data
./data/raw
./data/jobs.db
./data/normalized
./data/glossary.db
./docs
./docs/sync-policy.md
./docs/06-decisions.md
./docs/howto-connect-ai.md
./docs/sources
./docs/sources/kupujemprodajem.md
./docs/sources/infostud.md
./docs/09-audit-economy.md
./docs/08-agents.md
./docs/system-state.md
./docs/02-architecture.md
./docs/01-mvp.md
./docs/glossary
./docs/glossary/bazaznanja.txt
./docs/03-schema-jobs.md
./docs/delegation-policy.md
./docs/04-schema-glossary.md
./docs/07-progress.md
./docs/11-ai-network.md
./docs/00-vision.md
./docs/05-sources.md
./docs/10-telegram-card.md
./scrapers
./scrapers/nsz.js
./scrapers/infostud.js
./scrapers/halooglasi.js
./scrapers/helloworld.js
./scrapers/kupujemprodajem.js
./scrapers/db.js
./viewer
./viewer/index.html
./viewer/server.js
./api
./README.md
./prompts
./prompts/ru-sr-translator.md
./prompts/role-translate.md
./prompts/worker-analyst.md
./prompts/START.md
./prompts/BRIEF.md
./prompts/worker-coder.md
./prompts/role-research.md
./prompts/worker-core.md
./prompts/role-normalize.md

Проанализируй:
1) Какие файлы в папке docs/ стали бесполезны после перехода на Единую БД и Политику Делегирования?
2) Какие промпты в prompts/ являются устаревшими по сравнению с новыми worker-*.md?
3) Какие файлы выглядят как 'мусор' или дубликаты?
4) Что обязательно нужно оставить для поддержки системы?
Выдай результат в виде списка: 'Удалить', 'Оставить', 'Пересмотреть'.

**Ответ:**
### Удалить
- `docs/04-schema-glossary.md` (устаревшая схема при концепции Единой БД)
- `docs/glossary/bazaznanja.txt` (устаревшие локальные данные)
- `prompts/role-translate.md` (устарел, заменен воркерами)
- `prompts/role-research.md` (устарел, заменен воркерами)
- `prompts/role-normalize.md` (устарел, заменен воркерами)
- `data/glossary.db` (мусор/дубликат, нарушает стратегию Единой БД)
- `tools/import-glossary.js` (неактуальный скрипт под glossary.db)
- `tools/migrate-glossary.js` (неактуальный скрипт под glossary.db)

### Пересмотреть
- `prompts/ru-sr-translator.md` (проверить на объединение с `worker-coder.md` / `worker-analyst.md`)
- `prompts/START.md` (проверить соответствие новой Политике Делегирования)
- `prompts/BRIEF.md` (проверить соответствие актуальной архитектуре)
- `docs/sources/` (`infostud.md`, `kupujemprodajem.md`) и `docs/05-sources.md` (избыточность, объединить в один источник)

### Оставить
- `data/jobs.db` (базовый файл Единой БД)
- `data/raw/`, `data/normalized/` (структура хранения данных)
- `docs/03-schema-jobs.md` (схема Единой БД)
- `docs/sync-policy.md`, `docs/delegation-policy.md`, `docs/system-state.md` (правила работы и архитектура)
- `docs/00-vision.md`, `docs/01-mvp.md`, `docs/02-architecture.md`, `docs/06-decisions.md`, `docs/07-progress.md`, `docs/08-agents.md`, `docs/09-audit-economy.md`, `docs/10-telegram-card.md`, `docs/11-ai-network.md`, `docs/howto-connect-ai.md` (системная документация)
- `prompts/worker-core.md`, `prompts/worker-analyst.md`, `prompts/worker-coder.md` (активные безголовые воркеры)
- `scrapers/` (`db.js`, `halooglasi.js`, `helloworld.js`, `infostud.js`, `kupujemprodajem.js`, `nsz.js`) (инфраструктура сбора)
- `viewer/` (`index.html`, `server.js`) (интерфейс просмотра)
- `tools/` (`ask.py`, `daily.sh`, `export-csv.js`, `translate-titles.js`) (рабочие инструменты)
- `AI.md`, `README.md`, `package.json`, `logs/ask-journal.md`, `snapshots/jobs.csv` (корень и логи)

## 2026-10-29 14:47:19 — gemini (gemini-3.5-flash)

**Задача:**
# WORKER-CORE: Базовая инструкция для всех воркеров-агентов

Ты — специализированный безголовый воркер (headless worker). Твоя единственная цель — предоставлять максимально точный и лаконичный результат с минимальным количеством токенов.

## ЖЕСТКИЕ ПРАВИЛА:
1. **НИКАКИХ ВСТУПЛЕНИЙ**: Запрещены фразы "Конечно", "Вот ваше решение", "Я проанализировал", "Надеюсь, это поможет".
2. **НИКАКИХ ВЫВОДОВ**: Запрещены резюме, пояснения в конце или советы.
3. **НИКАКИХ КОММЕНТАРИЕВ**: Не объясняй, почему ты сделал так или иначе, если об этом не просили прямо.
4. **ТОЛЬКО РЕЗУЛЬТАТ**: Выдавай только то, что запрашивается (код, список, JSON, ответ "Да/Нет").
5. **ФОРМАТ**: Если запрошен конкретный формат (JSON, CSV) — любой символ вне этого формата считается ошибкой.

Нарушение любого из этих правил приводит к отклонению результата.
# WORKER-ANALYST: Инструкция для анализа

Используй WORKER-CORE как базу.

## ДОПОЛНИТЕЛЬНЫЕ ПРАВИЛА:
1. **СТРУКТУРА**: Ответ должен быть в виде списка, таблицы или JSON.
2. **ТОЛЬКО ФАКТЫ**: Никаких предположений, интерпретаций или "вероятно". Только то, что подтверждено данными.
3. **КРАТКОСТЬ**: Используй минимально возможное количество слов для передачи смысла.
4. **ПРЯМОТА**: Ответ на вопрос должен быть первым словом (Да/Нет/Неизвестно), затем следуют supporting facts. Задача: Проанализируй файл 'bazaznanja.txt'.
Файл содержит: 
1) Шаблоны общения.
2) Глаголы действий (технические).
3) Профессиональные термины (электрика, строительство).
4) Социальные фразы и условия работы.

Цель: Превратить этот текст в фундамент для динамически растущего словаря.
Требования:
1) Предложи структуру таблицы в SQLite для хранения этих данных (поля, типы, связи).
2) Придумай алгоритм 'обогащения': как при парсинге новых вакансий автоматически находить новые слова, проверять их наличие в базе и добавлять новые записи, сохраняя стиль 'пояснений' из bazaznanja.txt.
3) Как связать слова из словаря с конкретными вакансиями, чтобы пользователь мог видеть пример использования слова в реальном объявлении?
Выдай результат в виде технического предложения (JSON или структурированный список).

**Ответ:**
{
  "sqlite_schema": {
    "categories": {
      "id": "INTEGER PRIMARY KEY AUTOINCREMENT",
      "name": "TEXT UNIQUE NOT NULL"
    },
    "dictionary": {
      "id": "INTEGER PRIMARY KEY AUTOINCREMENT",
      "category_id": "INTEGER REFERENCES categories(id)",
      "term": "TEXT UNIQUE NOT NULL",
      "definition": "TEXT",
      "created_at": "DATETIME DEFAULT CURRENT_TIMESTAMP"
    },
    "vacancies": {
      "id": "INTEGER PRIMARY KEY AUTOINCREMENT",
      "title": "TEXT NOT NULL",
      "raw_text": "TEXT NOT NULL",
      "created_at": "DATETIME DEFAULT CURRENT_TIMESTAMP"
    },
    "word_vacancy_links": {
      "id": "INTEGER PRIMARY KEY AUTOINCREMENT",
      "word_id": "INTEGER REFERENCES dictionary(id) ON DELETE CASCADE",
      "vacancy_id": "INTEGER REFERENCES vacancies(id) ON DELETE CASCADE",
      "context_snippet": "TEXT NOT NULL"
    }
  },
  "enrichment_algorithm": [
    "1. Извлечение текста вакансии и нормализация (лемматизация, токенизация).",
    "2. Выделение потенциальных терминов (существительные, глаголы, N-граммы).",
    "3. Поиск терминов в `dictionary.term` через точно совпадение или лемму.",
    "4. Для отсутствующих слов: фильтрация через стоп-слова и стоп-части речи.",
    "5. Извлечение предложений с новым словом из текста вакансии.",
    "6. Генерация определения (через LLM/rule-based parser) в стиле bazaznanja.txt на основе контекста.",
    "7. Вставка новой записи в `dictionary` с присвоением `category_id` и записи в `word_vacancy_links`."
  ],
  "linking_mechanism": {
    "type": "Many-to-Many (Многие-ко-многим)",
    "table": "word_vacancy_links",
    "data_stored": ["word_id", "vacancy_id", "context_snippet"],
    "retrieval_query": "SELECT v.id, v.title, l.context_snippet FROM word_vacancy_links l JOIN vacancies v ON l.vacancy_id = v.id WHERE l.word_id = :word_id"
  }
}

## 2026-10-29 14:51:56 — gemini (gemini-3.5-flash)

**Задача:**
# WORKER-CORE: Базовая инструкция для всех воркеров-агентов

Ты — специализированный безголовый воркер (headless worker). Твоя единственная цель — предоставлять максимально точный и лаконичный результат с минимальным количеством токенов.

## ЖЕСТКИЕ ПРАВИЛА:
1. **НИКАКИХ ВСТУПЛЕНИЙ**: Запрещены фразы "Конечно", "Вот ваше решение", "Я проанализировал", "Надеюсь, это поможет".
2. **НИКАКИХ ВЫВОДОВ**: Запрещены резюме, пояснения в конце или советы.
3. **НИКАКИХ КОММЕНТАРИЕВ**: Не объясняй, почему ты сделал так или иначе, если об этом не просили прямо.
4. **ТОЛЬКО РЕЗУЛЬТАТ**: Выдавай только то, что запрашивается (код, список, JSON, ответ "Да/Нет").
5. **ФОРМАТ**: Если запрошен конкретный формат (JSON, CSV) — любой символ вне этого формата считается ошибкой.

Нарушение любого из этих правил приводит к отклонению результата.
\n# WORKER-ANALYST: Инструкция для анализа

Используй WORKER-CORE как базу.

## ДОПОЛНИТЕЛЬНЫЕ ПРАВИЛА:
1. **СТРУКТУРА**: Ответ должен быть в виде списка, таблицы или JSON.
2. **ТОЛЬКО ФАКТЫ**: Никаких предположений, интерпретаций или "вероятно". Только то, что подтверждено данными.
3. **КРАТКОСТЬ**: Используй минимально возможное количество слов для передачи смысла.
4. **ПРЯМОТА**: Ответ на вопрос должен быть первым словом (Да/Нет/Неизвестно), затем следуют supporting facts.
\n\n
Задача: Обработай список вакансий.
Для каждой вакансии:
1. Переведи 'title_sr' на русский язык (title_ru).
2. Извлеки 1-3 ключевых профессиональных термина из 'title_sr' и 'snippet'.
3. Для каждого термина предоставь определение в стиле 'базы знаний' (кратко, профессионально).

Данные:
[
  {
    "id": "ho-5425644890034",
    "source_url": "https://www.halooglasi.com/posao/ponuda-poslova-iz-oblasti-fizicko-tehnicke-zastite/radnik-fizickog-obezbedjenja/5425644890034",
    "title_sr": "Radnik fizičkog obezbeđenja",
    "snippet": null
  },
  {
    "id": "ho-5425643517494",
    "source_url": "https://www.halooglasi.com/posao/posao-ponuda-poslova-prodaja-brze-hrane/salter-radnik---prodavac/5425643517494",
    "title_sr": "Šalter radnik - prodavac",
    "snippet": null
  },
  {
    "id": "ho-5425643517493",
    "source_url": "https://www.halooglasi.com/posao/posao-ponuda-poslova-rostilj-majstor/rostilj-majstor/5425643517493",
    "title_sr": "Roštilj majstor",
    "snippet": null
  },
  {
    "id": "ho-5425645091778",
    "source_url": "https://www.halooglasi.com/posao/ponuda-poslova-iz-oblasti-maloprodaje/kasir---prodavac-u-maloprodaji/5425645091778",
    "title_sr": "Kasir - prodavac u maloprodaji",
    "snippet": null
  },
  {
    "id": "ho-5425634365029",
    "source_url": "https://www.halooglasi.com/posao/posao-ponuda-poslova-pomoćno-osoblje/kuhinjski-radnikca/5425634365029",
    "title_sr": "Kuhinjski radnik/ca",
    "snippet": null
  },
  {
    "id": "ho-5425641893266",
    "source_url": "https://www.halooglasi.com/posao/posao-ponuda-poslova-prodaja-brze-hrane/prodavacprodavacica/5425641893266",
    "title_sr": "Prodavac/prodavačica",
    "snippet": null
  },
  {
    "id": "ho-5425642834340",
    "source_url": "https://www.halooglasi.com/posao/ponuda-poslova-higijenicar/higijenicarka/5425642834340",
    "title_sr": "Higijeničarka",
    "snippet": null
  },
  {
    "id": "ho-5425636957499",
    "source_url": "https://www.halooglasi.com/posao/posao-ponuda-poslova-pomoćno-osoblje/radnikradnica-za-pripremu-hrane/5425636957499",
    "title_sr": "Radnik/radnica za pripremu hrane",
    "snippet": null
  },
  {
    "id": "ho-5425634205798",
    "source_url": "https://www.halooglasi.com/posao/posao-ponuda-poslova-rostilj-majstor/rostilj-majstor/5425634205798",
    "title_sr": "Roštilj majstor",
    "snippet": null
  },
  {
    "id": "ho-5425634205903",
    "source_url": "https://www.halooglasi.com/posao/posao-ponuda-poslova-pica-majstor/pizza-majstor/5425634205903",
    "title_sr": "Pizza majstor",
    "snippet": null
  }
]

Формат ответа (строго JSON):
[
  {
    "id": "id_вакансии",
    "title_ru": "перевод",
    "terms": [
      {"term": "слово", "definition": "определение"}
    ]
  }
]

**Ответ:**
[
  {
    "id": "ho-5425644890034",
    "title_ru": "Сотрудник физической охраны",
    "terms": [
      {
        "term": "Fizičko obezbeđenje",
        "definition": "Комплекс мер по защите объектов, имущества и физических лиц от противоправных посягательств."
      },
      {
        "term": "Radnik obezbeđenja",
        "definition": "Специалист, выполняющий задачи по контролю доступа и поддержанию порядка на охраняемой территории."
      }
    ]
  },
  {
    "id": "ho-5425643517494",
    "title_ru": "Работник прилавка — продавец",
    "terms": [
      {
        "term": "Šalter radnik",
        "definition": "Сотрудник, осуществляющий прием заказов и обслуживание клиентов через специальную стойку или окно выдачи."
      },
      {
        "term": "Prodavac",
        "definition": "Специалист, осуществляющий отпуск товаров и расчетно-кассовое обслуживание покупателей."
      }
    ]
  },
  {
    "id": "ho-5425643517493",
    "title_ru": "Мастер гриля (мангальщик)",
    "terms": [
      {
        "term": "Roštilj majstor",
        "definition": "Повар, специализирующийся на приготовлении мясных и иных блюд на гриле или открытом огне."
      }
    ]
  },
  {
    "id": "ho-5425645091778",
    "title_ru": "Кассир — продавец в розничной торговле",
    "terms": [
      {
        "term": "Kasir",
        "definition": "Работник, выполняющий операции по приему, учету и выдаче денежных средств при продаже товаров."
      },
      {
        "term": "Maloprodaja",
        "definition": "Продажа товаров поштучно или небольшими партиями конечным потребителям для личного использования."
      }
    ]
  },
  {
    "id": "ho-5425634365029",
    "title_ru": "Кухонный рабочий / кухонная рабочая",
    "terms": [
      {
        "term": "Kuhinjski radnik",
        "definition": "Персонал, выполняющий вспомогательные работы по кулинарной подготовке продуктов, мытью посуды и уборке кухонной зоны."
      }
    ]
  },
  {
    "id": "ho-5425641893266",
    "title_ru": "Продавец / продавщица",
    "terms": [
      {
        "term": "Prodavac",
        "definition": "Торговый работник, выполняющий консультацию покупателей и продажу продукции."
      }
    ]
  },
  {
    "id": "ho-5425642834340",
    "title_ru": "Уборщица",
    "terms": [
      {
        "term": "Higijeničarka",
        "definition": "Сотрудник, выполняющий работы по уборке, дезинфекции и поддержанию санитарно-гигиенического состояния помещений."
      }
    ]
  },
  {
    "id": "ho-5425636957499",
    "title_ru": "Рабочий / рабочая по приготовлению пищи",
    "terms": [
      {
        "term": "Priprema hrane",
        "definition": "Технологический процесс первичной и механической кулинарной обработки ингредиентов перед готовкой."
      }
    ]
  },
  {
    "id": "ho-5425634205798",
    "title_ru": "Мастер гриля (мангальщик)",
    "terms": [
      {
        "term": "Roštilj majstor",
        "definition": "Повар, квалифицированный в сфере жарки продуктов на жаровнях, грилях и мангалах."
      }
    ]
  },
  {
    "id": "ho-5425634205903",
    "title_ru": "Пиццмейкер",
    "terms": [
      {
        "term": "Pizza majstor",
        "definition": "Повар, специализирующийся на приготовлении пиццы, включая замес теста, формовку и выпекание."
      }
    ]
  }
]
