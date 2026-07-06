"use client";

import { useState } from "react";
import Link from "next/link";
import { BlitzLeaderboardTable } from "@/features/bob/blitz/BlitzLeaderboardTable";
import { DashboardCard } from "../primitives/DashboardCard";
import { DashboardEmpty } from "../primitives/DashboardEmpty";
import { DashboardWidgetSkeleton } from "../primitives/DashboardWidgetSkeleton";
import type { WidgetRenderProps } from "../types";

type BlitzTab = "global" | "track";

export function BlitzTeamsWidget({
  snapshot,
  loading,
  isRefreshing,
  placement,
}: WidgetRenderProps) {
  const title = placement.title ?? "Blitz teams";
  const [tab, setTab] = useState<BlitzTab>("global");
  if (loading) return <DashboardWidgetSkeleton variant="list" />;

  const globalTeams = snapshot?.blitzTeams ?? [];
  const trackTeams = snapshot?.blitzTrackTeams ?? [];
  const teams = tab === "global" ? globalTeams : trackTeams;

  return (
    <DashboardCard
      title={title}
      refreshing={isRefreshing}
      className="border-amber-200 bg-amber-50"
      action={
        <Link
          href="/app/bob/blitz"
          className="text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          Full leaderboard →
        </Link>
      }
    >
      <div className="flex gap-1 mb-3 p-0.5 bg-amber-100/80 rounded-lg w-fit">
        <button
          type="button"
          onClick={() => setTab("global")}
          className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
            tab === "global"
              ? "bg-white text-amber-900 shadow-sm"
              : "text-amber-800 hover:text-amber-950"
          }`}
        >
          Global teams
        </button>
        <button
          type="button"
          onClick={() => setTab("track")}
          className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
            tab === "track"
              ? "bg-white text-amber-900 shadow-sm"
              : "text-amber-800 hover:text-amber-950"
          }`}
        >
          Track teams
        </button>
      </div>

      {teams.length === 0 ? (
        <DashboardEmpty
          title={tab === "global" ? "No global teams" : "No track teams"}
          message="Assign BoB '26 Blitz Squad on the student roster to populate track teams."
        />
      ) : (
        <BlitzLeaderboardTable teams={teams} />
      )}
      <p className="text-xs text-gray-500 mt-3">
        {tab === "global"
          ? "Program-wide color teams. Track awards roll up here; auto points are track-only."
          : "Blitz squads from the roster (color + track). Falls back to color/track groups when squads are not synced."}
      </p>
    </DashboardCard>
  );
}
