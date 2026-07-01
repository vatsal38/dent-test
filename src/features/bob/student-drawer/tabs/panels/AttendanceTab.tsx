"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { buildBobReturnTo } from "@/lib/bobReturnUrl";
import { formatDayHoursPresent } from "@/features/bob/attendance/model/dayHours";
import { useStudentDrawerContext } from "../../context/StudentDrawerContext";
import { useStudentAttendanceHistory } from "../../hooks/useStudentTabQueries";
import {
  buildStudentAttendanceDays,
  sortStudentDaysNewestFirst,
} from "../../lib/studentAttendanceDays";
import { DetailCard, DetailCardGrid } from "../../widgets/DetailCard";
import { AttendanceTabSkeleton } from "../../widgets/TabPanelSkeleton";
import { WeeklyAttendanceChart } from "../../widgets/WeeklyAttendanceChart";

const STATUS_STYLE: Record<string, string> = {
  present: "text-emerald-700 bg-emerald-50",
  absent: "text-rose-700 bg-rose-50",
  excused: "text-sky-700 bg-sky-50",
  late: "text-amber-700 bg-amber-50",
  future: "text-gray-600 bg-gray-100",
};

function statusLabel(date: string, status?: string | null): string {
  const today = new Date().toISOString().slice(0, 10);
  if (date > today) return "Future";
  return status || "—";
}

function dayStatusLabel(day: ReturnType<typeof buildStudentAttendanceDays>[number]) {
  return statusLabel(day.date, day.dailyStatus || day.attendanceState);
}

export function AttendanceTab() {
  const { student, tab } = useStudentDrawerContext();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data, isLoading, isFetching } = useStudentAttendanceHistory(
    student?.id ?? null,
    student?.podId,
    tab,
  );

  const days = useMemo(() => {
    if (!student) return [];
    return sortStudentDaysNewestFirst(
      buildStudentAttendanceDays(student, data?.attendance ?? []),
    );
  }, [student, data?.attendance]);

  if (!student) return null;
  if (isLoading) return <AttendanceTabSkeleton />;

  const stats = student.attendanceStats;

  const counts = days.reduce(
    (acc, day) => {
      const today = new Date().toISOString().slice(0, 10);
      if (day.date > today) return acc;
      const label = dayStatusLabel(day);
      if (label === "Future" || label === "—") return acc;
      const key = label.toLowerCase();
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className="p-5 space-y-5">
      <DetailCardGrid cols={3}>
        <DetailCard
          label="Attendance % (hours)"
          value={stats?.hoursPct != null ? `${stats.hoursPct}%` : "—"}
          hint={
            stats?.hoursAttended != null && stats?.hoursPotential != null
              ? `${stats.hoursAttended}h of ${stats.hoursPotential}h expected`
              : undefined
          }
        />
        <DetailCard
          label="This week"
          value={
            stats?.hoursPctThisWeek != null
              ? `${stats.hoursPctThisWeek}%`
              : "—"
          }
          hint="Hours attended vs expected program days"
        />
        <DetailCard
          label="Pre-tax earned"
          value={
            stats?.earnedPreTax != null
              ? `$${stats.earnedPreTax.toFixed(2)}`
              : "—"
          }
          hint="$15 × hours attended"
        />
      </DetailCardGrid>

      <DetailCardGrid cols={3}>
        <DetailCard
          label="Present days"
          value={counts.present ?? stats?.present ?? 0}
        />
        <DetailCard
          label="Absent days"
          value={counts.absent ?? stats?.absent ?? 0}
        />
        <DetailCard label="Late days" value={counts.late ?? 0} />
      </DetailCardGrid>

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <WeeklyAttendanceChart days={days} />
      </div>

      <div className="flex justify-end">
        {(() => {
          const markParams = new URLSearchParams();
          if (student.podId) markParams.set("pod", student.podId);
          if (student.track) markParams.set("track", student.track);
          markParams.set(
            "returnTo",
            buildBobReturnTo(pathname, searchParams.toString()),
          );
          return (
            <Link
              href={`/app/bob/attendance/mark?${markParams.toString()}`}
              className="text-sm font-medium text-orange-600"
            >
              Open issue triage →
            </Link>
          );
        })()}
      </div>

      {isFetching && !isLoading ? (
        <p className="text-xs text-gray-400">Refreshing…</p>
      ) : null}

      <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 overflow-hidden">
        {days.length === 0 ? (
          <li className="p-6 text-sm text-gray-500 text-center">
            No attendance records in the last 6 weeks.
          </li>
        ) : (
          days.map((day) => {
            const label = dayStatusLabel(day);
            const styleKey =
              label === "Future" ? "future" : day.dailyStatus || day.attendanceState || "";
            const hoursLabel = formatDayHoursPresent(day);
            return (
              <li
                key={day.key}
                className="flex items-center justify-between gap-3 px-4 py-3 bg-white hover:bg-gray-50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{day.date}</p>
                  {hoursLabel !== "—" ? (
                    <p className="text-xs text-gray-500">{hoursLabel} present</p>
                  ) : null}
                  {day.health === "missing" || day.health === "partial" ? (
                    <p className="text-xs text-amber-700">
                      {day.missingPunchCount > 0
                        ? `${day.missingPunchCount} missing punch${day.missingPunchCount === 1 ? "" : "es"}`
                        : "Incomplete punches"}
                    </p>
                  ) : null}
                </div>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${
                    STATUS_STYLE[styleKey] || "text-gray-600 bg-gray-100"
                  }`}
                >
                  {label}
                </span>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
