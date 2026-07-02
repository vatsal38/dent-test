"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/design-system/patterns/PageHeader";
import { Skeleton } from "@/components/Skeleton";
import { useBobDashboard } from "@/platform/query/hooks/useBobDashboard";
import { BlitzLeaderboardTable } from "./BlitzLeaderboardTable";

type BlitzTab = "global" | "track";

export function BlitzLeaderboardPage() {
  const [tab, setTab] = useState<BlitzTab>("global");
  const { data, isLoading, error } = useBobDashboard({
    level: "organization",
    label: "Program",
  });

  const globalTeams = data?.blitzTeams ?? [];
  const trackTeams = data?.blitzTrackTeams ?? [];
  const teams = tab === "global" ? globalTeams : trackTeams;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <PageHeader
        eyebrow="Bet on Baltimore"
        title="Blitz points"
        description="Program-wide color teams and track squads. Track awards roll up to global colors automatically."
        actions={
          <Link
            href="/app/bob/submit?type=blitz_points"
            className="px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600"
          >
            Award points
          </Link>
        }
      />

      <div className="flex gap-1 p-0.5 bg-amber-100/80 rounded-lg w-fit">
        <button
          type="button"
          onClick={() => setTab("global")}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
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
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            tab === "track"
              ? "bg-white text-amber-900 shadow-sm"
              : "text-amber-800 hover:text-amber-950"
          }`}
        >
          Track teams
        </button>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 sm:p-5">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-3/4" />
          </div>
        ) : error ? (
          <p className="text-sm text-red-700">Could not load blitz standings.</p>
        ) : teams.length === 0 ? (
          <p className="text-sm text-gray-600">
            No {tab === "global" ? "global color" : "track"} teams yet. Assign
            Blitz squads on the roster to populate standings.
          </p>
        ) : (
          <BlitzLeaderboardTable teams={teams} />
        )}
        <p className="text-xs text-gray-500 mt-4">
          {tab === "global"
            ? "Includes rollups from track team awards and auto attendance points."
            : "Color + track combinations. Weekly column uses the current program week."}
        </p>
      </div>
    </div>
  );
}
