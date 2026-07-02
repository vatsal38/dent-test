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
          Global colors
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
          title={tab === "global" ? "No global blitz teams" : "No track blitz teams"}
          message="Assign Blitz Squad on Students & Alums to see teams here."
        />
      ) : (
        <BlitzLeaderboardTable teams={teams} />
      )}
      <p className="text-xs text-gray-500 mt-3">
        {tab === "global"
          ? "Program-wide color teams. Track awards roll up here automatically."
          : "Color + track combinations (Dentership, Bootcamp, AYD). Weekly totals use the current program week."}
      </p>
    </DashboardCard>
  );
}
