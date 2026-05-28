"use client";

import Link from "next/link";
import { useMemo } from "react";
import { PageHeader } from "@/design-system/patterns/PageHeader";
import { useBobPodsList } from "@/platform/query/hooks/useBobPods";
import { useBobAccess } from "@/platform/rbac/useBobAccess";
import { BobPermissionGuard } from "@/platform/rbac/BobPermissionGuard";
import { ScopedEmptyState } from "@/platform/rbac/ScopedEmptyState";
import { Skeleton } from "@/components/Skeleton";
import { parseApiError } from "@/platform/api/errors";
import { useBobStaffList } from "../../../platform/query/hooks/useBobStaff";
import { resolveStaffLabel } from "./staffDisplay";

export function PodsListPage() {
  const { access, can } = useBobAccess();
  const { data, isLoading, error } = useBobPodsList({ limit: 100, offset: 0 });
  const staffQuery = useBobStaffList();

  const staff = staffQuery.data?.staff ?? [];
  const resolve = useMemo(
    () => (ref: string | null | undefined) => resolveStaffLabel(staff, ref),
    [staff],
  );

  if (isLoading) {
    return (
      <div>
        <PageHeader
          title="Pods"
          description="Manage pods and assign students."
        />
        <Skeleton className="h-64 w-full rounded-lg" />
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

  const pods = data?.pods ?? [];

  return (
    <div>
      <PageHeader
        title="Pods"
        description="Create pods in Dent, assign coach and site supporter, then add students."
        actions={
          <>
            <Link
              href="/app/bob/my-pod"
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium"
            >
              My Pod
            </Link>
            <BobPermissionGuard permission="pods.create" silent>
              <Link
                href="/app/bob/pods/new"
                className="px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 text-sm font-medium"
              >
                Create pod
              </Link>
            </BobPermissionGuard>
          </>
        }
      />

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {pods.length === 0 ? (
          <div className="p-8 text-center">
            <ScopedEmptyState
              access={access}
              resource="pods"
              actionHref={can("pods.create") ? "/app/bob/pods/new" : undefined}
              actionLabel={can("pods.create") ? "Create pod" : undefined}
            />
            <p className="mt-3 text-sm text-gray-500 max-w-md mx-auto">
              No pods yet. Create a pod, assign coach and site supporter from
              your staff directory, then add students from the roster.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Site
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Coach
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Site supporter
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
                        {p.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {p.site || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {resolve(p.coachId)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {resolve(p.siteSupporterId)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {p.students?.length ?? 0}
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
      {data && data.total > 0 && (
        <p className="mt-2 text-sm text-gray-500">
          Showing {pods.length} of {data.total}
        </p>
      )}
    </div>
  );
}
