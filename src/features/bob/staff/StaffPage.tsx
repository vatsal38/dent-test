"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { PageHeader } from "@/design-system/patterns/PageHeader";
import { useBobStaffRoster } from "@/platform/query/hooks/useBobStaffRoster";
import { PageHeaderSkeleton } from "@/design-system/patterns/PageHeaderSkeleton";
import { Skeleton } from "@/components/Skeleton";
import { parseApiError } from "@/platform/api/errors";
import { BOB_POD_PLURAL, BOB_SITE_SUPPORTER } from "@/lib/bobDisplayTerminology";
import { useBobAccess } from "@/platform/rbac/useBobAccess";
import { syncBobStaffRoster } from "@/platform/api/bob/staff";
import { useQueryClient } from "@tanstack/react-query";
import { bobKeys } from "@/platform/query/queryKeys";

function roleBadgeClass(dentosRole: string) {
  const r = dentosRole.toLowerCase();
  if (r.includes("admin")) return "bg-slate-100 text-slate-800";
  if (r.includes("coach")) return "bg-orange-100 text-orange-800";
  return "bg-amber-50 text-amber-900";
}

export function StaffPage() {
  const searchParams = useSearchParams();
  const highlightStaffId = searchParams?.get("staffId") || "";
  const rosterQuery = useBobStaffRoster();
  const { can } = useBobAccess();
  const queryClient = useQueryClient();
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const loading = rosterQuery.isLoading;
  const error = rosterQuery.error;
  const staffRows = rosterQuery.data?.staff ?? [];

  const lastSyncedAt = rosterQuery.data?.lastSyncedAt;

  const formattedSync = useMemo(() => {
    if (!lastSyncedAt) return null;
    const d = new Date(lastSyncedAt);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleString();
  }, [lastSyncedAt]);

  async function handleStaffSync() {
    setSyncing(true);
    setSyncError(null);
    try {
      await syncBobStaffRoster();
      await queryClient.invalidateQueries({ queryKey: bobKeys.staff.roster() });
      await queryClient.invalidateQueries({ queryKey: bobKeys.pods.all() });
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : "Staff sync failed");
    } finally {
      setSyncing(false);
    }
  }

  if (loading) {
    return (
      <div>
        <PageHeaderSkeleton actionCount={2} />
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {Array.from({ length: 6 }).map((_, i) => (
                  <th key={i} className="px-4 py-3">
                    <Skeleton className="h-3 w-16" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-5 w-16 rounded-full" rounded="full" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-14 ml-auto" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {parseApiError(error)}
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Staff & coach roster"
        description={
          formattedSync
            ? `Roles and track assignments from the BoB '26 staff roster (last synced ${formattedSync}). Fellows and Site Supporters both use Site Supporter access in DentOS.`
            : "Roles and track assignments from the BoB '26 staff roster. Run Staff roster sync in Settings after updating Airtable."
        }
        actions={
          <>
            {can("settings.manage") ? (
              <button
                type="button"
                onClick={() => void handleStaffSync()}
                disabled={syncing}
                className="px-4 py-2 rounded-lg border border-orange-300 bg-orange-50 text-orange-800 hover:bg-orange-100 text-sm font-medium disabled:opacity-50"
              >
                {syncing ? "Syncing…" : "Sync staff roster"}
              </button>
            ) : null}
            <Link
              href="/app/bob/pods"
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium"
            >
              {BOB_POD_PLURAL}
            </Link>
            <Link
              href="/app/bob/roster"
              className="px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 text-sm font-medium"
            >
              Roster
            </Link>
          </>
        }
      />

      {syncError ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {syncError}
        </div>
      ) : null}

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {staffRows.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No staff found. Sync the BoB staff roster from Settings → Airtable sync.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Staff
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    DentOS role
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Airtable role(s)
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {BOB_POD_PLURAL} (coach)
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {BOB_POD_PLURAL} ({BOB_SITE_SUPPORTER.toLowerCase()})
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {staffRows.map((row) => {
                  const highlighted =
                    highlightStaffId &&
                    (row.id === highlightStaffId || row.email === highlightStaffId);
                  return (
                    <tr
                      key={row.id}
                      id={row.id.startsWith("email:") ? undefined : row.id}
                      className={
                        highlighted
                          ? "bg-orange-50/60 ring-1 ring-inset ring-orange-200"
                          : "hover:bg-gray-50"
                      }
                    >
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-gray-900">
                          {row.name}
                        </span>
                        <p className="text-xs text-gray-500">{row.email}</p>
                        {!row.hasAccount ? (
                          <p className="text-[10px] text-amber-700 mt-0.5">
                            Not signed in yet
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${roleBadgeClass(row.dentosRole)}`}
                        >
                          {row.dentosRole}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {row.airtableCurrentRoles.length
                          ? row.airtableCurrentRoles.join(", ")
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {row.tracksAsCoach.length === 0
                          ? "—"
                          : row.tracksAsCoach.map((track) => (
                              <Link
                                key={track.id}
                                href={`/app/bob/pods/${track.id}`}
                                className="text-orange-600 hover:underline block"
                              >
                                {track.name}
                              </Link>
                            ))}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {row.tracksAsSiteSupporter.length === 0
                          ? "—"
                          : row.tracksAsSiteSupporter.map((track) => (
                              <Link
                                key={track.id}
                                href={`/app/bob/pods/${track.id}`}
                                className="text-orange-600 hover:underline block"
                              >
                                {track.name}
                              </Link>
                            ))}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {row.tracksAsCoach[0] ? (
                          <Link
                            href={`/app/bob/pods/${row.tracksAsCoach[0].id}`}
                            className="text-sm text-orange-600 hover:underline"
                          >
                            Edit track
                          </Link>
                        ) : row.tracksAsSiteSupporter[0] ? (
                          <Link
                            href={`/app/bob/pods/${row.tracksAsSiteSupporter[0].id}`}
                            className="text-sm text-orange-600 hover:underline"
                          >
                            Edit track
                          </Link>
                        ) : (
                          <Link
                            href="/app/bob/settings"
                            className="text-sm text-gray-500 hover:underline"
                          >
                            Sync roster
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
