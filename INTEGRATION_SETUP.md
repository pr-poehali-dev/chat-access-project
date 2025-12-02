# Настройка интеграции между chat-bankrot.ru и bankrot-kurs.ru

## Что сделано

### В chat-bankrot.ru (этот проект):
✅ Обновлен API эндпоинт для проверки токенов на новый: `https://functions.poehali.dev/4be60127-67a0-45a6-8940-0e875ec618ac`
✅ Добавлена отправка заголовка `X-Api-Key` при проверке токенов
✅ Создан файл `.env` для хранения API ключа
✅ Webhook `combo-webhook` продолжает работать для создания токенов

### В bankrot-kurs.ru (нужно получить от Юры):
✅ Создана таблица `chat_tokens` для хранения токенов
✅ API эндпоинт `/chat-tokens` с методами:
  - POST — создание токена после оплаты
  - GET ?token=xxx — проверка токена (используется chat-bankrot.ru)
✅ Защита API ключом в заголовке `X-Api-Key`

## Что нужно сделать для завершения настройки

### Шаг 1: Получить API ключ от Юры bankrot-kurs.ru

Попросите Юру в проекте bankrot-kurs.ru выполнить:
```bash
# Показать значение секрета CHAT_API_KEY
echo "Секрет CHAT_API_KEY: [покажите значение]"
```

### Шаг 2: Добавить API ключ в chat-bankrot.ru

1. В интерфейсе poehali.dev для проекта chat-bankrot.ru:
   - Найдите секрет `BANKROT_KURS_API_KEY` 
   - Вставьте туда значение от Юры из bankrot-kurs.ru (CHAT_API_KEY)

2. Обновите файл `.env` локально (для разработки):
   ```env
   VITE_BANKROT_KURS_API_KEY=значение_от_юры
   ```

### Шаг 3: Синхронизировать секреты между проектами

**КРИТИЧНО:** Оба проекта должны использовать ОДИНАКОВЫЙ API ключ:

- bankrot-kurs.ru: секрет `CHAT_API_KEY`
- chat-bankrot.ru: секрет `BANKROT_KURS_API_KEY`

Значения должны совпадать!

### Шаг 4: Проверить интеграцию

После добавления ключа проверьте:

1. **Создание токена:**
   - Сделайте тестовую покупку на bankrot-kurs.ru
   - Убедитесь что токен создался в таблице `chat_tokens`
   - Проверьте что email пришел с токеном

2. **Проверка токена:**
   - Попробуйте войти в чат на chat-bankrot.ru с полученным токеном
   - Должен открыться доступ к чату

## Архитектура интеграции

```
1. Пользователь оплачивает на bankrot-kurs.ru
                    ↓
2. Webhook создает токен в БД bankrot-kurs.ru
                    ↓
3. Email отправляется с токеном доступа
                    ↓
4. Пользователь заходит на chat-bankrot.ru
                    ↓
5. chat-bankrot.ru проверяет токен через API bankrot-kurs.ru
   GET https://functions.poehali.dev/4be60127-67a0-45a6-8940-0e875ec618ac?token=xxx
   Header: X-Api-Key: [общий секретный ключ]
                    ↓
6. Если токен валиден → доступ к чату открыт
```

## API эндпоинты

### Проверка токена (используется chat-bankrot.ru)
```http
GET https://functions.poehali.dev/4be60127-67a0-45a6-8940-0e875ec618ac?token=USER_TOKEN
Headers:
  X-Api-Key: [ОБЩИЙ_СЕКРЕТНЫЙ_КЛЮЧ]

Response:
{
  "valid": true,
  "subscription": {
    "is_active": true,
    "plan": "month",
    "expires_at": "2025-12-31T23:59:59"
  },
  "email": "user@example.com"
}
```

### Создание токена (используется bankrot-kurs.ru внутренне)
```http
POST https://functions.poehali.dev/4be60127-67a0-45a6-8940-0e875ec618ac
Headers:
  X-Api-Key: [ОБЩИЙ_СЕКРЕТНЫЙ_КЛЮЧ]
  Content-Type: application/json

Body:
{
  "email": "user@example.com",
  "plan": "month",
  "amount": 1000
}

Response:
{
  "success": true,
  "token": "generated_token_here",
  "expires_at": "2025-12-31"
}
```

## Troubleshooting

### Токен не проходит проверку
- Убедитесь что API ключи совпадают в обоих проектах
- Проверьте что токен существует в таблице `chat_tokens` на bankrot-kurs.ru
- Проверьте что подписка не истекла (expires_at > NOW())

### Email не приходит после оплаты
- Проверьте логи функции `payment` на bankrot-kurs.ru
- Убедитесь что секрет `SMTP_PASSWORD` настроен
- Проверьте что токен создался в БД

### 401 Unauthorized при проверке токена
- API ключи не совпадают между проектами
- Проверьте секреты: CHAT_API_KEY (bankrot-kurs.ru) === BANKROT_KURS_API_KEY (chat-bankrot.ru)
