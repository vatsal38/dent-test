"use client";

import Link from "next/link";
import { DashboardCard } from "../primitives/DashboardCard";
import { DashboardEmpty } from "../primitives/DashboardEmpty";
import { DashboardWidgetSkeleton } from "../primitives/DashboardWidgetSkeleton";
import type { WidgetRenderProps } from "../types";
import { useMyBobProjectTeams } from "@/platform/query/hooks/useBobProjectTeams";

export function MyProjectTeamWidget({
  loading: dashboardLoading,
  isRefreshing,
  placement,
}: WidgetRenderProps) {
  const title = placement.title ?? "My project team";
  const { data, isLoading } = useMyBobProjectTeams(true);
  const teams = data?.data ?? [];

  if (dashboardLoading || isLoading) {
    return <DashboardWidgetSkeleton variant="list" titleWidth="w-36" />;
  }

  return (
    <DashboardCard
      title={title}
      refreshing={isRefreshing}
      action={
        <Link
          href="/app/bob/deliverables"
          className="text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          View deliverables →
        </Link>
      }
    >
      {teams.length === 0 ? (
        <DashboardEmpty
          message="Your project team will appear here once assigned in the roster."
          actionLabel="Deliverables"
          actionHref="/app/bob/deliverables"
        />
      ) : (
        <div className="space-y-4">
          {teams.map((team) => (
            <div
              key={team.id}
              className="rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-3"
            >
              <p className="font-semibold text-gray-900">{team.name}</p>
              {team.trackLabel ? (
                <p className="mt-0.5 text-sm text-gray-500">{team.trackLabel}</p>
              ) : null}
              <p className="mt-2 text-sm text-gray-600">
                {team.memberCount} teammate{team.memberCount === 1 ? "" : "s"}
              </p>
              {team.members.length > 0 ? (
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {team.members.map((member) => (
                    <li
                      key={member.airtableRecordId}
                      className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-gray-700 ring-1 ring-gray-200"
                    >
                      {member.name}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </DashboardCard>
  );
}
