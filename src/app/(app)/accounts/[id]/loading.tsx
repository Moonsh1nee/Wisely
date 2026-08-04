import { Skeleton } from "@/components/ui/skeleton";

export default function AccountDetailLoading() {
  return (
    <>
      <Skeleton className="h-64 rounded-2xl" />
      <Skeleton className="h-56 rounded-2xl" />
    </>
  );
}
