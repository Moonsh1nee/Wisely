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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await auth();
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

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
      listTransactions({ page, pageSize: 25 }),
    ]);

  return (
    <>
      <TransactionForm categories={categories} accounts={accounts} />

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
                  <Link href={`/transactions?page=${page - 1}`}>← Назад</Link>
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
                  <Link href={`/transactions?page=${page + 1}`}>Вперёд →</Link>
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
