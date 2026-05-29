"use client";

import Link from "next/link";
import { DashboardCard } from "../primitives/DashboardCard";
import { DashboardEmpty } from "../primitives/DashboardEmpty";
import { DashboardWidgetSkeleton } from "../primitives/DashboardWidgetSkeleton";
import type { WidgetRenderProps } from "../types";

function pillTone(name: string) {
  const n = name.toLowerCase();
  if (n.includes("orange")) return "bg-orange-600 text-white";
  if (n.includes("purple")) return "bg-purple-600 text-white";
  if (n.includes("blue")) return "bg-blue-600 text-white";
  if (n.includes("black")) return "bg-gray-900 text-white";
  if (n.includes("crimson") || n.includes("red")) return "bg-red-600 text-white";
  if (n.includes("sapphire")) return "bg-blue-600 text-white";
  if (n.includes("emerald") || n.includes("green")) return "bg-emerald-600 text-white";
  return "bg-gray-800 text-white";
}

export function BlitzTeamsWidget({
  snapshot,
  loading,
  isRefreshing,
  placement,
}: WidgetRenderProps) {
  const title = placement.title ?? "Blitz teams";
  if (loading) return <DashboardWidgetSkeleton variant="list" />;

  const teams = (snapshot?.blitzTeams ?? []).slice(0, 4);

  return (
    <DashboardCard
      title={title}
      refreshing={isRefreshing}
      className="border-amber-200 bg-amber-50"
      action={
        <Link
          href="/app/bob/roster?queue=bob_cohort"
          className="text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          Cohort roster →
        </Link>
      }
    >
      {teams.length === 0 ? (
        <DashboardEmpty
          title="No blitz teams"
          message="Assign Blitz Squad on Students & Alums to see color teams here."
        />
      ) : (
        <div className="divide-y divide-amber-200/50 rounded-lg overflow-hidden">
          {teams.map((t, idx) => {
            const memberCount = t.memberCount ?? 0;
            const points = t.points ?? 0;
            const weekPts = t.pointsThisWeek ?? 0;
            return (
              <div
                key={t.id}
                className="flex items-center justify-between gap-3 px-3 py-3 bg-amber-50/40"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-6 w-6 rounded-full bg-amber-200 text-amber-900 text-xs font-semibold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${pillTone(t.name)}`}
                  >
                    {t.name}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0 text-right">
                  <div className="text-sm font-semibold text-gray-900 tabular-nums">
                    {points > 0 ? points : memberCount}
                    <span className="text-xs font-normal text-gray-500 ml-1">
                      {points > 0 ? "pts" : "students"}
                    </span>
                  </div>
                  {weekPts > 0 ? (
                    <div className="text-xs text-emerald-700 font-medium tabular-nums">
                      +{weekPts} wk
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <p className="text-xs text-gray-500 mt-3">
        Grouped by blitz color from Airtable. Points total Dent One Stop blitz
        submissions when logged.
      </p>
    </DashboardCard>
  );
}
