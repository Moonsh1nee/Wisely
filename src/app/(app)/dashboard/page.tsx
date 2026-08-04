import Link from "next/link";
import { auth } from "@/lib/auth";
import {
  listTransactions,
  listUsedCurrencies,
  getSpendingByCategory,
  getMonthlyTrend,
  getSummaryStats,
} from "@/lib/actions/transactions";
import { listCategories } from "@/lib/actions/categories";
import { listAccountsWithBalance } from "@/lib/actions/accounts";
import { getUserSettings } from "@/lib/actions/settings";
import { ensureRecurringTransactionsGenerated } from "@/lib/actions/recurring";
import { TransactionList } from "@/components/transactions/TransactionList";
import { CurrencyFilter } from "@/components/dashboard/CurrencyFilter";
import { SpendingByCategoryChart } from "@/components/charts/SpendingByCategoryChart";
import { MonthlyTrendChart } from "@/components/charts/MonthlyTrendChart";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { Button } from "@/components/ui/button";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ currency?: string }>;
}) {
  const session = await auth();
  const { currency: currencyParam } = await searchParams;

  try {
    await ensureRecurringTransactionsGenerated(session!.user!.id!);
  } catch {
    // Non-fatal: don't blank the dashboard if recurring generation fails.
  }

  const [settings, summaryStats, usedCurrencies, categories, accounts] = await Promise.all([
    getUserSettings(),
    getSummaryStats(),
    listUsedCurrencies(),
    listCategories(),
    listAccountsWithBalance(),
  ]);

  const activeCurrency = currencyParam ?? settings.defaultCurrency;

  const [{ transactions: recentTransactions }, spendingByCategory, monthlyTrend] =
    await Promise.all([
      listTransactions({ pageSize: 5 }),
      getSpendingByCategory(1, activeCurrency),
      getMonthlyTrend(6, activeCurrency),
    ]);

  return (
    <>
      <SummaryCards stats={summaryStats} />

      {usedCurrencies.length > 1 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Валюта графиков:</span>
          <CurrencyFilter currencies={usedCurrencies} selected={activeCurrency} />
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <SpendingByCategoryChart data={spendingByCategory} />
        <MonthlyTrendChart data={monthlyTrend} />
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground">Последние транзакции</h2>
        <Button asChild variant="ghost" size="sm">
          <Link href="/transactions">Смотреть все →</Link>
        </Button>
      </div>
      <TransactionList transactions={recentTransactions} categories={categories} accounts={accounts} />
    </>
  );
}
