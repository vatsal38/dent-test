"use client";

import { Skeleton } from "@/components/Skeleton";
import { DashboardCard } from "./DashboardCard";

type Variant = "kpi" | "chart" | "list" | "banner";

export function DashboardWidgetSkeleton({
  variant = "chart",
  titleWidth = "w-44",
}: {
  variant?: Variant;
  titleWidth?: string;
}) {
  if (variant === "kpi") {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="p-4 rounded-xl border border-gray-200 bg-white"
          >
            <Skeleton className="h-3 w-28 mb-2" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === "banner") {
    return <Skeleton className="h-12 w-full rounded-xl" />;
  }

  return (
    <DashboardCard>
      <Skeleton className={`h-5 ${titleWidth} mb-4`} />
      {variant === "list" ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, j) => (
            <Skeleton key={j} className="h-4 w-full" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, j) => (
            <Skeleton key={j} className="h-2 w-full rounded-full" />
          ))}
        </div>
      )}
    </DashboardCard>
  );
}
