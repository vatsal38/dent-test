"use client";

import Link from "next/link";
import { PageHeader } from "@/design-system/patterns/PageHeader";
import { DashboardEngine } from "@/features/bob/dashboard";
import { useBobAirtableSync } from "@/platform/query/hooks/useBobAirtableStatus";
import { useBobAccess } from "@/platform/rbac/useBobAccess";
import { bobRoleLabel } from "@/platform/rbac/roles";
import { BobPermissionGuard } from "@/platform/rbac/BobPermissionGuard";

export function BobCommandCenterPage() {
  const { data: me, role, caps, access } = useBobAccess();
  const syncMutation = useBobAirtableSync();

  return (
    <div>
      <PageHeader
        eyebrow="Bet on Baltimore"
        title="Command Center"
        description={
          access.isScoped && me?.primaryPod
            ? `${bobRoleLabel(role)} · ${me.primaryPod.name}`
            : "Operational overview — what needs attention, who is blocked, what is late."
        }
        actions={
          <>
            <BobPermissionGuard permission="airtable.sync" silent>
              <button
                type="button"
                onClick={() => syncMutation.mutate()}
                disabled={syncMutation.isPending}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium flex items-center gap-2"
              >
                <svg
                  className={`w-4 h-4 ${syncMutation.isPending ? "animate-spin" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Sync Airtable
              </button>
            </BobPermissionGuard>
            <BobPermissionGuard permission="attendance.mark" silent>
              <Link
                href="/app/bob/attendance/mark"
                className="px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 text-sm font-medium"
              >
                Update attendance
              </Link>
            </BobPermissionGuard>
          </>
        }
      />

      {access.isScoped && access.role === "coach" && me?.primaryPod && (
        <div className="mb-6 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <p className="text-sm text-orange-900">
            Metrics below are scoped to{" "}
            <span className="font-semibold">{me.primaryPod.name}</span>.
          </p>
          <Link
            href="/app/bob/my-pod"
            className="text-sm font-medium text-orange-700 hover:text-orange-800"
          >
            Open My Track →
          </Link>
        </div>
      )}

      <BobPermissionGuard permission="dashboard.view">
        <DashboardEngine layoutId="command_center" />
      </BobPermissionGuard>
    </div>
  );
}
