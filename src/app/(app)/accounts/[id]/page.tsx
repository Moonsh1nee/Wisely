import { notFound } from "next/navigation";
import { getAccountDetail, getAccountBalanceHistory, listAccountsWithBalance } from "@/lib/actions/accounts";
import { getUserSettings } from "@/lib/actions/settings";
import { AccountDetailView } from "@/components/accounts/AccountDetailView";

export default async function AccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let account;
  try {
    account = await getAccountDetail(id);
  } catch {
    notFound();
  }

  const [balanceHistory, allAccounts, settings] = await Promise.all([
    getAccountBalanceHistory(id),
    listAccountsWithBalance(),
    getUserSettings(),
  ]);

  return (
    <AccountDetailView
      account={account}
      balanceHistory={balanceHistory}
      allAccounts={allAccounts}
      defaultCurrency={settings.defaultCurrency}
    />
  );
}
