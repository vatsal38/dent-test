"use client";

import Link from "next/link";
import {
  cardTitle,
  severityBadge,
  SUBMISSION_STATUS_LABELS,
  SUBMISSION_TYPE_LABELS,
} from "@/features/bob/submissions/display";
import { useStudentDrawerContext } from "../../context/StudentDrawerContext";
import { useStudentSubmissions } from "../../hooks/useStudentTabQueries";
import { IncidentsTabSkeleton } from "../../widgets/TabPanelSkeleton";

export function IncidentsTab() {
  const { student, tab } = useStudentDrawerContext();
  const { data: all = [], isLoading } = useStudentSubmissions(
    student?.id ?? null,
    tab,
  );

  const incidents = all.filter(
    (s) => s.type === "incident" || s.type === "wellness_check",
  );

  if (!student) return null;
  if (isLoading) return <IncidentsTabSkeleton />;

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Incidents and wellness checks for operational follow-up.
        </p>
        <Link
          href={`/app/bob/submit?type=incident&studentId=${encodeURIComponent(student.id)}`}
          className="text-xs font-semibold text-orange-600"
        >
          + Log new
        </Link>
      </div>

      <ul className="space-y-2">
        {incidents.length === 0 ? (
          <li className="text-sm text-gray-500 py-8 text-center rounded-xl border border-dashed">
            No incidents or wellness checks on record.
          </li>
        ) : (
          incidents.map((s) => (
            <li key={s.id}>
              <Link
                href={`/app/bob/inbox?id=${encodeURIComponent(s.id)}`}
                className="block rounded-xl border border-gray-200 p-3 hover:border-orange-300 hover:shadow-sm transition-all"
              >
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-xs font-medium text-gray-500">
                    {SUBMISSION_TYPE_LABELS[s.type]}
                  </span>
                  {s.severity ? (
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full border uppercase ${severityBadge(s.severity)}`}
                      title={`Severity: ${s.severity}`}
                    >
                      {s.severity}
                    </span>
                  ) : null}
                  <span className="text-xs text-gray-400 ml-auto">
                    {SUBMISSION_STATUS_LABELS[s.status]}
                  </span>
                </div>
                <p className="text-sm font-semibold text-gray-900 mt-1">
                  {cardTitle(s)}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {new Date(s.createdAt).toLocaleString()}
                </p>
              </Link>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
