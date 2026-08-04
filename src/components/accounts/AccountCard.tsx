import Link from "next/link";
import { Landmark, PiggyBank } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { accountCardGradient } from "@/lib/account-colors";
import { Progress } from "@/components/ui/progress";
import type { GoalProgress } from "@/lib/goal-calc";

export interface AccountCardData {
  id: string;
  name: string;
  currency: string;
  color: string | null;
  accountType: "CHECKING" | "SAVINGS";
  balance: number;
  goalAmount: number | null;
  goalProgress: GoalProgress | null;
}

export function AccountCard({ account }: { account: AccountCardData }) {
  const Icon = account.accountType === "SAVINGS" ? PiggyBank : Landmark;

  return (
    <Link
      href={`/accounts/${account.id}`}
      className="flex min-h-40 flex-col justify-between rounded-2xl p-5 text-white shadow-sm transition-transform hover:scale-[1.02]"
      style={{ backgroundImage: accountCardGradient(account.color) }}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium opacity-90">{account.name}</span>
        <Icon className="h-5 w-5 opacity-80" />
      </div>

      <div>
        <p className="text-2xl font-semibold tabular-nums">
          {formatMoney(account.balance, account.currency)}
        </p>
        <p className="text-xs opacity-75">
          {account.accountType === "SAVINGS" ? "Накопительный счёт" : "Обычный счёт"}
        </p>
      </div>

      {account.goalProgress && account.goalAmount && (
        <div className="mt-1 space-y-1">
          <Progress
            value={account.goalProgress.percent}
            className="**:data-[slot=progress-track]:h-1.5 **:data-[slot=progress-track]:bg-white/25 [--color-primary:white]"
          />
          <p className="text-xs opacity-90">
            {formatMoney(account.balance, account.currency)} из {formatMoney(account.goalAmount, account.currency)}
          </p>
        </div>
      )}
    </Link>
  );
}
