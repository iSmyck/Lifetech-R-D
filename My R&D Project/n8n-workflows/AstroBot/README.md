# AstroBot — AI-ассистент астролога в Telegram

Проект построен на n8n с использованием RAG (Retrieval-Augmented Generation) для персонализированных астрологических интерпретаций.

## Функциональность

### Phase 1 (основной)
- Многошаговая регистрация пользователя (имя, дата, время, место рождения)
- Расчёт натальной карты через Astrologer API (RapidAPI)
- Генерация персонализированного анализа натальной карты (RAG + LLM)
- Свободные вопросы астрологу с учётом натальной карты

### Phase 2 (прогнозы)
- Ежедневные прогнозы на основе транзитов (Cron)
- Соляры и лунары (готовы к подключению)
- Совместимость / синастрия (готова к подключению)

## Технологический стек

| Компонент | Назначение |
|-----------|-----------|
| n8n | Оркестрация workflow |
| Astrologer API (RapidAPI) | Расчёт натальных карт, транзитов, соляров |
| PostgreSQL | Хранение пользователей, кэш карт, RAG-данные, логи |
| Redis | State machine для многошаговой регистрации, rate limiting |
| Qdrant | Векторная база для семантического поиска интерпретаций |
| OpenAI API | LLM (GPT-4o) для генерации интерпретаций |
| Telegram Bot API | Интерфейс пользователя |

## Структура проекта

```
📁 AstroBot/
├── 📄 01-Telegram-Router.json          (Trigger + Router)
├── 📄 02-User-Registration.json        (Многошаговая регистрация)
├── 📄 03-Natal-Chart-Reading.json      (Расклад натальной карты)
├── 📄 04-Free-Question.json            (Свободный вопрос + RAG)
├── 📄 05-Daily-Forecast-Cron.json      (Cron + ежедневные прогнозы)
├── 📄 06-Settings.json                 (Настройки пользователя)
├── 📄 07-Error-Handler.json            (Обработка ошибок)
├── 📄 database-schema.sql              (PostgreSQL schema)
├── 📄 seed-interpretations.sql         (Сид RAG данных)
└── 📄 README.md                        (Инструкция по деплою)
```

## Предварительные требования

1. **n8n** (self-hosted или cloud) с доступом к следующим нодам:
   - Telegram Trigger / Telegram
   - PostgreSQL
   - Redis
   - HTTP Request
   - Code (JavaScript)
   - Schedule Trigger
   - Execute Workflow / Execute Workflow Trigger
   - Error Trigger
   - OpenAI Chat Model (LangChain)

2. **Аккаунты и API-ключи:**
   - Telegram Bot Token (через @BotFather)
   - Astrologer API Key (RapidAPI)
   - OpenAI API Key
   - PostgreSQL база данных
   - Redis сервер
   - Qdrant (опционально для Phase 1, обязательно для продакшн RAG)

## Деплой

### Шаг 1: База данных

```bash
# Подключитесь к PostgreSQL и выполните:
psql -U your_user -d your_db -f database-schema.sql

# Загрузите начальные интерпретации:
psql -U your_user -d your_db -f seed-interpretations.sql
```

### Шаг 1.5: Настройка PGVector (RAG для AI Agent)

AI Agent workflow (03, 04, 05) используют нативный **PGVector Store** в режиме `retrieve-as-tool`. Для этого требуется:

1. Убедитесь, что расширение `vector` установлено (включено в `database-schema.sql`)
2. Заполните таблицу `rag_embeddings` векторами. Рекомендуемый способ — отдельный n8n workflow:
   - **Postgres** → SELECT из `rag_interpretations`
   - **Embeddings OpenAI** (`text-embedding-3-small`)
   - **PGVector Store** (Insert Documents mode, table `rag_embeddings`)
3. Либо используйте скрипт:

