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

  const teams = snapshot?.blitzTeams ?? [];

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
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wide">
                <th className="pb-2 pr-3 font-medium">Team</th>
                <th className="pb-2 px-2 font-medium text-right">
                  Points overall
                </th>
                <th className="pb-2 pl-2 font-medium text-right">
                  Points this week
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-200/60">
              {teams.map((t, idx) => {
                const points = t.points ?? 0;
                const weekPts = t.pointsThisWeek ?? 0;
                return (
                  <tr key={t.id}>
                    <td className="py-2.5 pr-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-semibold text-amber-900/70 tabular-nums w-4 shrink-0">
                          {idx + 1}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold truncate ${pillTone(t.name)}`}
                        >
                          {t.name}
                        </span>
                        {t.memberCount != null ? (
                          <span className="text-xs text-gray-500 shrink-0">
                            {t.memberCount} students
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-right font-semibold text-gray-900 tabular-nums">
                      {points}
                    </td>
                    <td className="py-2.5 pl-2 text-right font-medium text-emerald-800 tabular-nums">
                      {weekPts}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-gray-500 mt-3">
        Grouped by blitz color from Airtable. Points from Dent One Stop blitz
        submissions; weekly totals use the current program week.
      </p>
    </DashboardCard>
  );
}
