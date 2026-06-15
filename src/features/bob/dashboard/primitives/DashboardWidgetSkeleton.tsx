"use client";

import { Skeleton } from "@/components/Skeleton";
import { DashboardCard } from "./DashboardCard";

type Variant = "kpi" | "chart" | "list" | "banner" | "table" | "metricBars" | "weekChart" | "donut";

export function DashboardWidgetSkeleton({
  variant = "chart",
  titleWidth = "w-44",
  kpiCount = 5,
  listRows = 5,
}: {
  variant?: Variant;
  titleWidth?: string;
  kpiCount?: number;
  listRows?: number;
}) {
  if (variant === "kpi") {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {Array.from({ length: kpiCount }).map((_, i) => (
          <div
            key={i}
            className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm"
          >
            <Skeleton className="h-3 w-28 mb-2" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-20 mt-1" />
            <Skeleton className="h-0.5 w-12 mt-3 rounded-full" rounded="full" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === "banner") {
    return <Skeleton className="h-12 w-full rounded-xl" />;
  }

  if (variant === "table") {
    return (
      <DashboardCard>
        <div className="flex items-start justify-between gap-2 mb-3">
          <Skeleton className={`h-6 ${titleWidth}`} />
          <Skeleton className="h-4 w-28" />
        </div>
        <div className="overflow-x-auto -mx-1">
          <table className="w-full">
            <thead>
              <tr>
                {["Track", "Today", "Week", "Overall"].map((col) => (
                  <th key={col} className="pb-2 pr-3">
                    <Skeleton className="h-3 w-14" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>
                  <td className="py-2 pr-3">
                    <Skeleton className="h-4 w-32" />
                  </td>
                  <td className="py-2 px-2">
                    <Skeleton className="h-4 w-10 ml-auto" />
                  </td>
                  <td className="py-2 px-2">
                    <Skeleton className="h-4 w-10 ml-auto" />
                  </td>
                  <td className="py-2 pl-2">
                    <Skeleton className="h-4 w-10 ml-auto" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DashboardCard>
    );
  }

  if (variant === "metricBars") {
    return (
      <DashboardCard>
        <div className="flex items-start justify-between gap-2 mb-3">
          <Skeleton className={`h-6 ${titleWidth}`} />
          <Skeleton className="h-4 w-28" />
        </div>
        <Skeleton className="h-4 w-full max-w-md mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i}>
              <div className="flex justify-between mb-1">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" rounded="full" />
            </div>
          ))}
        </div>
      </DashboardCard>
    );
  }

  if (variant === "weekChart") {
    return (
      <DashboardCard>
        <Skeleton className={`h-6 ${titleWidth} mb-3`} />
        <Skeleton className="h-4 w-full max-w-lg mb-4" />
        <div className="flex gap-4 mb-3 justify-center sm:justify-start">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-24" />
          ))}
        </div>
        <div className="grid grid-cols-6 gap-4 items-end">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center">
              <Skeleton className="w-16 sm:w-20 h-44 rounded-md" rounded="md" />
              <Skeleton className="h-3 w-12 mt-2" />
              <Skeleton className="h-2 w-8 mt-1" />
            </div>
          ))}
        </div>
      </DashboardCard>
    );
  }

  if (variant === "donut") {
    return (
      <DashboardCard>
        <div className="flex items-start justify-between gap-2 mb-3">
          <Skeleton className={`h-6 ${titleWidth}`} />
          <Skeleton className="h-4 w-28" />
        </div>
        <Skeleton className="h-4 w-full max-w-md mb-4" />
        <div className="flex justify-center">
          <Skeleton className="h-40 w-40 rounded-full" rounded="full" />
        </div>
        <div className="mt-4 flex flex-wrap justify-center gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-24" />
          ))}
        </div>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard>
      <div className="flex items-start justify-between gap-2 mb-3">
        <Skeleton className={`h-6 ${titleWidth}`} />
        {variant === "list" ? <Skeleton className="h-4 w-20" /> : null}
      </div>
      {variant === "list" ? (
        <>
          <Skeleton className="h-4 w-48 mb-3" />
          <div className="space-y-2">
            {Array.from({ length: listRows }).map((_, j) => (
              <div
                key={j}
                className="flex items-center justify-between gap-2 py-1"
              >
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-12" />
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, j) => (
            <Skeleton key={j} className="h-2 w-full rounded-full" rounded="full" />
          ))}
        </div>
      )}
    </DashboardCard>
  );
}
