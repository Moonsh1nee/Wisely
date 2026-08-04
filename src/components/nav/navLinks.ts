import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, ArrowLeftRight, Wallet, PiggyBank, Settings } from "lucide-react";

export interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_LINKS: NavLink[] = [
  { href: "/dashboard", label: "Обзор", icon: LayoutDashboard },
  { href: "/transactions", label: "Транзакции", icon: ArrowLeftRight },
  { href: "/accounts", label: "Счета", icon: Wallet },
  { href: "/budgets", label: "Бюджеты", icon: PiggyBank },
  { href: "/settings", label: "Настройки", icon: Settings },
];
