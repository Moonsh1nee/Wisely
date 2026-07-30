import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import argon2 from "argon2";

function resolveSqlitePath(databaseUrl: string | undefined): string {
  if (!databaseUrl) return "./prisma/dev.db";
  return databaseUrl.startsWith("file:") ? databaseUrl.slice("file:".length) : databaseUrl;
}

const adapter = new PrismaBetterSqlite3({
  url: resolveSqlitePath(process.env.DATABASE_URL),
});
const prisma = new PrismaClient({ adapter });

const DEFAULT_EXPENSE_CATEGORIES = [
  "Продукты",
  "Транспорт",
  "Жильё",
  "Развлечения",
  "Здоровье",
  "Подписки",
];

const DEFAULT_INCOME_CATEGORIES = ["Зарплата", "Фриланс", "Прочее"];

async function main() {
  const email = "demo@wisely.local";
  const passwordHash = await argon2.hash("demo12345");

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: "Demo User",
      passwordHash,
    },
  });

  for (const name of DEFAULT_EXPENSE_CATEGORIES) {
    await prisma.category.upsert({
      where: { userId_name_type: { userId: user.id, name, type: "EXPENSE" } },
      update: {},
      create: { userId: user.id, name, type: "EXPENSE" },
    });
  }

  for (const name of DEFAULT_INCOME_CATEGORIES) {
    await prisma.category.upsert({
      where: { userId_name_type: { userId: user.id, name, type: "INCOME" } },
      update: {},
      create: { userId: user.id, name, type: "INCOME" },
    });
  }

  const groceries = await prisma.category.findFirst({
    where: { userId: user.id, name: "Продукты" },
  });
  const salary = await prisma.category.findFirst({
    where: { userId: user.id, name: "Зарплата" },
  });

  const existingTransactions = await prisma.transaction.count({
    where: { userId: user.id },
  });

  if (existingTransactions === 0) {
    const now = new Date();
    await prisma.transaction.createMany({
      data: [
        {
          userId: user.id,
          type: "INCOME",
          amountCents: 250000_00,
          description: "Зарплата за месяц",
          date: new Date(now.getFullYear(), now.getMonth(), 1),
          categoryId: salary?.id,
        },
        {
          userId: user.id,
          type: "EXPENSE",
          amountCents: 3500_00,
          description: "Супермаркет",
          date: new Date(now.getFullYear(), now.getMonth(), 5),
          categoryId: groceries?.id,
        },
        {
          userId: user.id,
          type: "EXPENSE",
          amountCents: 1200_00,
          description: "Такси",
          date: new Date(now.getFullYear(), now.getMonth(), 7),
        },
      ],
    });
  }

  console.log(`Seeded demo user: ${email} / demo12345`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
