"use client";

import { useStudentDrawerContext } from "../../context/StudentDrawerContext";
import { useStudentActivityFeed } from "../../hooks/useStudentTabQueries";
import { ActivityTimeline } from "../../widgets/ActivityTimeline";
import { ActivityTabSkeleton } from "../../widgets/TabPanelSkeleton";

export function ActivityTab() {
  const { student, tab } = useStudentDrawerContext();
  const { items, isLoading, refetch } = useStudentActivityFeed(
    student?.id ?? null,
    tab,
    student?.podId,
  );

  if (!student) return null;
  if (isLoading) return <ActivityTabSkeleton />;

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-600">
          Unified operational timeline — attendance, submissions, deliverables.
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="text-xs font-medium text-orange-600 hover:underline"
        >
          Refresh
        </button>
      </div>
      <ActivityTimeline items={items} />
    </div>
  );
}
