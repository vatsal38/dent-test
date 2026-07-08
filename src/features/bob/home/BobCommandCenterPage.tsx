"use client";

import Link from "next/link";
import { PageHeader } from "@/design-system/patterns/PageHeader";
import { DashboardEngine } from "@/features/bob/dashboard";
import { resolveDashboardLayoutId } from "@/features/bob/dashboard/resolveDashboardLayout";
import { useBobAirtableSync } from "@/platform/query/hooks/useBobAirtableStatus";
import { useBobSyncDataRefresh } from "@/platform/query/hooks/useBobSyncDataRefresh";
import { useBobAccess } from "@/platform/rbac/useBobAccess";
import { bobRoleLabel } from "@/platform/rbac/roles";
import { BOB_POD_PLURAL, BOB_POD_SINGULAR } from "@/lib/bobDisplayTerminology";
import { BobPermissionGuard } from "@/platform/rbac/BobPermissionGuard";

export function BobCommandCenterPage() {
  const { data: me, role, caps, access } = useBobAccess();
  const syncMutation = useBobAirtableSync();
  useBobSyncDataRefresh();
  const layoutId = resolveDashboardLayoutId(role);
  const isTrackHome =
    layoutId === "coach_home" || layoutId === "site_supporter_home";
  const isStudentHome = layoutId === "student_ops";
  const isSiteSupporterHome = layoutId === "site_supporter_home";

  return (
    <div className="overflow-x-hidden">
      <PageHeader
        eyebrow="Bet on Baltimore"
        title={
          isStudentHome
            ? "My dashboard"
            : isSiteSupporterHome
              ? "Command Center"
              : isTrackHome
                ? `${BOB_POD_SINGULAR} dashboard`
                : "Command Center"
        }
        description={
          isStudentHome
            ? "Your attendance, deliverables, project team, and blitz points — personalized to your profile."
            : isSiteSupporterHome
              ? `${bobRoleLabel(role)} — oversee your assigned tracks (up to 2): attendance, deliverables, blitz points, roster, and incidents.`
              : isTrackHome && me?.primaryPod
                ? `${bobRoleLabel(role)} · ${me.primaryPod.name} — today's attendance, students who need you, and open incidents.`
                : isTrackHome
                  ? `${bobRoleLabel(role)} — scoped to your assigned ${BOB_POD_PLURAL.toLowerCase()}.`
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

      {isTrackHome && access.role === "coach" && me?.primaryPod ? (
        <div className="mb-6 rounded-xl border border-gray-200 bg-white px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <p className="text-sm text-gray-700">
            Prefer a simple student list? Open{" "}
            <span className="font-semibold">{me.primaryPod.name}</span> workspace.
          </p>
          <Link
            href="/app/bob/my-pod"
            className="text-sm font-medium text-orange-600 hover:text-orange-700"
          >
            Student list view →
          </Link>
        </div>
      ) : null}

      {isSiteSupporterHome && (me?.assignedPods?.length ?? 0) > 0 ? (
        <div className="mb-6 rounded-xl border border-gray-200 bg-white px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <p className="text-sm text-gray-700">
            Managing{" "}
            <span className="font-semibold">
              {me!.assignedPods!.map((p) => p.name).join(" · ")}
            </span>
            {me!.assignedPods!.length > 1
              ? ` — ${me!.assignedPods!.length} tracks`
              : ""}
          </p>
          <Link
            href="/app/bob/pods"
            className="text-sm font-medium text-orange-600 hover:text-orange-700"
          >
            Open tracks →
          </Link>
        </div>
      ) : null}

      <BobPermissionGuard permission="dashboard.view">
        <DashboardEngine layoutId={layoutId} />
      </BobPermissionGuard>
    </div>
  );
}
