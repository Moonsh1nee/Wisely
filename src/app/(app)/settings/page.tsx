import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listCategories } from "@/lib/actions/categories";
import { getUserSettings } from "@/lib/actions/settings";
import { CurrencySettings } from "@/components/settings/CurrencySettings";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { PasswordForm } from "@/components/settings/PasswordForm";
import { CategoryManager } from "@/components/categories/CategoryManager";

export default async function SettingsPage() {
  const session = await auth();

  const [user, categories, settings] = await Promise.all([
    prisma.user.findUnique({ where: { id: session!.user!.id! }, select: { name: true } }),
    listCategories(),
    getUserSettings(),
  ]);

  return (
    <>
      <ProfileForm name={user?.name ?? null} />
      <PasswordForm />
      <CurrencySettings defaultCurrency={settings.defaultCurrency} />
      <CategoryManager categories={categories} />
    </>
  );
}
