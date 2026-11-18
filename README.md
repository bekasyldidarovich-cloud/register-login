# Register / Login API: Backend Security (Week 9)

Express + TypeScript + Prisma + PostgreSQL. Регистрация, вход по JWT, защищённый профиль.

## Что добавлено в неделе 9

| Мера                           | Зачем                                                                                          | Где                                 |
| ------------------------------ | ---------------------------------------------------------------------------------------------- | ----------------------------------- |
| Валидация входных данных (Zod) | Не доверяем клиенту: проверяем тип, формат и длину до обращения к базе                         | `src/schemas.ts`, `src/validate.ts` |
| Rate limiting                  | Защита от перебора паролей и спама: 100 запросов / 15 мин на API, 10 на `/login` и `/register` | `src/rateLimiters.ts`               |
| CORS с whitelist               | API доступен из браузера только с разрешённых сайтов                                           | `src/index.ts`, `CORS_ORIGINS`      |
| Helmet                         | Безопасные HTTP-заголовки                                                                      | `src/index.ts`                      |
| Переменные окружения           | Секреты не в коде; при старте проверяются через Zod                                            | `src/env.ts`, `.env.example`        |
| Лимит размера тела             | `express.json({ limit: "10kb" })`                                                              | `src/index.ts`                      |
| Единый формат ошибок           | `{ "error": "...", "details": [...] }`                                                         | `src/validate.ts`, `src/index.ts`   |

Исправление: в JWT теперь лежит только `userId`, а не весь объект пользователя с хешем пароля.

## Запуск

```bash
npm install
cp .env.example .env     # заполнить значения
npx prisma generate
npx prisma migrate dev
npm run dev
```

## Формат ошибок валидации

```json
{
  "error": "Password must be at least 8 characters",
  "details": [
    { "field": "password", "message": "Password must be at least 8 characters" }
  ]
}
```

Коды: `400` невалидные данные, `401` неверный логин или токен, `409` email занят, `429` слишком много запросов.
