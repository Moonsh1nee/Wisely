import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { listCategories } from "@/lib/actions/categories";
import {
  listTransactions,
  getSpendingByCategory,
  getMonthlyTrend,
  getSummaryStats,
} from "@/lib/actions/transactions";
import { listBudgetsWithSpent } from "@/lib/actions/budgets";
import { listAccountsWithBalance } from "@/lib/actions/accounts";
import { getUserSettings } from "@/lib/actions/settings";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { TransactionList } from "@/components/transactions/TransactionList";
import { CategoryManager } from "@/components/categories/CategoryManager";
import { BudgetSection } from "@/components/budgets/BudgetSection";
import { AccountManager } from "@/components/accounts/AccountManager";
import { CurrencySettings } from "@/components/settings/CurrencySettings";
import { SpendingByCategoryChart } from "@/components/charts/SpendingByCategoryChart";
import { MonthlyTrendChart } from "@/components/charts/MonthlyTrendChart";
import { CsvImportForm } from "@/components/import/CsvImportForm";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const [categories, transactions, budgets, spendingByCategory, monthlyTrend, accounts, settings, summaryStats] =
    await Promise.all([
      listCategories(),
      listTransactions(),
      listBudgetsWithSpent(),
      getSpendingByCategory(1),
      getMonthlyTrend(6),
      listAccountsWithBalance(),
      getUserSettings(),
      getSummaryStats(),
    ]);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-4 sm:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">
            W
          </span>
          <div>
            <p className="text-xs text-muted-foreground">С возвращением</p>
            <h1 className="text-lg font-semibold leading-tight">
              {session.user.name ?? session.user.email}
            </h1>
          </div>
        </div>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
          className="flex items-center gap-2"
        >
          <CurrencySettings defaultCurrency={settings.defaultCurrency} />
          <ThemeToggle />
          <button
            type="submit"
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            Выйти
          </button>
        </form>
      </header>

      <SummaryCards stats={summaryStats} />

      <TransactionForm categories={categories} accounts={accounts} />

      <div className="grid gap-4 lg:grid-cols-2">
        <SpendingByCategoryChart data={spendingByCategory} />
        <MonthlyTrendChart data={monthlyTrend} />
      </div>

      <TransactionList transactions={transactions} categories={categories} accounts={accounts} />

      <AccountManager accounts={accounts} defaultCurrency={settings.defaultCurrency} />

      <div className="grid gap-4 lg:grid-cols-2">
        <CategoryManager categories={categories} />
        <BudgetSection budgets={budgets} categories={categories} />
      </div>

      <CsvImportForm accounts={accounts} />
    </main>
  );
}
