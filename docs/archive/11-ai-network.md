# 11 — Сеть бесплатных ИИ-агентов

База помощников, которые разгружают главного агента (OpenCode) и экономят токены.

## Карта сети

| Агент | Для чего | Доступ | Как подключить | Ссылка |
|---|---|---|---|---|
| **Gemini** | Анализ, исследования, тексты | API-ключ | Google AI Studio $\rightarrow$ API Key | [aistudio.google.com](https://aistudio.google.com) |
| **Ollama** | Bulk-задачи, переводы, локальный код | Локальный сервер | Установить Ollama $\rightarrow$ `ollama run gemma4:cloud` | [ollama.com](https://ollama.com) |
| **OpenRouter** | Универсальный доступ к Llama3, Mistral, Qwen | API-ключ | Создать аккаунт $\rightarrow$ Keys $\rightarrow$ создать ключ | [openrouter.ai](https://openrouter.ai) |
| **Groq** | Молниеносный инференс (Llama 3) | API-ключ | Создать аккаунт $\rightarrow$ API Keys | [console.groq.com](https://console.groq.com) |
| **Tavily** | Умный веб-поиск для агентов | API-ключ | Создать аккаунт $\rightarrow$ API Key | [tavily.com](https://tavily.com) |

## Инструкция по подключению

Все ключи вносятся в файл `.env` в корне репозитория по шаблону `.env.example`.

1. **OpenRouter**:
   - Зайди на openrouter.ai $\rightarrow$ Keys.
   - Создай ключ, скопируй его в строку `OPENROUTER_API_KEY=...`.
   - Теперь `tools/ask.py openrouter "задача"` работает бесплатно через Open Source модели.
2. **Groq**:
   - Зайди на console.groq.com $\rightarrow$ API Keys.
   - Скопируй ключ в `GROQ_API_KEY=...`.
3. **Gemini**:
   - aistudio.google.com $\rightarrow$ Create API key.
   - Скопируй в `GEMINI_API_KEY=...`.

## Как работает делегирование (Воркфлоу)

Чтобы OpenCode тратил минимум ресурсов, он использует схему «Маршрутизатор $\rightarrow$ Воркер»:

1. **Разбиение**: Ты пишешь поток мыслей $\rightarrow$ OpenCode делит его на атомарные задачи (например: «собрать HTML», «перевести список», «анализировать структуру»).
2. **Маршрутизация**:
   - Текст/поиск/перевод $\rightarrow$ `ask.py gemini`
   - Массовый перебор/локальный код $\rightarrow$ `ask.py ollama`
   - Логика/код $\rightarrow$ сам OpenCode
   - Быстрый чек/сводка $\rightarrow$ `ask.py openrouter`
3. **Сбор**: OpenCode получает ответы от воркеров, объединяет их в финальный результат и коммитит изменения.
4. **Логирование**: все обсуждения с агентами пишутся в `logs/ask-journal.md` — ты видишь всё, что они ответили, без лишних вопросов мне.

## Проверка работоспособности

Для проверки любого агента используй команду:
`./tools/ask.py <провайдер> "Привет! Ты работаешь? Напиши одну строку кода на JS."`
Если ответ пришёл — агент в сети.
