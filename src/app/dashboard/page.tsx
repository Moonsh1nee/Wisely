import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const [transactionCount, categoryCount] = await Promise.all([
    prisma.transaction.count({ where: { userId: session.user.id } }),
    prisma.category.count({ where: { userId: session.user.id } }),
  ]);

  return (
    <main className="flex flex-1 flex-col p-6 gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          Привет, {session.user.name ?? session.user.email}
        </h1>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button type="submit" className="rounded border px-3 py-1.5 text-sm">
            Выйти
          </button>
        </form>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded border p-4">
          <p className="text-sm text-gray-500">Транзакции</p>
          <p className="text-2xl font-semibold">{transactionCount}</p>
        </div>
        <div className="rounded border p-4">
          <p className="text-sm text-gray-500">Категории</p>
          <p className="text-2xl font-semibold">{categoryCount}</p>
        </div>
      </div>

      <p className="text-sm text-gray-500">
        MVP-скелет. Дальше: форма добавления транзакции, список, бюджеты, графики.
      </p>
    </main>
  );
}
