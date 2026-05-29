import type { BobAttendance } from "@/platform/api/bob/attendance";
import type { BobPod } from "@/platform/api/bob/pods";
import type { BobStudent } from "@/platform/api/bob/students";
import { getDaysInRange } from "../weekDates";
import type {
  AttendanceAlert,
  AttendanceDiscrepancy,
  AttendanceWorkspaceData,
  PodAttendanceStats,
  PunchType,
} from "../types";
import {
  MAX_POD_ALERTS,
  POD_SCOPE_ENROLLMENT_THRESHOLD,
  WEEK_VIEW_ENROLLMENT_THRESHOLD,
} from "./scale";
import { PUNCH_LABELS } from "./constants";
import { PUNCH_TYPES } from "../types";
import {
  buildStudentDayAttendance,
  isAirtableSourcedAttendance,
  supplementEnrollmentsFromAttendance,
  UNASSIGNED_POD_ID,
} from "./buildAttendanceIndex";
import { resolvePodName, resolveSiteName, resolveStudentName } from "./resolveDisplay";

function buildDiscrepancies(
  days: ReturnType<typeof buildStudentDayAttendance>,
  studentById: Map<string, BobStudent>,
  podById: Map<string, BobPod>,
): AttendanceDiscrepancy[] {
  const list: AttendanceDiscrepancy[] = [];

  for (const day of days) {
    const studentName = resolveStudentName(day.studentId, studentById);
    const podName = resolvePodName(day.podId, podById);

    if (day.health === "missing") {
      list.push({
        id: `${day.key}|missing_day`,
        kind: "missing_day",
        studentId: day.studentId,
        podId: day.podId,
        date: day.date,
        label: `${studentName} — no attendance on ${day.date} (${podName})`,
        status: "open",
      });
      continue;
    }

    if (day.isLate) {
      list.push({
        id: `${day.key}|late`,
        kind: "late",
        studentId: day.studentId,
        podId: day.podId,
        date: day.date,
        label: `${studentName} — late on ${day.date}`,
        status: "open",
      });
    }

    for (const pt of PUNCH_TYPES) {
      if (day.punches[pt].state !== "missing") continue;
      if (day.health === "excused" || day.health === "absent") continue;
      list.push({
        id: `${day.key}|${pt}`,
        kind: "missing_punch",
        studentId: day.studentId,
        podId: day.podId,
        date: day.date,
        punchType: pt,
        label: `${studentName} — missing ${PUNCH_LABELS[pt]} on ${day.date}`,
        status: "open",
      });
    }
  }

  return list.sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      a.label.localeCompare(b.label),
  );
}

function buildPodStats(
  days: ReturnType<typeof buildStudentDayAttendance>,
  pods: BobPod[],
  podById: Map<string, BobPod>,
  focusDate: string,
): PodAttendanceStats[] {
  const todayDays = days.filter((d) => d.date === focusDate);
  return pods.map((pod) => {
    const podDays = todayDays.filter((d) => d.podId === pod.id);
    return {
      podId: pod.id,
      podName: pod.name,
      siteName: resolveSiteName(pod.id, podById),
      expected: podDays.length,
      complete: podDays.filter((d) => d.health === "complete" || d.health === "late").length,
      partial: podDays.filter((d) => d.health === "partial").length,
      missing: podDays.filter((d) => d.health === "missing").length,
      late: podDays.filter((d) => d.isLate).length,
      excused: podDays.filter((d) => d.health === "excused").length,
      absent: podDays.filter((d) => d.health === "absent").length,
    };
  });
}

function buildAlerts(
  focusDate: string,
  podStats: PodAttendanceStats[],
  summary: AttendanceWorkspaceData["summary"],
  openDiscrepancies: number,
  podFilter?: string,
): { alerts: AttendanceAlert[]; truncated: number } {
  const alerts: AttendanceAlert[] = [];

  const podsWithIssues = podStats
    .filter((p) => p.missing > 0 || p.partial > 0 || p.late > 0)
    .sort((a, b) => b.missing + b.partial - (a.missing + a.partial));

  const podAlerts = podsWithIssues
    .filter((p) => !podFilter || p.podId === podFilter)
    .slice(0, MAX_POD_ALERTS);

  for (const p of podAlerts) {
    const gaps = p.partial + p.missing;
    if (gaps > 0) {
      alerts.push({
        id: `pod-missing-${p.podId}`,
        severity: "critical",
        title: `${gaps} gap${gaps === 1 ? "" : "s"} in ${p.podName}`,
        body: `${focusDate} — ${p.complete}/${p.expected} complete`,
        href: `/app/bob/attendance?pod=${p.podId}&date=${focusDate}&filter=missing`,
        count: gaps,
      });
    } else if (p.late > 0) {
      alerts.push({
        id: `pod-late-${p.podId}`,
        severity: "warning",
        title: `${p.late} late in ${p.podName}`,
        href: `/app/bob/attendance?pod=${p.podId}&date=${focusDate}&filter=late`,
        count: p.late,
      });
    }
  }

  const hiddenPodAlerts = Math.max(0, podsWithIssues.length - podAlerts.length);
  if (hiddenPodAlerts > 0) {
    alerts.push({
      id: "more-pods",
      severity: "info",
      title: `${hiddenPodAlerts} more pod${hiddenPodAlerts === 1 ? "" : "s"} need review`,
      href: `/app/bob/attendance/discrepancies?date=${focusDate}`,
      count: hiddenPodAlerts,
    });
  }

  if (summary.late > 0 && !podFilter) {
    alerts.push({
      id: "late-today",
      severity: "warning",
      title: `${summary.late} student${summary.late === 1 ? "" : "s"} late today`,
      href: `/app/bob/attendance?date=${focusDate}&filter=late`,
      count: summary.late,
    });
  }

  if (openDiscrepancies > 0) {
    alerts.push({
      id: "open-discrepancies",
      severity: "warning",
      title: `${openDiscrepancies} open issue${openDiscrepancies === 1 ? "" : "s"} to resolve`,
      body: "Payroll-safe corrections in the discrepancy queue.",
      href: "/app/bob/attendance/discrepancies",
      count: openDiscrepancies,
    });
  }

  const sorted = alerts.sort((a, b) => {
    const rank = { critical: 0, warning: 1, info: 2 };
    return rank[a.severity] - rank[b.severity];
  });

  return { alerts: sorted, truncated: hiddenPodAlerts };
}

