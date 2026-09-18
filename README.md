# Wisely

![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?style=for-the-badge&logo=prisma&logoColor=white)

Личный финансовый трекер: мультивалютные бюджеты, повторяющиеся транзакции, накопительные цели, импорт банковских выписок. Self-hosted и облачный — SQLite для одного пользователя на своём сервере, PostgreSQL для деплоя в облако, один и тот же код без переключателей.

## Почему так

Изначально финансовый модуль жил внутри [GetGrip](https://github.com/Moonsh1nee/habitforge-frontend) — персонального "второго мозга" с задачами, привычками и всем остальным в одном приложении. Он туда не вписывался: разные пользователи, разная частота использования, разные требования к приватности данных. Вынес в отдельный продукт с собственной БД — реальные данные (172 транзакции одного пользователя) мигрировал одноразовым скриптом (`prisma/import-getgrip.ts`), а не бросил.

## Возможности

| Раздел | Что внутри |
|---|---|
| **Счета** | Несколько счетов с балансом, валютой и цветовой меткой; отдельный тип "накопительный счёт" с целевой суммой и прогресс-баром |
| **Транзакции** | Доход/расход, категории, повторяющиеся транзакции (ленивая генерация при заходе на страницу — без крон-джобы), импорт CSV-выписки из банка |
| **Переводы** | Отдельная модель `Transfer` (double-entry) для перемещения денег между своими счетами — не искажает статистику доходов/расходов, в отличие от двух связанных транзакций |
| **Бюджеты** | Лимит по категории на период с прогресс-баром |
| **Дашборд** | Динамика баланса по месяцам, круговая диаграмма расходов по категориям (с "Остальное" для длинного хвоста мелких категорий) |
| **Вход через GetGrip** | OAuth2-логин через собственный identity-провайдер [GetGrip](https://github.com/Moonsh1nee/habitforge-backend) — не нужно помнить ещё один пароль |

## Стек и технические решения

- **Next.js 16** (App Router, Server Actions) + **TypeScript** + **Tailwind v4**
- **Prisma 7** на новом driver-adapter API (`@prisma/adapter-better-sqlite3` / Postgres-адаптер) — без `url` в `datasource db`, подключение собирается в коде, что и даёт переключение SQLite↔PostgreSQL без правки схемы
- **Auth.js v5** (Credentials + кастомный OAuth-провайдер для входа через GetGrip)
- Вся арифметика — даты повторов, суммы бюджетов, разбор CSV, расчёт баланса по месяцам — вынесена в чистые функции без побочных эффектов (`src/lib/*-calc.ts`) и покрыта тестами отдельно от Prisma, вместо мокания базы данных
- In-memory rate-limiter (token bucket) на попытки входа — осознанно без Redis: приложение однопроцессное и self-hosted, лишняя зависимость не окупается
- UI-кит — смесь Radix (`button`, `dialog`, `select`) и Base UI (`tabs`, `dropdown-menu`, `sheet`) под общим неймингом shadcn — два разных API пропсов в одной кодовой базе, разобрался и задокументировал для себя, где что

## Быстрый старт

```bash
npm install
cp .env.example .env        # свой AUTH_SECRET
npx prisma migrate deploy
npx prisma generate         # Prisma 7 не делает это на install автоматически
npm run db:seed             # demo@wisely.local / demo12345
npm run dev                 # http://localhost:3000
```

## Тесты

```bash
npm run test    # 49 тестов, чистые функции — без БД
npm run lint
npm run build
```

CI (`.github/workflows/ci.yml`) гоняет тесты, линт и билд на каждый push/PR в `master`.

## Лицензия

MIT