```python
import psycopg2
from openai import OpenAI

client = OpenAI()
conn = psycopg2.connect("dbname=your_db user=your_user")
cur = conn.cursor()

cur.execute("SELECT id, interpretation_text, category, planet, sign, house FROM rag_interpretations")
for row in cur.fetchall():
    emb = client.embeddings.create(input=row[1], model="text-embedding-3-small").data[0].embedding
    cur.execute(
        "INSERT INTO rag_embeddings (interpretation_id, content, metadata, embedding) VALUES (%s, %s, %s, %s)",
        (row[0], row[1], {"category": row[2], "planet": row[3], "sign": row[4], "house": row[5]}, emb)
    )
conn.commit()
```

### Шаг 2: Настройка Credentials в n8n

Создайте следующие credentials в интерфейсе n8n:

| Credential Type | Name | Описание |
|----------------|------|----------|
| Telegram API | `TELEGRAM_BOT_TOKEN` | Токен бота от @BotFather |
| HTTP Header Auth | `ASTROLOGER_API_KEY` | X-RapidAPI-Key для Astrologer API |
| OpenAI API | `OPENAI_API_KEY` | API ключ OpenAI (LLM + Embeddings) |
| PostgreSQL | `POSTGRES_CONNECTION` | Строка подключения к БД (users + PGVector + chat_memory) |
| Redis | `REDIS_CONNECTION` | Подключение к Redis (state machine) |
| Qdrant API | `QDRANT_API_KEY` | API ключ Qdrant (опционально, если используете вместо PGVector) |

### Шаг 3: Импорт Workflow

1. Откройте n8n интерфейс
2. Для каждого JSON-файла: **Workflow → Import from File**
3. Импортируйте в следующем порядке:
   1. `07-Error-Handler.json` (сначала, так как на него ссылаются остальные)
   2. `02-User-Registration.json`
   3. `03-Natal-Chart-Reading.json`
   4. `04-Free-Question.json`
   5. `05-Daily-Forecast-Cron.json`
   6. `06-Settings.json`
   7. `01-Telegram-Router.json` (последним, так как он ссылается на все остальные)

### Шаг 4: Настройка Webhook

1. В workflow `01-Telegram-Router.json` откройте ноду **Telegram Trigger**
2. Убедитесь, что webhook URL корректно настроен
3. Активируйте workflow

### Шаг 5: Настройка Cron (Phase 2)

1. В workflow `05-Daily-Forecast-Cron.json` откройте ноду **Schedule Trigger**
2. По умолчанию запуск в 06:00 UTC ежедневно
3. При необходимости измените время

## AI Agent Architecture

Workflow 03, 04 и 05 используют нативные **n8n AI Agent** ноды (`@n8n/n8n-nodes-langchain.agent` v3.1) со следующей конфигурацией:

### Компоненты AI Agent

| Компонент | Нода | Назначение |
|-----------|------|------------|
| **AI Agent** | `agent` v3.1 | Оркестрация ReAct-агента с system prompt |
| **LLM** | `lmChatOpenAi` | GPT-4o, temperature 0.7 |
| **Memory** | `memoryPostgresChat` | Postgres Chat Memory с sessionKey по telegram_id |
| **RAG Tool** | `vectorStorePGVector` | PGVector Store в режиме `retrieve-as-tool` |
| **Embeddings** | `embeddingsOpenAi` | text-embedding-3-small (1536D) |
| **Output Parser** | `outputParserStructured` | Структурированный вывод с полем `response` |

### System Prompts

#### Natal Chart Reading (03)
```
Ты — профессиональный астролог с 20-летним стажем.
Правила:
1. Опирайся ТОЛЬКО на предоставленные астрологические данные (XML контекст карты).
2. Используй инструмент поиска по астрологической базе знаний для уточнения интерпретаций.
3. Структура: личность, сферы жизни, аспекты, баланс стихий, рекомендации.
4. Max 3500 символов. Русский язык.
5. НЕ выдумывай планетарные позиции.
```

#### Free Question (04)
```
Ты — астролог-консультант.
Правила:
1. Используй инструмент поиска по базе знаний перед ответом.
2. Отвечай ТОЛЬКО на основе данных карты.
3. Ссылайся на конкретные планеты, знаки, дома.
4. Давай actionable советы. Max 3500 символов.
```

