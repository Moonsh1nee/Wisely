"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { AccountCard, type AccountCardData } from "@/components/accounts/AccountCard";
import { AccountFormDialog } from "@/components/accounts/AccountFormDialog";

export function AccountManager({
  accounts,
  defaultCurrency,
}: {
  accounts: AccountCardData[];
  defaultCurrency: string;
}) {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {accounts.map((account) => (
        <AccountCard key={account.id} account={account} />
      ))}

      <button
        type="button"
        onClick={() => setCreateOpen(true)}
        className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
      >
        <Plus className="h-6 w-6" />
        <span className="text-sm font-medium">Добавить счёт</span>
      </button>

      <AccountFormDialog open={createOpen} onOpenChange={setCreateOpen} defaultCurrency={defaultCurrency} />
    </div>
  );
}
