"use client";

import Link from "next/link";
import { useStudentDrawerContext } from "../../context/StudentDrawerContext";
import { useStudentAttendanceHistory } from "../../hooks/useStudentTabQueries";
import { DetailCard, DetailCardGrid } from "../../widgets/DetailCard";
import { TabPanelSkeleton } from "../../widgets/TabPanelSkeleton";

const STATUS_STYLE: Record<string, string> = {
  present: "text-emerald-700 bg-emerald-50",
  absent: "text-rose-700 bg-rose-50",
  excused: "text-sky-700 bg-sky-50",
  late: "text-amber-700 bg-amber-50",
};

export function AttendanceTab() {
  const { student, tab } = useStudentDrawerContext();
  const { data, isLoading, isFetching } = useStudentAttendanceHistory(
    student?.id ?? null,
    student?.podId,
    tab,
  );

  if (!student) return null;
  if (isLoading) return <TabPanelSkeleton rows={5} />;

  const rows = [...(data?.attendance ?? [])].sort((a, b) =>
    (b.date || "").localeCompare(a.date || ""),
  );

  const counts = rows.reduce(
    (acc, r) => {
      const s = r.status || "unknown";
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className="p-5 space-y-5">
      <DetailCardGrid cols={3}>
        <DetailCard label="Present" value={counts.present ?? student.attendanceStats?.present ?? 0} />
        <DetailCard label="Absent" value={counts.absent ?? student.attendanceStats?.absent ?? 0} />
        <DetailCard label="Late" value={counts.late ?? 0} />
      </DetailCardGrid>

      <div className="flex justify-end">
        <Link
          href={`/app/bob/attendance/mark?podId=${encodeURIComponent(student.podId || "")}`}
          className="text-sm font-medium text-orange-600"
        >
          Open attendance workspace →
        </Link>
      </div>

      {isFetching && !isLoading ? (
        <p className="text-xs text-gray-400">Refreshing…</p>
      ) : null}

      <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 overflow-hidden">
        {rows.length === 0 ? (
          <li className="p-6 text-sm text-gray-500 text-center">
            No attendance records in the last 6 weeks.
          </li>
        ) : (
          rows.map((r) => (
            <li
              key={r.id}
              className="flex items-center justify-between gap-3 px-4 py-3 bg-white hover:bg-gray-50 transition-colors"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">{r.date}</p>
                {r.signType ? (
                  <p className="text-xs text-gray-500">{r.signType}</p>
                ) : null}
              </div>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${
                  STATUS_STYLE[r.status || ""] || "text-gray-600 bg-gray-100"
                }`}
              >
                {r.status || "—"}
              </span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
