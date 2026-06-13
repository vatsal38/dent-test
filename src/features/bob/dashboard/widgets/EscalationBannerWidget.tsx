"use client";

import Link from "next/link";
import { DashboardWidgetSkeleton } from "../primitives/DashboardWidgetSkeleton";
import type { WidgetRenderProps } from "../types";

export function EscalationBannerWidget({
  snapshot,
  loading,
  isRefreshing,
}: WidgetRenderProps) {
  if (loading) return <DashboardWidgetSkeleton variant="banner" />;

  const att = snapshot?.attention;
  if (!att || att.escalation === 0) return null;

  return (
    <div
      className={`mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 transition-opacity ${isRefreshing ? "opacity-80" : ""}`}
    >
      <div>
        <p className="text-sm font-semibold text-red-900">
          {att.escalation} item{att.escalation === 1 ? "" : "s"} need escalation
        </p>
        <p className="text-xs text-red-800 mt-0.5">
          {att.late} late · {att.blocked} blocked
          {(att.openIncidents ?? 0) > 0
            ? ` · ${att.openIncidents} incident${att.openIncidents === 1 ? "" : "s"}`
            : ""}
        </p>
      </div>
      <Link
        href={
          (att.openIncidents ?? 0) > 0
            ? "/app/bob/inbox?type=incident"
            : "/app/bob/attendance/discrepancies"
        }
        className="text-sm font-medium text-red-700 hover:text-red-800 shrink-0"
      >
        {(att.openIncidents ?? 0) > 0
          ? "Open operations inbox →"
          : "Review discrepancies →"}
      </Link>
    </div>
  );
}
