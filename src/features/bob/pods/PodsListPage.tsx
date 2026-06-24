"use client";

import Link from "next/link";
import { useMemo } from "react";
import { PageHeader } from "@/design-system/patterns/PageHeader";
import { BobImportProgress } from "@/components/BobImportProgress";
import { useBobPodsList } from "@/platform/query/hooks/useBobPods";
import { useBobAccess } from "@/platform/rbac/useBobAccess";
import { BobPermissionGuard } from "@/platform/rbac/BobPermissionGuard";
import { ScopedEmptyState } from "@/platform/rbac/ScopedEmptyState";
import { Skeleton } from "@/components/Skeleton";
import { parseApiError } from "@/platform/api/errors";
import { useBobStaffList } from "../../../platform/query/hooks/useBobStaff";
import { resolveStaffLabel, podCoachIds, resolveStaffLabels } from "./staffDisplay";
import { BobActionButton } from "@/features/bob/ui/BobActionButton";
import { FiPlus, FiUsers } from "react-icons/fi";
import {
  getBobPodsImportStatus,
  startBobPodsImport,
} from "@/platform/api/bob/pods";
import {
  BOB_MY_POD,
  BOB_POD_PLURAL,
  BOB_POD_SINGULAR,
  BOB_SITE_SUPPORTER,
  formatBobTrackDisplayLabel,
} from "@/lib/bobDisplayTerminology";

export function PodsListPage() {
  const { access, can } = useBobAccess();
  const podsQuery = useBobPodsList({ limit: 100, offset: 0 });
  const staffQuery = useBobStaffList();

  const staff = staffQuery.data?.staff ?? [];
  const resolve = useMemo(
    () => (ref: string | null | undefined) => resolveStaffLabel(staff, ref),
    [staff],
  );

  if (podsQuery.isLoading) {
    return (
      <div>
        <PageHeader
          title={BOB_POD_PLURAL}
          description="FY26 program pods from Airtable Programs."
        />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (podsQuery.error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {parseApiError(podsQuery.error)}
      </div>
    );
  }

  const pods = podsQuery.data?.pods ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={BOB_POD_PLURAL}
        description={`${BOB_POD_PLURAL} sync with Airtable Programs. Create new tracks here or re-import to refresh from Airtable.`}
        actions={
          <>
            <BobActionButton
              href="/app/bob/my-pod"
              label={BOB_MY_POD}
              icon={<FiUsers />}
              variant="outline"
            />
            <BobPermissionGuard permission="pods.create" silent>
              <BobActionButton
                href="/app/bob/pods/new"
                label={`Create ${BOB_POD_SINGULAR.toLowerCase()}`}
                icon={<FiPlus />}
                variant="primary"
              />
            </BobPermissionGuard>
          </>
        }
      />

      <BobPermissionGuard permission="pods.create" silent>
        <section className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-600 mb-3">
            Sync from the{" "}
            <a
              href="https://airtable.com/appjDzuL6WUmrcZ5d/tblDzhEwzjy0F8KQT/viw81hftI7DSiVraa"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-600 hover:underline"
            >
              Programs
            </a>{" "}
            table. Re-import updates metadata; tracks created in Dent stay linked
            via Airtable.
          </p>
          <BobImportProgress
            label="tracks"
            fetchStatus={getBobPodsImportStatus}
            startImport={startBobPodsImport}
            onComplete={() => {
              void podsQuery.refetch();
            }}
          />
        </section>
      </BobPermissionGuard>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {pods.length === 0 ? (
          <div className="p-8 text-center">
            <ScopedEmptyState
              access={access}
              resource="tracks"
              actionHref={can("pods.create") ? "/app/bob/pods/new" : undefined}
              actionLabel={can("pods.create") ? `Create ${BOB_POD_SINGULAR.toLowerCase()}` : undefined}
            />
            <p className="mt-3 text-sm text-gray-500 max-w-md mx-auto">
              No tracks yet. Create a track or import from Airtable Programs.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Track
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Program year
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Site
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Coaches
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {BOB_SITE_SUPPORTER}
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
                {pods.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/app/bob/pods/${p.id}`}
                        className="text-sm font-medium text-orange-600 hover:underline"
                      >
                        {formatBobTrackDisplayLabel(
                          p.displayLabel || p.name,
                        )}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {p.programYear || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {p.site || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {resolveStaffLabels(staff, podCoachIds(p))}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {resolve(p.siteSupporterId)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 tabular-nums">
                      {p.students?.length ??
                        p.airtableStudentCount ??
                        "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/app/bob/pods/${p.id}`}
                        className="text-sm text-orange-600 hover:underline"
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {podsQuery.data && podsQuery.data.total > 0 ? (
        <p className="text-sm text-gray-500">
          Showing {pods.length} of {podsQuery.data.total}
        </p>
      ) : null}
    </div>
  );
}