export interface ComputeWorkspaceInput {
  focusDate: string;
  startDate?: string;
  endDate?: string;
  podFilter?: string;
  pods: BobPod[];
  students: BobStudent[];
  records: BobAttendance[];
  enrollmentCount: number;
  studentsRequested: number;
}

export function computeAttendanceWorkspace(
  input: ComputeWorkspaceInput,
): AttendanceWorkspaceData {
  const {
    focusDate,
    startDate,
    endDate,
    podFilter,
    pods,
    students,
    records,
    enrollmentCount,
    studentsRequested,
  } = input;

  const studentById = new Map(students.map((s) => [s.id, s]));
  const podById = new Map(pods.map((p) => [p.id, p]));
  const rangeStart = startDate || focusDate;
  const rangeEnd = endDate || focusDate;
  const dates =
    rangeStart === rangeEnd
      ? [rangeStart]
      : getDaysInRange(rangeStart, rangeEnd);

  // Attendance hub shows Airtable-imported rows only (not pod-roster placeholders).
  const airtableRecords = records.filter(isAirtableSourcedAttendance);
  const enrollments = supplementEnrollmentsFromAttendance(
    airtableRecords,
    dates,
    [],
    studentById,
    podFilter,
  );

  if (enrollments.some((e) => e.podId === UNASSIGNED_POD_ID)) {
    podById.set(UNASSIGNED_POD_ID, {
      id: UNASSIGNED_POD_ID,
      name: "No pod assigned",
      coachId: null,
      siteSupporterId: null,
      students: [],
      createdAt: "",
      updatedAt: "",
    });
  }

  const days = buildStudentDayAttendance(
    airtableRecords,
    enrollments,
    dates,
    studentById,
  );

  const discrepancies = buildDiscrepancies(days, studentById, podById);
  const openDiscrepancies = discrepancies.filter((d) => d.status === "open").length;

  const todayDays = days.filter((d) => d.date === focusDate);
  const summary = {
    expected: todayDays.length,
    complete: todayDays.filter(
      (d) => d.health === "complete" || d.health === "late",
    ).length,
    missingPunches: todayDays.reduce((n, d) => n + d.missingPunchCount, 0),
    late: todayDays.filter((d) => d.isLate).length,
    openDiscrepancies,
  };

  const podStats = buildPodStats(days, pods, podById, focusDate);
  const { alerts, truncated } = buildAlerts(
    focusDate,
    podStats,
    summary,
    openDiscrepancies,
    podFilter,
  );

  return {
    date: focusDate,
    pods,
    students,
    studentById,
    podById,
    days,
    discrepancies,
    alerts,
    podStats,
    summary,
    scale: {
      enrollmentCount,
      requiresPodScope:
        enrollmentCount > POD_SCOPE_ENROLLMENT_THRESHOLD && !podFilter,
      recommendPodScope:
        enrollmentCount > POD_SCOPE_ENROLLMENT_THRESHOLD / 2 && !podFilter,
      weekViewHeavy:
        enrollmentCount > WEEK_VIEW_ENROLLMENT_THRESHOLD && !podFilter,
      studentsLoaded: students.length,
      studentsRequested,
      attendanceRecordsLoaded: records.length,
      alertsTruncated: truncated,
    },
  };
}

export function filterDaysByHealth(
  days: AttendanceWorkspaceData["days"],
  filter: "all" | "missing" | "late" | "complete",
): AttendanceWorkspaceData["days"] {
  if (filter === "all") return days;
  if (filter === "missing")
    return days.filter((d) => d.health === "missing" || d.health === "partial");
  if (filter === "late") return days.filter((d) => d.isLate);
  return days.filter((d) => d.health === "complete");
}

export function siteRollup(podStats: PodAttendanceStats[]) {
  const bySite = new Map<
    string,
    { siteName: string; expected: number; complete: number; missing: number }
  >();
  for (const p of podStats) {
    const site = p.siteName || "Unassigned site";
    const cur = bySite.get(site) || {
      siteName: site,
      expected: 0,
      complete: 0,
      missing: 0,
    };
    cur.expected += p.expected;
    cur.complete += p.complete;
    cur.missing += p.missing + p.partial;
    bySite.set(site, cur);
  }
  return Array.from(bySite.values()).sort((a, b) =>
    a.siteName.localeCompare(b.siteName),
  );
}
