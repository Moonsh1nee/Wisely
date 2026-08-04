import { listBudgetsWithSpent } from "@/lib/actions/budgets";
import { listCategories } from "@/lib/actions/categories";
import { getUserSettings } from "@/lib/actions/settings";
import { BudgetSection } from "@/components/budgets/BudgetSection";

export default async function BudgetsPage() {
  const [budgets, categories, settings] = await Promise.all([
    listBudgetsWithSpent(),
    listCategories(),
    getUserSettings(),
  ]);

  return (
    <BudgetSection budgets={budgets} categories={categories} defaultCurrency={settings.defaultCurrency} />
  );
}