#### Daily Forecast (05)
```
Ты — астролог-прогнозист.
Правила:
1. Используй инструмент поиска для интерпретаций транзитов.
2. Опиши 2-3 ключевых транзита, свяжи с натальными положениями.
3. Дай практические рекомендации. Тон: позитивный, реалистичный.
4. Max 2500 символов. НЕ выдумывай транзиты.
```

## Команды бота

| Команда | Описание |
|---------|----------|
| `/start` | Начало регистрации или главное меню |
| `/menu` | Главное меню |
| `/chart` | Показать натальную карту |
| `/question` | Задать вопрос астрологу |
| `/forecast` | Прогноз на сегодня (Phase 2) |
| `/settings` | Настройки |
| `/reset` | Сбросить данные и начать заново |
| `/help` | Помощь |

## State Machine (Redis)

| Состояние | Описание |
|-----------|----------|
| `INIT` | Новый пользователь |
| `ASK_NAME` | Ожидание имени |
| `ASK_BIRTH_DATE` | Ожидание даты рождения |
| `ASK_BIRTH_TIME` | Ожидание времени рождения |
| `ASK_BIRTH_PLACE` | Ожидание города рождения |
| `CALCULATING_CHART` | Расчёт карты |
| `MENU_MAIN` | Главное меню |
| `AWAITING_QUESTION` | Ожидание вопроса |

## Архитектура потока данных

```
[Telegram Trigger]
    → [Extract Fields]
    → [Redis: GET state]
    → [Switch Router]
        → INIT/ASK_* → [02-User-Registration]
        → MENU_MAIN  → [03-Natal-Chart] / [04-Free-Question] / [05-Daily-Forecast] / [06-Settings]
        → AWAITING_QUESTION → [04-Free-Question]
```

## Phase 2: Подключение прогнозов

### Транзиты
Используется эндпоинт `POST /api/v5/context/transit` с `first_subject` (натальные данные) + `transit_subject` (текущая дата).

### Соляр
Используется эндпоинт `POST /api/v5/context/solar-return` с `subject` + `year`.

### Лунар
Используется эндпоинт `POST /api/v5/context/lunar-return`.

### Совместимость
Используется эндпоинт `POST /api/v5/context/synastry` или `POST /api/v5/compatibility-score`.

## Логирование и мониторинг

Все ошибки автоматически логируются в таблицу `error_log`. Workflow `07-Error-Handler`:
- Сохраняет ошибку в БД
- Отправляет пользователю сообщение об ошибке
- Может быть расширен для отправки алертов администратору

## Rate Limiting

В workflow `01-Telegram-Router` реализована проверка через Redis: максимум 1 запрос к Astrologer API на пользователя в минуту.

## Кэширование

Натальная карта расчитывается один раз при регистрации и сохраняется в поля `chart_context_xml` и `chart_data_json` таблицы `users`. Повторные запросы используют кэш.

## i18n

Все текстовые сообщения вынесены в параметры нод Telegram. Для добавления нового языка:
1. Добавьте поле `language` в таблицу `users`
2. Создайте дубликаты workflow с переведёнными текстами
3. Или используйте Code Node для динамической подстановки текстов из БД

## Безопасность

- API ключи хранятся в n8n Credentials (зашифрованы)
- Rate limiting предотвращает злоупотребления
- Таймаут HTTP Request: 30 секунд
- Retry logic: при ошибке Astrologer API можно добавить Wait + Retry ноды

## Требования к Astrologer API

Base URL: `https://astrologer.p.rapidapi.com`

Обязательные заголовки:
```json
{
  "X-RapidAPI-Host": "astrologer.p.rapidapi.com",
  "X-RapidAPI-Key": "YOUR_KEY",
  "Content-Type": "application/json"
}
```

Основные эндпоинты:
- `POST /api/v5/context/birth-chart` — натальная карта
- `POST /api/v5/chart/birth-chart` — SVG визуализация
- `POST /api/v5/context/transit` — транзиты
- `POST /api/v5/context/solar-return` — соляр
- `POST /api/v5/context/lunar-return` — лунар
- `POST /api/v5/context/synastry` — синастрия
- `POST /api/v5/compatibility-score` — скор совместимости

## Лицензия

MIT — свободно для использования и модификации.
