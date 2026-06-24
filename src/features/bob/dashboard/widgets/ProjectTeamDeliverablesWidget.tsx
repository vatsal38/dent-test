"use client";

import Link from "next/link";
import { DashboardCard } from "../primitives/DashboardCard";
import { DashboardEmpty } from "../primitives/DashboardEmpty";
import { DashboardWidgetSkeleton } from "../primitives/DashboardWidgetSkeleton";
import type { WidgetRenderProps } from "../types";

function statusCell(value: number) {
  if (!value) {
    return <span className="text-gray-300 tabular-nums">—</span>;
  }
  return (
    <span className="tabular-nums text-gray-900 font-medium">{value}</span>
  );
}

export function ProjectTeamDeliverablesWidget({
  snapshot,
  loading,
  isRefreshing,
  placement,
}: WidgetRenderProps) {
  const title = placement.title ?? "Deliverable review by project team";

  if (loading) {
    return <DashboardWidgetSkeleton variant="table" titleWidth="w-48" />;
  }

  const teams = snapshot?.deliverableReviewByProjectTeam ?? [];
  const pendingTotal = teams.reduce((sum, t) => sum + t.pendingReview, 0);

  return (
    <DashboardCard
      title={title}
      refreshing={isRefreshing}
      action={
        <Link
          href="/app/bob/deliverables"
          className="text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          Open deliverables hub →
        </Link>
      }
    >
      {teams.length === 0 ? (
        <DashboardEmpty
          message="No project team deliverables synced yet. Import deliverables from Airtable."
          actionLabel="Deliverables hub"
          actionHref="/app/bob/deliverables"
        />
      ) : (
        <>
          {pendingTotal > 0 ? (
            <p className="text-sm text-orange-700 font-medium -mt-1 mb-3">
              {pendingTotal} deliverable
              {pendingTotal === 1 ? "" : "s"} awaiting review across teams
            </p>
          ) : (
            <p className="text-sm text-gray-600 -mt-1 mb-3">
              Review status from the Deliverables by Project tracker
            </p>
          )}
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase tracking-wide">
                  <th className="pb-2 pr-3 font-medium">Project team</th>
                  <th className="pb-2 px-2 font-medium text-right">Pending</th>
                  <th className="pb-2 px-2 font-medium text-right">
                    In progress
                  </th>
                  <th className="pb-2 px-2 font-medium text-right">Approved</th>
                  <th className="pb-2 pl-2 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {teams.map((team) => (
                  <tr key={team.teamName}>
                    <td className="py-2 pr-3 font-medium text-gray-900">
                      <Link
                        href={`/app/bob/deliverables?tab=by_team&team=${encodeURIComponent(team.teamName)}`}
                        className="hover:text-orange-600"
                      >
                        {team.teamName}
                      </Link>
                    </td>
                    <td className="py-2 px-2 text-right">
                      {statusCell(team.pendingReview)}
                    </td>
                    <td className="py-2 px-2 text-right">
                      {statusCell(team.inProgress)}
                    </td>
                    <td className="py-2 px-2 text-right">
                      {statusCell(team.approved)}
                    </td>
                    <td className="py-2 pl-2 text-right tabular-nums text-gray-600">
                      {team.total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </DashboardCard>
  );
}
