"use client";

import Link from "next/link";
import { useMemo } from "react";
import { PageHeader } from "@/design-system/patterns/PageHeader";
import { buildStaffRows } from "@/features/bob/staff/buildStaffRows";
import { useBobPodsList } from "@/platform/query/hooks/useBobPods";
import { useBobStudentsList } from "@/platform/query/hooks/useBobStudents";
import { PageHeaderSkeleton } from "@/design-system/patterns/PageHeaderSkeleton";
import { Skeleton } from "@/components/Skeleton";
import { parseApiError } from "@/platform/api/errors";
import { BOB_POD_PLURAL, BOB_SITE_SUPPORTER } from "@/lib/bobDisplayTerminology";

export function StaffPage() {
  const podsQuery = useBobPodsList({ limit: 200 });
  const studentsQuery = useBobStudentsList({ limit: 500, includeStats: false });

  const loading = podsQuery.isLoading || studentsQuery.isLoading;
  const error = podsQuery.error ?? studentsQuery.error;

  const staffRows = useMemo(() => {
    if (!podsQuery.data || !studentsQuery.data) return [];
    return buildStaffRows(podsQuery.data.pods, studentsQuery.data.students);
  }, [podsQuery.data, studentsQuery.data]);

  const podMap = useMemo(
    () => new Map((podsQuery.data?.pods ?? []).map((p) => [p.id, p])),
    [podsQuery.data?.pods],
  );

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
                  <td className="px-4 py-3"><Skeleton className="h-4 w-10" /></td>
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
        description="View staff assignments and who is assigned to which pods and students."
        actions={
          <>
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

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {staffRows.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No staff found. Assign coaches on pods or set coach names on students.
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
                    Role(s)
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {BOB_POD_PLURAL} (coach)
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {BOB_POD_PLURAL} ({BOB_SITE_SUPPORTER.toLowerCase()})
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Students
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {staffRows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-gray-900">
                        {row.label}
                      </span>
                      {row.id.startsWith("name:") && (
                        <span className="ml-1 text-xs text-gray-400">
                          (from roster)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {row.roles.map((r) => (
                          <span
                            key={r}
                            className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-orange-100 text-orange-800"
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {row.podIdsAsCoach.length === 0
                        ? "—"
                        : row.podIdsAsCoach.map((pid) => {
                            const pod = podMap.get(pid);
                            return pod ? (
                              <Link
                                key={pid}
                                href={`/app/bob/pods/${pid}`}
                                className="text-orange-600 hover:underline block"
                              >
                                {pod.name}
                              </Link>
                            ) : (
                              <span key={pid}>{pid}</span>
                            );
                          })}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {row.podIdsAsSiteSupporter.length === 0
                        ? "—"
                        : row.podIdsAsSiteSupporter.map((pid) => {
                            const pod = podMap.get(pid);
                            return pod ? (
                              <Link
                                key={pid}
                                href={`/app/bob/pods/${pid}`}
                                className="text-orange-600 hover:underline block"
                              >
                                {pod.name}
                              </Link>
                            ) : (
                              <span key={pid}>{pid}</span>
                            );
                          })}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {row.studentIds.length === 0
                        ? "—"
                        : `${row.studentIds.length} student(s)`}
                      {row.studentIds.length > 0 && (
                        <Link
                          href="/app/bob/roster"
                          className="ml-1 text-orange-600 hover:underline text-xs"
                        >
                          View roster →
                        </Link>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {row.podIdsAsCoach.length > 0 ||
                      row.podIdsAsSiteSupporter.length > 0 ? (
                        <Link
                          href={
                            row.podIdsAsCoach[0]
                              ? `/app/bob/pods/${row.podIdsAsCoach[0]}`
                              : `/app/bob/pods/${row.podIdsAsSiteSupporter[0]}`
                          }
                          className="text-sm text-orange-600 hover:underline"
                        >
                          Edit track
                        </Link>
                      ) : (
                        <Link
                          href="/app/bob/roster"
                          className="text-sm text-orange-600 hover:underline"
                        >
                          Roster
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
