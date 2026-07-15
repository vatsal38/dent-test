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
import { useBobAccess } from "@/platform/rbac/useBobAccess";
import { useBobMe } from "@/platform/query/hooks/useBobMe";
import { isOwnStudentProfile } from "@/platform/rbac/studentProfile";

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

function correctionHref(
  date: string,
  type?: "absence" | "time_correction" | "special",
  returnTo?: string,
) {
  const params = new URLSearchParams();
  if (date) params.set("date", date);
  if (type) params.set("type", type);
  if (returnTo) params.set("returnTo", returnTo);
  const q = params.toString();
  return q
    ? `/app/bob/attendance/correction?${q}`
    : "/app/bob/attendance/correction";
}

export function AttendanceTab() {
  const { student, tab } = useStudentDrawerContext();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { can, access } = useBobAccess();
  const { data: me } = useBobMe();
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
  const viewingSelf = isOwnStudentProfile(
    access,
    me?.linkedStudent?.id,
    student.id,
  );
  const isStudentViewer = access.role === "student";
  const canSubmitCorrection = can("submit.view") && viewingSelf;
  const canTriage =
    !isStudentViewer &&
    (can("attendance.discrepancies") || can("attendance.mark"));
  const returnTo = buildBobReturnTo(pathname, searchParams.toString());

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

      {canSubmitCorrection ? (
        <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-orange-950">
              Need a correction?
            </p>
            <p className="text-xs text-orange-900/90 mt-0.5">
              Report an absence or fix sign-in / sign-out times for a day you
              attended.
            </p>
          </div>
          <Link
            href={correctionHref("", undefined, returnTo)}
            className="inline-flex shrink-0 items-center justify-center rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
          >
            Request correction
          </Link>
        </div>
      ) : null}

      {canTriage ? (
        <div className="flex justify-end gap-3">
          <Link
            href="/app/bob/attendance/discrepancies"
            className="text-sm font-medium text-orange-600"
          >
            Open issue triage →
          </Link>
        </div>
      ) : null}

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
              label === "Future"
                ? "future"
                : day.dailyStatus || day.attendanceState || "";
            const hoursLabel = formatDayHoursPresent(day);
            const needsFix =
              day.missingPunchCount > 0 ||
              day.health === "missing" ||
              day.health === "partial";
            return (
              <li
                key={day.key}
                className="flex flex-col gap-2 px-4 py-3 bg-white hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {day.date}
                    </p>
                    {hoursLabel !== "—" ? (
                      <p className="text-xs text-gray-500">
                        {hoursLabel} present
                      </p>
                    ) : null}
                    {needsFix ? (
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
                </div>
                {canSubmitCorrection ? (
                  <p className="text-xs text-gray-600">
                    <Link
                      href={correctionHref(
                        day.date,
                        label === "Future"
                          ? "absence"
                          : needsFix
                            ? "time_correction"
                            : undefined,
                        returnTo,
                      )}
                      className="font-medium text-orange-600 hover:underline"
                    >
                      {label === "Future"
                        ? "Report planned absence →"
                        : needsFix
                          ? "Report absence or fix times →"
                          : "Request correction for this day →"}
                    </Link>
                  </p>
                ) : null}
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
