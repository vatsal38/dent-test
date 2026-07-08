import Link from "next/link";
import { Skeleton } from "@/components/Skeleton";

export interface KpiItem {
  id: string;
  label: string;
  value: string | number;
  href?: string;
  hint?: string;
}

function kpiToneClasses(id: string) {
  switch (id) {
    case "studentsEnrolled":
      return "bg-amber-50 border-amber-200 hover:border-amber-300";
    case "onboardingCompleted":
    case "youthWorksSynced":
      return "bg-emerald-50 border-emerald-200 hover:border-emerald-300";
    case "checkedInPctToday":
    case "checkedInToday":
      return "bg-orange-50 border-orange-200 hover:border-orange-300";
    case "deliverablesCompleted":
    case "deliverablesSubmittedPctThisWeek":
    case "deliverablesCompletedPctThisWeek":
    case "milestonesThisWeek":
      return "bg-teal-50 border-teal-200 hover:border-teal-300";
    case "openDiscrepancies":
      return "bg-yellow-50 border-yellow-200 hover:border-yellow-300";
    case "openIncidents":
      return "bg-red-50 border-red-200 hover:border-red-300";
    default:
      return "bg-white border-gray-200 hover:border-orange-200";
  }
}

export function KpiGrid({
  items,
  loading = false,
  columns = 5,
}: {
  items: KpiItem[];
  loading?: boolean;
  columns?: 2 | 3 | 4 | 5;
}) {
  const colClass =
    columns === 2
      ? "grid-cols-1 sm:grid-cols-2"
      : columns === 3
        ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        : columns === 4
          ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
          : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5";

  if (loading) {
    return (
      <div className={`grid ${colClass} gap-4`}>
        {Array.from({ length: columns }).map((_, i) => (
          <div
            key={i}
            className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm"
          >
            <Skeleton className="h-3 w-28 mb-1" />
            <Skeleton className="h-8 w-16 mt-1" />
            <Skeleton className="h-3 w-20 mt-1" />
            <Skeleton className="h-0.5 w-12 mt-3 rounded-full" rounded="full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`grid ${colClass} gap-4 min-w-0`}>
      {items.map((item) => {
        const inner = (
          <>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
              {item.label}
            </p>
            <p className="text-2xl font-bold text-gray-900 tabular-nums">
              {item.value}
            </p>
            {item.hint ? (
              <p className="mt-1 text-xs text-gray-500">{item.hint}</p>
            ) : null}
            <div className="mt-3 h-0.5 w-12 rounded-full bg-gray-900/10" />
          </>
        );
        const className = `p-4 rounded-xl border shadow-sm block transition-colors hover:shadow-md min-w-0 ${kpiToneClasses(item.id)}`;

        if (item.href) {
          return (
            <Link key={item.id} href={item.href} className={className}>
              {inner}
            </Link>
          );
        }
        return (
          <div key={item.id} className={className}>
            {inner}
          </div>
        );
      })}
    </div>
  );
}
