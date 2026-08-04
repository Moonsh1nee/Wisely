import "dotenv/config";
import { readFileSync } from "node:fs";
import { PrismaClient, type TransactionType } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { computeImportHash } from "../src/lib/csv-import";

// One-off migration script: imports a single user's finance data exported
// from GetGrip (see HabitForge/habitforge-backend/scripts/export_finance_user.py)
// into Wisely. Safe to re-run — transactions dedup via the same importHash
// used by the CSV importer; budgets dedup by (userId, categoryId, periodStart).
//
// Usage: npx tsx prisma/import-getgrip.ts <path-to-export.json> <email>

function resolveSqlitePath(databaseUrl: string | undefined): string {
  if (!databaseUrl) return "./prisma/dev.db";
  return databaseUrl.startsWith("file:") ? databaseUrl.slice("file:".length) : databaseUrl;
}

const adapter = new PrismaBetterSqlite3({
  url: resolveSqlitePath(process.env.DATABASE_URL),
});
const prisma = new PrismaClient({ adapter });

interface GetGripCategory {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
}

interface GetGripTransaction {
  id: string;
  type: "income" | "expense";
  amount: string | number;
  categoryId: string | null;
  description: string | null;
  date: string;
}

interface GetGripBudget {
  id: string;
  categoryId: string;
  amount: string | number;
  period: string;
  color: string | null;
}

interface GetGripExport {
  categories: GetGripCategory[];
  transactions: GetGripTransaction[];
  budgets: GetGripBudget[];
}

function toCents(amount: string | number): number {
  return Math.round(Number(amount) * 100);
}

function wiselyType(t: "income" | "expense"): TransactionType {
  return t === "income" ? "INCOME" : "EXPENSE";
}

async function main() {
  const [, , filePath, email] = process.argv;
  if (!filePath || !email) {
    console.error("Usage: npx tsx prisma/import-getgrip.ts <path-to-export.json> <email>");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(
      `Пользователь ${email} не найден в Wisely. Сначала зарегистрируйтесь через форму на /register.`,
    );
    process.exit(1);
  }

  const data: GetGripExport = JSON.parse(readFileSync(filePath, "utf-8"));

  let defaultAccount = await prisma.financialAccount.findFirst({
    where: { userId: user.id, name: "Основной счёт" },
  });
  if (!defaultAccount) {
    defaultAccount = await prisma.financialAccount.create({
      data: {
        userId: user.id,
        name: "Основной счёт",
        currency: "RUB",
        initialBalanceCents: 0,
      },
    });
  }

  // GetGrip categories have no `type` — Wisely requires one. Figure out
  // which type(s) each category was actually used with from the transactions
  // (and treat budget categories as EXPENSE, since GetGrip budgets are
  // implicitly expense-tracking only).
  const usedTypes = new Map<string, Set<TransactionType>>();
  for (const t of data.transactions) {
    if (!t.categoryId) continue;
    const set = usedTypes.get(t.categoryId) ?? new Set<TransactionType>();
    set.add(wiselyType(t.type));
    usedTypes.set(t.categoryId, set);
  }
  for (const b of data.budgets) {
    const set = usedTypes.get(b.categoryId) ?? new Set<TransactionType>();
    set.add("EXPENSE");
    usedTypes.set(b.categoryId, set);
  }

  const categoryById = new Map(data.categories.map((c) => [c.id, c]));
  // key: `${getgripCategoryId}:${wiselyType}` -> Wisely Category.id
  const categoryMap = new Map<string, string>();

  for (const [getgripId, types] of usedTypes) {
    const source = categoryById.get(getgripId);
    if (!source) continue; // referenced category missing from export, skip
    for (const type of types) {
      const category = await prisma.category.upsert({
        where: { userId_name_type: { userId: user.id, name: source.name, type } },
        update: {},
        create: {
          userId: user.id,
          name: source.name,
          icon: source.icon,
          color: source.color,
          type,
        },
      });
      categoryMap.set(`${getgripId}:${type}`, category.id);
    }
  }

  let importedCount = 0;
  let skippedCount = 0;
  for (const t of data.transactions) {
    const type = wiselyType(t.type);
    const amountCents = toCents(t.amount);
    const date = new Date(t.date);
    const description = t.description ?? "";
    const categoryId = t.categoryId ? (categoryMap.get(`${t.categoryId}:${type}`) ?? null) : null;
    const importHash = computeImportHash(user.id, date, amountCents, description);

    const existing = await prisma.transaction.findUnique({
      where: { userId_importHash: { userId: user.id, importHash } },
    });
    if (existing) {
      skippedCount++;
      continue;
    }

    await prisma.transaction.create({
      data: {
        userId: user.id,
        accountId: defaultAccount.id,
        categoryId,
        type,
        amountCents,
        currency: "RUB",
        description: t.description,
        date,
        importHash,
      },
    });
    importedCount++;
  }

  // Budgets: GetGrip models a recurring "monthly limit per category" with no
  // explicit dates. Wisely models discrete dated periods. We import a single
  // snapshot budget for the current calendar month per GetGrip budget — this
  // is a one-time approximation, not a recurring template (Wisely has no
  // recurring-budget concept yet).
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  let budgetsImported = 0;
  let budgetsSkipped = 0;
  for (const b of data.budgets) {
    const wiselyCategoryId = categoryMap.get(`${b.categoryId}:EXPENSE`) ?? null;
    const source = categoryById.get(b.categoryId);

    const existing = await prisma.budget.findFirst({
      where: { userId: user.id, categoryId: wiselyCategoryId, periodStart },
    });
    if (existing) {
      budgetsSkipped++;
      continue;
    }

    await prisma.budget.create({
      data: {
        userId: user.id,
        categoryId: wiselyCategoryId,
        name: source?.name ?? "Бюджет",
        limitCents: toCents(b.amount),
        periodStart,
        periodEnd,
      },
    });
    budgetsImported++;
  }

  console.log(`Пользователь: ${email}`);
  console.log(`Категорий создано/переиспользовано: ${categoryMap.size}`);
  console.log(`Транзакций: импортировано ${importedCount}, пропущено дублей ${skippedCount}`);
  console.log(`Бюджетов (снимок за текущий месяц): импортировано ${budgetsImported}, пропущено ${budgetsSkipped}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
