import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="relative flex flex-1 flex-col items-center justify-center gap-8 overflow-hidden p-6 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,color-mix(in_srgb,var(--primary)_18%,transparent),transparent_60%)]"
      />

      <div className="flex flex-col items-center gap-3">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-2xl font-bold text-primary-foreground shadow-lg shadow-primary/30">
          W
        </span>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Wisely</h1>
        <p className="max-w-md text-balance text-muted-foreground">
          Self-hosted и облачный финансовый трекер. Бюджеты, транзакции, импорт
          выписок — под вашим контролем.
        </p>
      </div>

      <div className="flex gap-3">
        <Button asChild variant="outline" size="lg">
          <Link href="/login">Войти</Link>
        </Button>
        <Button asChild size="lg">
          <Link href="/register">Создать аккаунт</Link>
        </Button>
      </div>
    </main>
  );
}
