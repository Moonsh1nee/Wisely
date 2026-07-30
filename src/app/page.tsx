import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-6 text-center">
      <h1 className="text-4xl font-bold">Wisely</h1>
      <p className="max-w-md text-gray-600">
        Self-hosted и облачный финансовый трекер. Бюджеты, транзакции, импорт выписок.
      </p>
      <div className="flex gap-3">
        <Link href="/login" className="rounded border px-4 py-2">
          Войти
        </Link>
        <Link href="/register" className="rounded bg-black px-4 py-2 text-white">
          Создать аккаунт
        </Link>
      </div>
    </main>
  );
}
