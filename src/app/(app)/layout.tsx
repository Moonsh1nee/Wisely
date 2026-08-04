import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/nav/Sidebar";
import { MobileNav } from "@/components/nav/MobileNav";
import { UserMenu } from "@/components/nav/UserMenu";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  // Read name/email fresh from the DB rather than trusting the JWT session —
  // the session token only refreshes on next login, so a profile edit on
  // /settings wouldn't be reflected here until re-login otherwise.
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true },
  });

  return (
    <div className="flex min-h-full flex-1">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-6">
          <MobileNav />
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <UserMenu name={user?.name ?? null} email={user?.email ?? session.user.email ?? ""} />
          </div>
        </header>
        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
