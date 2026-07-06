"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/design-system/patterns/PageHeader";
import { Skeleton } from "@/components/Skeleton";
import { useBobDashboard } from "@/platform/query/hooks/useBobDashboard";
import { BlitzLeaderboardTable } from "./BlitzLeaderboardTable";
import { BlitzPointsBarChart } from "./BlitzPointsBarChart";
import { BlitzPointsLog } from "./BlitzPointsLog";

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
        description="Global color teams and track squads from the roster. Track auto-points roll up to global colors."
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
          Global teams
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

      <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 sm:p-5 space-y-5">
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
            No {tab === "global" ? "global" : "track"} teams yet. Assign BoB
            &apos;26 Blitz Squad on the roster to populate track teams.
          </p>
        ) : (
          <>
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-amber-900/80 mb-3">
                Points chart
              </h2>
              <BlitzPointsBarChart teams={teams} metric="overall" />
            </div>
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-amber-900/80 mb-3">
                Leaderboard
              </h2>
              <BlitzLeaderboardTable teams={teams} />
            </div>
          </>
        )}
        <p className="text-xs text-gray-500">
          {tab === "global"
            ? "Global totals include manual awards and rollups from track teams. Auto attendance points are track-only."
            : "Track teams match BoB '26 Blitz Squad assignments on the roster when synced from Airtable."}
        </p>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-1">
          Points activity log
        </h2>
        <p className="text-xs text-gray-500 mb-4">
          Every award with reason — manual, automatic, and global rollups. Use
          this to audit why a team gained points.
        </p>
        <BlitzPointsLog />
      </section>

      <p className="text-xs text-gray-500">
        Blitz squad assignments live on the{" "}
        <Link href="/app/bob/roster" className="text-orange-600 hover:underline">
          student roster
        </Link>{" "}
        (BoB &apos;26 Blitz Squad). Staff roster links are on the{" "}
        <Link href="/app/bob/staff" className="text-orange-600 hover:underline">
          staff page
        </Link>
        .
      </p>
    </div>
  );
}
