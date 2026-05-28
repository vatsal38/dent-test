import { Suspense } from "react";
import { RosterInboxPage } from "@/features/bob/roster/RosterInboxPage";
import { Skeleton } from "@/components/Skeleton";

export default function RosterPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      }
    >
      <RosterInboxPage />
    </Suspense>
  );
}
