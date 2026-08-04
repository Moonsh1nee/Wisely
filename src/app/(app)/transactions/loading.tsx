import { Skeleton } from "@/components/ui/skeleton";

export default function TransactionsLoading() {
  return (
    <>
      <Skeleton className="h-32 rounded-2xl" />
      <Skeleton className="h-8 w-64 rounded-lg" />
      <Skeleton className="h-96 rounded-2xl" />
    </>
  );
}
