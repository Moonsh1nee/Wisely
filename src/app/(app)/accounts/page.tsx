import { listAccountsWithBalance } from "@/lib/actions/accounts";
import { getUserSettings } from "@/lib/actions/settings";
import { AccountManager } from "@/components/accounts/AccountManager";

export default async function AccountsPage() {
  const [accounts, settings] = await Promise.all([
    listAccountsWithBalance(),
    getUserSettings(),
  ]);

  return <AccountManager accounts={accounts} defaultCurrency={settings.defaultCurrency} />;
}
