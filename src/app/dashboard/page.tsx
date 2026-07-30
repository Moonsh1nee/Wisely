import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { listCategories } from "@/lib/actions/categories";
import {
  listTransactions,
  getSpendingByCategory,
  getMonthlyTrend,
} from "@/lib/actions/transactions";
import { listBudgetsWithSpent } from "@/lib/actions/budgets";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { TransactionList } from "@/components/transactions/TransactionList";
import { CategoryManager } from "@/components/categories/CategoryManager";
import { BudgetSection } from "@/components/budgets/BudgetSection";
import { SpendingByCategoryChart } from "@/components/charts/SpendingByCategoryChart";
import { MonthlyTrendChart } from "@/components/charts/MonthlyTrendChart";
import { CsvImportForm } from "@/components/import/CsvImportForm";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const [categories, transactions, budgets, spendingByCategory, monthlyTrend] =
    await Promise.all([
      listCategories(),
      listTransactions(),
      listBudgetsWithSpent(),
      getSpendingByCategory(1),
      getMonthlyTrend(6),
    ]);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          Привет, {session.user.name ?? session.user.email}
        </h1>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button type="submit" className="rounded border px-3 py-1.5 text-sm">
            Выйти
          </button>
        </form>
      </div>

      <TransactionForm categories={categories} />

      <div className="grid gap-4 sm:grid-cols-2">
        <SpendingByCategoryChart data={spendingByCategory} />
        <MonthlyTrendChart data={monthlyTrend} />
      </div>

      <TransactionList transactions={transactions} />

      <div className="grid gap-4 sm:grid-cols-2">
        <CategoryManager categories={categories} />
        <BudgetSection budgets={budgets} categories={categories} />
      </div>

      <CsvImportForm />
    </main>
  );
}
