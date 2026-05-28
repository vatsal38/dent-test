import { Suspense } from "react";
import { IntakeInboxPage } from "@/features/bob/inbox/IntakeInboxPage";
import { Skeleton } from "@/components/Skeleton";

function InboxFallback() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-72" />
      <Skeleton className="h-10 w-full max-w-4xl" />
      <Skeleton className="h-96 w-full rounded-xl" />
    </div>
  );
}

export default function RecruitmentPage() {
  return (
    <Suspense fallback={<InboxFallback />}>
      <IntakeInboxPage />
    </Suspense>
  );
}
