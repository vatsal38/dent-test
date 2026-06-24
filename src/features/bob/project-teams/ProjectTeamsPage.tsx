"use client";

import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/design-system/patterns/PageHeader";
import { Skeleton } from "@/components/Skeleton";
import { parseApiError } from "@/platform/api/errors";
import {
  useBobProjectTeamsList,
  useSyncBobProjectTeams,
} from "@/platform/query/hooks/useBobProjectTeams";
import { useBobAccess } from "@/platform/rbac/useBobAccess";
import { formatBobTrackDisplayLabel } from "@/lib/bobDisplayTerminology";

export function ProjectTeamsPage() {
  const { can } = useBobAccess();
  const teamsQuery = useBobProjectTeamsList();
  const syncMutation = useSyncBobProjectTeams();
  const [syncError, setSyncError] = useState<string | null>(null);

  const teams = teamsQuery.data?.data ?? [];
  const loading = teamsQuery.isLoading;
  const error = teamsQuery.error ? parseApiError(teamsQuery.error) : null;

  async function handleSync() {
    setSyncError(null);
    try {
      await syncMutation.mutateAsync();
      await teamsQuery.refetch();
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : "Sync failed");
    }
  }

  if (loading) {
    return (
      <div>
        <PageHeader
          title="Project teams"
          description="FY26 venture teams linked to deliverables."
        />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Deliverables"
        title="Project teams"
        description="Teams and members synced from the program roster. Deliverable review status rolls up by team on the dashboard and deliverables hub."
        actions={
          can("settings.manage") ? (
            <button
              type="button"
              onClick={() => void handleSync()}
              disabled={syncMutation.isPending}
              className="px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 disabled:opacity-50"
            >
              {syncMutation.isPending ? "Syncing…" : "Sync from Airtable"}
            </button>
          ) : null
        }
      />

      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      ) : null}
      {syncError ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {syncError}
        </div>
      ) : null}

      {teamsQuery.data?.syncedAt ? (
        <p className="text-xs text-gray-500 -mt-4">
          Last synced {new Date(teamsQuery.data.syncedAt).toLocaleString()}
        </p>
      ) : null}

      {teams.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center">
          <p className="text-gray-700 font-medium">No project teams synced yet</p>
          <p className="text-sm text-gray-500 mt-1">
            {can("settings.manage")
              ? "Use Sync from Airtable above to load teams and members."
              : "Ask an admin to sync project teams from Airtable."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {teams.map((team) => (
            <article
              key={team.id}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {team.name}
                  </h2>
                  {team.trackLabel ? (
                    <p className="text-sm text-gray-500 mt-0.5">
                      {formatBobTrackDisplayLabel(team.trackLabel)}
                    </p>
                  ) : null}
                </div>
                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  {team.memberCount} member{team.memberCount === 1 ? "" : "s"}
                </span>
              </div>
              {team.members.length > 0 ? (
                <ul className="mt-4 space-y-1 text-sm text-gray-700">
                  {team.members.map((m) => (
                    <li key={m.airtableRecordId}>
                      {m.studentId ? (
                        <Link
                          href={`/app/bob/roster/${m.studentId}`}
                          className="text-orange-600 hover:underline"
                        >
                          {m.name}
                        </Link>
                      ) : (
                        <span>{m.name}</span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-gray-500">
                  {team.memberCount > 0
                    ? `${team.memberCount} linked in Airtable — import roster to show names`
                    : "No members linked"}
                </p>
              )}
              <Link
                href={`/app/bob/deliverables?tab=by_team&team=${encodeURIComponent(team.name)}`}
                className="inline-block mt-4 text-sm font-medium text-orange-600 hover:underline"
              >
                View team deliverables →
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
