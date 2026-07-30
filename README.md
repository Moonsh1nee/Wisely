# Wisely

Self-hosted и облачный финансовый трекер: бюджеты, транзакции, импорт банковских выписок.

Стек и архитектурные решения: см. [`../Wisely-STACK.md`](../Wisely-STACK.md).

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Стек

TypeScript везде: Next.js (App Router, Route Handlers + Server Actions) + Prisma (SQLite self-host / PostgreSQL cloud) + Auth.js + Zod + React Hook Form + TanStack Query + Recharts.
