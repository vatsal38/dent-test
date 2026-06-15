"use client";

import { Skeleton } from "@/components/Skeleton";

export function PageHeaderSkeleton({
  actionCount = 3,
}: {
  actionCount?: number;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 space-y-2">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-8 w-56 max-w-full" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>
      {actionCount > 0 ? (
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {Array.from({ length: actionCount }).map((_, i) => (
            <Skeleton
              key={i}
              className={`h-10 rounded-lg ${i === actionCount - 1 ? "w-28" : "w-36"}`}
              rounded="lg"
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
