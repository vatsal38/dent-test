"use client";

import { Skeleton } from "@/components/Skeleton";

export function TabPanelSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="p-5 space-y-3 animate-pulse">
      <Skeleton className="h-4 w-32" />
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-xl" />
      ))}
    </div>
  );
}
