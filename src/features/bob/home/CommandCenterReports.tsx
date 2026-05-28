"use client";

import Link from "next/link";
import type { BobCommandCenterStats } from "@/platform/api/bob/stats";
import {
  HiOutlineChartBar,
  HiOutlineClipboardCheck,
  HiOutlineExclamationCircle,
  HiOutlineUserGroup,
} from "react-icons/hi";
import { KpiGrid } from "@/design-system/patterns/KpiGrid";
import { commandCenterToKpis } from "@/features/bob/home/commandCenterKpis";
import { Skeleton } from "@/components/Skeleton";
import { BobPermissionGuard } from "@/platform/rbac/BobPermissionGuard";

type Props = {
  stats: BobCommandCenterStats | undefined;
  loading: boolean;
};

export function CommandCenterReports({ stats, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-4 w-40" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <BobPermissionGuard
      permission="dashboard.reports"
      fallback={
        <p className="text-sm text-gray-600">
          Program reports are available to admins and program managers.
        </p>
      }
    >
    <div className="space-y-6">
      <section>
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
          <HiOutlineChartBar className="w-4 h-4" />
          Program overview
        </h2>
        <KpiGrid items={commandCenterToKpis(stats)} />
      </section>

      <section>
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
          Attendance by site
        </h2>
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {stats.attendanceBySite.length === 0 ? (
            <p className="p-6 text-gray-500 text-sm">No site data</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {stats.attendanceBySite.map((site) => {
                const total =
                  site.present + site.absent + site.excused + site.late || 1;
                const pct = total
                  ? Math.round((site.present / total) * 100)
                  : 0;
                return (
                  <div
                    key={site.siteId}
                    className="px-6 py-4 flex items-center gap-4"
                  >
                    <div className="min-w-[140px] font-medium text-gray-900">
                      {site.siteName}
                    </div>
                    <div className="flex-1 max-w-xs">
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-orange-500 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 whitespace-nowrap">
                      {site.present}/{total} present ({pct}%)
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
            <Link
              href="/app/bob/attendance"
              className="text-sm font-medium text-orange-600 hover:underline"
            >
              Full attendance grid →
            </Link>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
          <HiOutlineUserGroup className="w-4 h-4" />
          Milestone submission by track
        </h2>
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {stats.milestoneSubmissionByTrack.length === 0 ? (
            <p className="p-6 text-gray-500 text-sm">No track data</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {stats.milestoneSubmissionByTrack.map((t) => {
                const pct = t.total
                  ? Math.round((t.submitted / t.total) * 100)
                  : 0;
                return (
                  <div
                    key={t.track}
                    className="px-6 py-4 flex items-center gap-4"
                  >
                    <div className="min-w-[120px] font-medium text-gray-900">
                      {t.track}
                    </div>
                    <div className="flex-1 max-w-xs">
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-orange-500 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      {t.submitted}/{t.total} ({pct}%)
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
            <Link
              href="/app/bob/milestones"
              className="text-sm font-medium text-orange-600 hover:underline"
            >
              Milestones admin →
            </Link>
          </div>
        </div>
      </section>

      {stats.atRiskStudents.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
            <HiOutlineExclamationCircle className="w-4 h-4 text-amber-500" />
            At-risk students
          </h2>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <ul className="space-y-2">
              {stats.atRiskStudents.slice(0, 10).map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between text-sm gap-4"
                >
                  <span className="text-gray-900">
                    {s.firstName} {s.lastName}
                  </span>
                  <span className="text-gray-500">{s.status}</span>
                  <Link
                    href={`/app/bob/roster?id=${s.id}`}
                    className="text-orange-600 hover:underline shrink-0"
                  >
                    View →
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              href="/app/bob/roster"
              className="mt-3 inline-block text-sm font-medium text-orange-600 hover:underline"
            >
              Full roster →
            </Link>
          </div>
        </section>
      )}

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
          <HiOutlineClipboardCheck className="w-4 h-4 text-orange-500" />
          Discrepancies
        </p>
        <p className="text-2xl font-bold text-gray-900">
          {stats.cards.openDiscrepancies}
        </p>
        <Link
          href="/app/bob/attendance/discrepancies"
          className="text-sm text-orange-600 hover:underline mt-1 inline-block"
        >
          View discrepancies →
        </Link>
      </section>
    </div>
    </BobPermissionGuard>
  );
}
