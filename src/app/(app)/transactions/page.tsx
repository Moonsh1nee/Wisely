import Link from "next/link";
import { auth } from "@/lib/auth";
import { listCategories } from "@/lib/actions/categories";
import { listAccountsWithBalance } from "@/lib/actions/accounts";
import { listTransactions } from "@/lib/actions/transactions";
import { listRecurringTransactions, ensureRecurringTransactionsGenerated } from "@/lib/actions/recurring";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { TransactionList } from "@/components/transactions/TransactionList";
import { RecurringManager } from "@/components/recurring/RecurringManager";
import { CsvImportForm } from "@/components/import/CsvImportForm";
import { getUserSettings } from "@/lib/actions/settings";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { X } from "lucide-react";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; category?: string }>;
}) {
  const session = await auth();
  const { page: pageParam, category: categoryParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const categoryId = categoryParam === undefined ? undefined : categoryParam === "none" ? null : categoryParam;

  try {
    await ensureRecurringTransactionsGenerated(session!.user!.id!);
  } catch {
    // Non-fatal: recurring generation failures shouldn't blank the page.
  }

  const [categories, accounts, settings, recurring, { transactions, totalPages }] =
    await Promise.all([
      listCategories(),
      listAccountsWithBalance(),
      getUserSettings(),
      listRecurringTransactions(),
      listTransactions({ page, pageSize: 25, categoryId }),
    ]);

  const activeCategory =
    categoryId === undefined
      ? null
      : categoryId === null
        ? { name: "Без категории" }
        : categories.find((c) => c.id === categoryId);
  const pageHref = (p: number) => `/transactions?page=${p}${categoryParam ? `&category=${categoryParam}` : ""}`;

  return (
    <>
      <TransactionForm categories={categories} accounts={accounts} />

      {activeCategory && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Фильтр:</span>
          <Badge variant="secondary" className="gap-1.5">
            {activeCategory.name}
            <Link href="/transactions" aria-label="Сбросить фильтр" className="hover:text-foreground">
              <X className="h-3 w-3" />
            </Link>
          </Badge>
        </div>
      )}

      <Tabs defaultValue="transactions">
        <TabsList>
          <TabsTrigger value="transactions">Транзакции</TabsTrigger>
          <TabsTrigger value="recurring">Повторяющиеся</TabsTrigger>
          <TabsTrigger value="import">Импорт CSV</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="flex flex-col gap-4">
          <TransactionList transactions={transactions} categories={categories} accounts={accounts} />
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              {page > 1 ? (
                <Button asChild variant="outline" size="sm">
                  <Link href={pageHref(page - 1)}>← Назад</Link>
                </Button>
              ) : (
                <Button variant="outline" size="sm" disabled>
                  ← Назад
                </Button>
              )}
              <span className="text-sm text-muted-foreground">
                Стр. {page} из {totalPages}
              </span>
              {page < totalPages ? (
                <Button asChild variant="outline" size="sm">
                  <Link href={pageHref(page + 1)}>Вперёд →</Link>
                </Button>
              ) : (
                <Button variant="outline" size="sm" disabled>
                  Вперёд →
                </Button>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="recurring">
          <RecurringManager
            recurring={recurring}
            categories={categories}
            accounts={accounts}
            defaultCurrency={settings.defaultCurrency}
          />
        </TabsContent>

        <TabsContent value="import">
          <CsvImportForm accounts={accounts} />
        </TabsContent>
      </Tabs>
    </>
  );
}
