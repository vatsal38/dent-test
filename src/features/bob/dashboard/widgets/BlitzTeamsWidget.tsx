"use client";

import Link from "next/link";
import { DashboardCard } from "../primitives/DashboardCard";
import { DashboardEmpty } from "../primitives/DashboardEmpty";
import { DashboardWidgetSkeleton } from "../primitives/DashboardWidgetSkeleton";
import type { WidgetRenderProps } from "../types";

function scoreFromId(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  const score = 110 + (h % 60); // 110-169
  const delta = 8 + (h % 16); // 8-23
  return { score, delta };
}

function pillTone(name: string) {
  const n = name.toLowerCase();
  if (n.includes("crimson")) return "bg-red-600 text-white";
  if (n.includes("sapphire")) return "bg-blue-600 text-white";
  if (n.includes("emerald")) return "bg-emerald-600 text-white";
  return "bg-gray-900 text-white";
}

export function BlitzTeamsWidget({
  snapshot,
  loading,
  isRefreshing,
  placement,
}: WidgetRenderProps) {
  const title = placement.title ?? "Blitz Teams This Week";
  if (loading) return <DashboardWidgetSkeleton variant="list" />;

  const teams = (snapshot?.blitzTeams ?? []).slice(0, 3);

  return (
    <DashboardCard
      title={title}
      refreshing={isRefreshing}
      className="border-amber-200 bg-amber-50"
      action={
        <Link
          href="/app/bob/pods"
          className="text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          View all →
        </Link>
      }
    >
      {teams.length === 0 ? (
        <DashboardEmpty
          title="No blitz teams"
          message="Teams will appear here once configured."
        />
      ) : (
        <div className="divide-y divide-amber-200/50 rounded-lg overflow-hidden">
          {teams.map((t, idx) => {
            const { score, delta } = scoreFromId(t.id);
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
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-sm font-semibold text-gray-900 tabular-nums">
                    {score}
                  </div>
                  <div className="text-xs text-gray-600 tabular-nums">
                    +{delta}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardCard>
  );
}

