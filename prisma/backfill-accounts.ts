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

async function main() {
  const users = await prisma.user.findMany();

  for (const user of users) {
    const orphanCount = await prisma.transaction.count({
      where: { userId: user.id, accountId: null },
    });

    if (orphanCount === 0) continue;

    let defaultAccount = await prisma.financialAccount.findFirst({
      where: { userId: user.id, name: "Основной счёт" },
    });

    if (!defaultAccount) {
      defaultAccount = await prisma.financialAccount.create({
        data: {
          userId: user.id,
          name: "Основной счёт",
          currency: user.defaultCurrency,
          initialBalanceCents: 0,
        },
      });
    }

    const { count } = await prisma.transaction.updateMany({
      where: { userId: user.id, accountId: null },
      data: { accountId: defaultAccount.id },
    });

    console.log(
      `Пользователь ${user.email}: создан счёт "Основной счёт" (${defaultAccount.currency}), привязано ${count} транзакций`,
    );
  }

  console.log("Backfill завершён.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
