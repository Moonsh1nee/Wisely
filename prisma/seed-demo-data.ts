import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

function resolveSqlitePath(databaseUrl: string | undefined): string {
  if (!databaseUrl) return "./prisma/dev.db";
  return databaseUrl.startsWith("file:") ? databaseUrl.slice("file:".length) : databaseUrl;
}

const adapter = new PrismaBetterSqlite3({
  url: resolveSqlitePath(process.env.DATABASE_URL),
});
const prisma = new PrismaClient({ adapter });

const EXPENSE_CATEGORIES = [
  "Продукты",
  "Транспорт",
  "Жильё",
  "Развлечения",
  "Здоровье",
  "Подписки",
];
const INCOME_CATEGORIES = ["Зарплата", "Фриланс", "Прочее"];

// Realistic recurring + randomized expense templates: [category, description, min, max, timesPerMonth]
const EXPENSE_TEMPLATES: Array<{
  category: string;
  descriptions: string[];
  min: number; // cents
  max: number; // cents
  perMonth: number;
}> = [
  {
    category: "Продукты",
    descriptions: ["Супермаркет", "Магазин у дома", "Овощной рынок", "Пятёрочка"],
    min: 800_00,
    max: 4500_00,
    perMonth: 10,
  },
  {
    category: "Транспорт",
    descriptions: ["Такси", "Метро", "Заправка", "Каршеринг"],
    min: 150_00,
    max: 2500_00,
    perMonth: 8,
  },
  {
    category: "Жильё",
    descriptions: ["Аренда квартиры", "Коммунальные услуги", "Интернет"],
    min: 3000_00,
    max: 45000_00,
    perMonth: 2,
  },
  {
    category: "Развлечения",
    descriptions: ["Кино", "Ресторан", "Бар", "Концерт", "Подписка на стриминг"],
    min: 500_00,
    max: 6000_00,
    perMonth: 5,
  },
  {
    category: "Здоровье",
    descriptions: ["Аптека", "Врач", "Фитнес-клуб", "Стоматолог"],
    min: 400_00,
    max: 8000_00,
    perMonth: 3,
  },
  {
    category: "Подписки",
    descriptions: ["Netflix", "Spotify", "Облачное хранилище", "Software подписка"],
    min: 300_00,
    max: 1500_00,
    perMonth: 3,
  },
];

const INCOME_TEMPLATES: Array<{
  category: string;
  descriptions: string[];
  min: number;
  max: number;
  perMonth: number;
}> = [
  {
    category: "Зарплата",
    descriptions: ["Зарплата за месяц"],
    min: 250000_00,
    max: 250000_00,
    perMonth: 1,
  },
  {
    category: "Фриланс",
    descriptions: ["Проект для клиента", "Консультация", "Разовая подработка"],
    min: 5000_00,
    max: 40000_00,
    perMonth: 1,
  },
];

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[randInt(0, arr.length - 1)];
}

async function main() {
  const email = "test@wisely.local";
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`User ${email} not found. Log in via the app first or adjust the email.`);
    process.exit(1);
  }

  for (const name of EXPENSE_CATEGORIES) {
    await prisma.category.upsert({
      where: { userId_name_type: { userId: user.id, name, type: "EXPENSE" } },
      update: {},
      create: { userId: user.id, name, type: "EXPENSE" },
    });
  }
  for (const name of INCOME_CATEGORIES) {
    await prisma.category.upsert({
      where: { userId_name_type: { userId: user.id, name, type: "INCOME" } },
      update: {},
      create: { userId: user.id, name, type: "INCOME" },
    });
  }

  const categories = await prisma.category.findMany({ where: { userId: user.id } });
  const categoryByName = new Map(categories.map((c) => [c.name, c]));

  const today = new Date();
  const startDate = new Date(today.getFullYear(), today.getMonth() - 2, today.getDate());

  type NewTx = {
    userId: string;
    type: "INCOME" | "EXPENSE";
    amountCents: number;
    description: string;
    date: Date;
    categoryId: string | null;
  };

  const txs: NewTx[] = [];

  // Walk month by month from startDate to today
  const monthCursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const endMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  while (monthCursor <= endMonth) {
    const year = monthCursor.getFullYear();
    const month = monthCursor.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();
    const maxDay = isCurrentMonth ? today.getDate() : daysInMonth;

    for (const template of EXPENSE_TEMPLATES) {
      const category = categoryByName.get(template.category);
      for (let i = 0; i < template.perMonth; i++) {
        const day = randInt(1, Math.max(1, maxDay));
        if (day > maxDay) continue;
        txs.push({
          userId: user.id,
          type: "EXPENSE",
          amountCents: randInt(template.min, template.max),
          description: pick(template.descriptions),
          date: new Date(year, month, day),
          categoryId: category?.id ?? null,
        });
      }
    }

    for (const template of INCOME_TEMPLATES) {
      const category = categoryByName.get(template.category);
      for (let i = 0; i < template.perMonth; i++) {
        const day =
          template.category === "Зарплата" ? Math.min(5, maxDay) : randInt(1, Math.max(1, maxDay));
        if (day > maxDay) continue;
        txs.push({
          userId: user.id,
          type: "INCOME",
          amountCents: randInt(template.min, template.max),
          description: pick(template.descriptions),
          date: new Date(year, month, day),
          categoryId: category?.id ?? null,
        });
      }
    }

    monthCursor.setMonth(monthCursor.getMonth() + 1);
  }

  await prisma.transaction.createMany({ data: txs });

  // A budget for groceries this month, and one overall budget
  const groceries = categoryByName.get("Продукты");
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);

  if (groceries) {
    await prisma.budget.upsert({
      where: { id: "seed-groceries-budget" },
      update: {},
      create: {
        id: "seed-groceries-budget",
        userId: user.id,
        categoryId: groceries.id,
        name: "Бюджет на продукты",
        limitCents: 20000_00,
        periodStart: monthStart,
        periodEnd: monthEnd,
      },
    });
  }

  console.log(`Создано ${txs.length} тестовых транзакций для ${email} за период ${startDate.toISOString().slice(0, 10)} — ${today.toISOString().slice(0, 10)}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
