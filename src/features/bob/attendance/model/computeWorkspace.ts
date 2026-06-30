import type { BobAttendance } from "@/platform/api/bob/attendance";
import type { BobPod } from "@/platform/api/bob/pods";
import type { BobStudent } from "@/platform/api/bob/students";
import { getDaysInRange } from "../weekDates";
import type {
  AttendanceAlert,
  AttendanceDiscrepancy,
  AttendanceIssueSummary,
  AttendanceWorkspaceData,
  IssueFilter,
  PodAttendanceStats,
  PunchType,
} from "../types";
import {
  MAX_POD_ALERTS,
  POD_SCOPE_ENROLLMENT_THRESHOLD,
  WEEK_VIEW_ENROLLMENT_THRESHOLD,
} from "./scale";
import { PUNCH_LABELS } from "./constants";
import {
  buildStudentDayAttendance,
  listExpectedEnrollments,
  supplementEnrollmentsFromAttendance,
  supplementEnrollmentsFromStudents,
  UNASSIGNED_POD_ID,
} from "./buildAttendanceIndex";
import { resolvePodName, resolveSiteName, resolveStudentName } from "./resolveDisplay";
import {
  resolveStudentTrackLabel,
  rosterTrackLabelMatches,
  studentMatchesRosterTrack,
  isStudentPresentToday,
} from "@/lib/bobRosterTrackOptions";
import {
  expectedPunchTypes,
  isAttendanceExpectedOn,
  isProgramDay,
} from "@/lib/bobProgramCalendar";

function isOperationalAttendancePod(pod: BobPod): boolean {
  const name = String(pod.name || "").trim();
  return Boolean(name) && !/^applicant$/i.test(name) && !/^global$/i.test(name);
}

function buildDiscrepancies(
  days: ReturnType<typeof buildStudentDayAttendance>,
  studentById: Map<string, BobStudent>,
  podById: Map<string, BobPod>,
): AttendanceDiscrepancy[] {
  const list: AttendanceDiscrepancy[] = [];

  for (const day of days) {
    if (!isAttendanceExpectedOn(day.date)) continue;

    const studentName = resolveStudentName(day.studentId, studentById);
    const podName = resolvePodName(
      day.podId,
      podById,
      studentById.get(day.studentId),
    );
    const requiredPunches = expectedPunchTypes(day.date);

    if (day.health === "missing" && requiredPunches.length > 0) {
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

    if (day.hasManualCorrection) {
      list.push({
        id: `${day.key}|manual_override`,
        kind: "manual_override",
        studentId: day.studentId,
        podId: day.podId,
        date: day.date,
        label: `${studentName} — manual correction on ${day.date}`,
        status: "open",
      });
    }

    if (day.hasAutoFill) {
      list.push({
        id: `${day.key}|auto_filled`,
        kind: "auto_filled",
        studentId: day.studentId,
        podId: day.podId,
        date: day.date,
        label: `${studentName} — auto-filled on ${day.date}`,
        status: "open",
      });
    }

    if (day.notes && /correction|request/i.test(day.notes)) {
      list.push({
        id: `${day.key}|correction_request`,
        kind: "correction_request",
        studentId: day.studentId,
        podId: day.podId,
        date: day.date,
        label: `${studentName} — correction request on ${day.date}`,
        status: "open",
      });
    }

    for (const pt of requiredPunches) {
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

function studentBelongsToPod(student: BobStudent, pod: BobPod): boolean {
  if (student.podId === pod.id) return true;
  if (student.podId && student.podId !== UNASSIGNED_POD_ID) return false;
  const trackLabel = resolveStudentTrackLabel(student);
  const podLabel = String(pod.name || pod.displayLabel || "").trim();
  if (!podLabel || !trackLabel) return false;
  return rosterTrackLabelMatches(podLabel, trackLabel);
}

function buildPodStats(
  days: ReturnType<typeof buildStudentDayAttendance>,
  pods: BobPod[],
  podById: Map<string, BobPod>,
  focusDate: string,
  students: BobStudent[],
): PodAttendanceStats[] {
  const todayDays = days.filter(
    (d) => d.date === focusDate && isProgramDay(focusDate),
  );
  return pods.map((pod) => {
    const rosterStudents = students.filter((s) => studentBelongsToPod(s, pod));
    const rosterIds = new Set(rosterStudents.map((s) => s.id));
    const podDays = todayDays.filter(
      (d) => d.podId === pod.id || rosterIds.has(d.studentId),
    );
    const dayByStudent = new Map(podDays.map((d) => [d.studentId, d]));
    const hoursSum = podDays.reduce((sum, d) => {
      const raw = d.totalHoursLabel?.replace(/[^\d.]/g, "") ?? "";
      const n = Number(raw);
      return sum + (Number.isFinite(n) ? n : 0);
    }, 0);
    const withHours = podDays.filter((d) => d.totalHoursLabel).length;
    return {
      podId: pod.id,
      podName: pod.name,
      siteName: resolveSiteName(pod.id, podById),
      expected: rosterStudents.length,
      complete: rosterStudents.filter((s) => {
        const day = dayByStudent.get(s.id);
        return day ? isStudentPresentToday(day) : false;
      }).length,
      partial: podDays.filter((d) => d.health === "partial").length,
      missing: podDays.filter(
        (d) => d.health === "missing" || d.health === "partial",
      ).length,
      late: podDays.filter((d) => d.isLate || d.attendanceState === "late").length,
      excused: podDays.filter((d) => d.attendanceState === "excused").length,
      absent: podDays.filter((d) => d.attendanceState === "absent").length,
      autoFilled: podDays.filter((d) => d.attendanceState === "auto_filled").length,
      missingPunches: podDays.reduce((n, d) => n + d.missingPunchCount, 0),
      averageHours: withHours > 0 ? Math.round((hoursSum / withHours) * 10) / 10 : 0,
    };
  });
}

function buildAlerts(
  focusDate: string,
  podStats: PodAttendanceStats[],
  summary: AttendanceWorkspaceData["summary"],
  openDiscrepancies: number,
  podFilter?: string,
  scoped?: boolean,
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
        href: `/app/bob/attendance?date=${focusDate}&filter=missing`,
        count: gaps,
      });
    } else if (p.late > 0) {
      alerts.push({
        id: `pod-late-${p.podId}`,
        severity: "warning",
        title: `${p.late} late in ${p.podName}`,
        href: `/app/bob/attendance?date=${focusDate}&filter=late`,
        count: p.late,
      });
    }
  }

  const hiddenPodAlerts = Math.max(0, podsWithIssues.length - podAlerts.length);
  if (hiddenPodAlerts > 0) {
    alerts.push({
      id: "more-pods",
      severity: "info",
      title: `${hiddenPodAlerts} more track${hiddenPodAlerts === 1 ? "" : "s"} need review`,
      href: `/app/bob/attendance/discrepancies?date=${focusDate}`,
      count: hiddenPodAlerts,
    });
  }

  if (summary.late > 0 && !scoped) {
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
      title: `${openDiscrepancies} attendance correction${openDiscrepancies === 1 ? "" : "s"} to resolve`,
      body: "Review in attendance corrections.",
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
  trackFilter?: string;
  pods: BobPod[];
  students: BobStudent[];
  records: BobAttendance[];
  enrollmentCount: number;
  studentsRequested: number;
  /** When set, workspace is limited to this student only (youth self-service). */
  studentOnlyId?: string | null;
}

export function computeAttendanceWorkspace(
  input: ComputeWorkspaceInput,
): AttendanceWorkspaceData {
  const {
    focusDate,
    startDate,
    endDate,
    podFilter,
    trackFilter,
    pods,
    students,
    records,
    enrollmentCount,
    studentsRequested,
    studentOnlyId: studentOnlyIdRaw,
  } = input;

  const studentOnlyId = studentOnlyIdRaw ? String(studentOnlyIdRaw) : null;
  const scopedStudents = studentOnlyId
    ? students.filter((s) => String(s.id) === studentOnlyId)
    : students;
  const scopedRecords = studentOnlyId
    ? records.filter((r) => String(r.studentId || "") === studentOnlyId)
    : records;

  const studentById = new Map(scopedStudents.map((s) => [s.id, s]));
  const podById = new Map(pods.map((p) => [p.id, p]));
  const rangeStart = startDate || focusDate;
  const rangeEnd = endDate || focusDate;
  const dates =
    rangeStart === rangeEnd
      ? [rangeStart]
      : getDaysInRange(rangeStart, rangeEnd);

  const trackTerm = String(trackFilter || "").trim();

  // When track-scoped, enrollments come from the filtered student list only.
  const rosterEnrollments =
    studentOnlyId || trackTerm
      ? []
      : listExpectedEnrollments(pods, podFilter);
  const cohortEnrollments = supplementEnrollmentsFromStudents(
    scopedStudents,
    rosterEnrollments,
    podFilter,
  );
  const enrollments = studentOnlyId
    ? cohortEnrollments.filter((e) => e.studentId === studentOnlyId)
    : supplementEnrollmentsFromAttendance(
        scopedRecords,
        dates,
        cohortEnrollments,
        studentById,
        podFilter,
      );

  if (enrollments.some((e) => e.podId === UNASSIGNED_POD_ID)) {
    podById.set(UNASSIGNED_POD_ID, {
      id: UNASSIGNED_POD_ID,
      name: "No track assigned",
      coachId: null,
      siteSupporterId: null,
      students: [],
      createdAt: "",
      updatedAt: "",
    });
  }

  let days = buildStudentDayAttendance(
    scopedRecords,
    enrollments,
    dates,
    studentById,
  );

  if (trackTerm) {
    days = days.filter((d) => {
      const student = studentById.get(d.studentId);
      return student && studentMatchesRosterTrack(student, trackTerm);
    });
  } else if (studentOnlyId) {
    days = days.filter((d) => d.studentId === studentOnlyId);
  }

  const discrepancies = buildDiscrepancies(days, studentById, podById);
  const openDiscrepancies = discrepancies.filter((d) => d.status === "open").length;

  const todayDays = days.filter(
    (d) => d.date === focusDate && isProgramDay(focusDate),
  );
  const summary = {
    expected: todayDays.length,
    complete: todayDays.filter(
      (d) => d.attendanceState === "present" || d.health === "complete",
    ).length,
    missingPunches: todayDays.reduce((n, d) => n + d.missingPunchCount, 0),
    missingStudents: todayDays.filter(
      (d) => !isStudentPresentToday(d) && d.attendanceState !== "excused",
    ).length,
    late: todayDays.filter((d) => d.isLate || d.attendanceState === "late").length,
    openDiscrepancies,
    excused: todayDays.filter((d) => d.attendanceState === "excused").length,
    absent: todayDays.filter((d) => d.attendanceState === "absent").length,
    autoFilled: todayDays.filter((d) => d.attendanceState === "auto_filled").length,
    present: todayDays.filter((d) => isStudentPresentToday(d)).length,
  };

  const issues: AttendanceIssueSummary = {
    missingPunches: summary.missingPunches,
    late: summary.late,
    correctionRequests: discrepancies.filter((d) => d.kind === "correction_request").length,
    manualOverrides: discrepancies.filter((d) => d.kind === "manual_override").length,
    autoFilled: discrepancies.filter((d) => d.kind === "auto_filled").length,
    conflicts: discrepancies.filter((d) => d.kind === "conflict").length,
    total: openDiscrepancies,
  };

  const operationalPods = pods.filter(isOperationalAttendancePod);
  const podStats = buildPodStats(days, operationalPods, podById, focusDate, scopedStudents);
  const scoped = Boolean(
    String(podFilter || "").trim() || String(trackFilter || "").trim(),
  );
  const { alerts, truncated } = buildAlerts(
    focusDate,
    podStats,
    summary,
    openDiscrepancies,
    podFilter,
    scoped,
  );

  return {
    date: focusDate,
    pods,
    students: scopedStudents,
    studentById,
    podById,
    days,
    discrepancies,
    alerts,
    podStats,
    summary,
    issues,
    scale: {
      enrollmentCount,
      /** Soft hint only — grid is never hard-blocked. */
      requiresPodScope: false,
      recommendPodScope:
        enrollmentCount > POD_SCOPE_ENROLLMENT_THRESHOLD / 2 &&
        !podFilter &&
        !trackTerm,
      weekViewHeavy:
        enrollmentCount > WEEK_VIEW_ENROLLMENT_THRESHOLD &&
        !podFilter &&
        !trackTerm,
      studentsLoaded: scopedStudents.length,
      studentsRequested,
      attendanceRecordsLoaded: records.length,
      alertsTruncated: truncated,
    },
  };
}

export function filterDaysByHealth(
  days: AttendanceWorkspaceData["days"],
  filter: IssueFilter,
): AttendanceWorkspaceData["days"] {
  if (filter === "all") return days;
  if (filter === "missing") {
    return days.filter(
      (d) =>
        d.health === "missing" ||
        d.health === "partial" ||
        d.attendanceState === "missing_punch",
    );
  }
  if (filter === "late") {
    return days.filter((d) => d.isLate || d.attendanceState === "late");
  }
  if (filter === "excused") {
    return days.filter((d) => d.attendanceState === "excused");
  }
  if (filter === "absent") {
    return days.filter((d) => d.attendanceState === "absent");
  }
  if (filter === "auto_filled") {
    return days.filter((d) => d.attendanceState === "auto_filled");
  }
  if (filter === "corrections") {
    return days.filter((d) => d.hasManualCorrection);
  }
  if (filter === "correction_requests") {
    return days.filter((d) => Boolean(d.notes && /correction|request/i.test(d.notes)));
  }
  if (filter === "conflicts") {
    return days.filter((d) => d.missingPunchCount > 0 && d.hasManualCorrection);
  }
  return days.filter(
    (d) => d.attendanceState === "present" || d.health === "complete",
  );
}

export function siteRollup(podStats: PodAttendanceStats[]) {
  const bySite = new Map<
    string,
    {
      siteName: string;
      expected: number;
      complete: number;
      missing: number;
      late: number;
      excused: number;
      absent: number;
      missingPunches: number;
      averageHours: number;
    }
  >();
  for (const p of podStats) {
    const site = p.siteName || "Unassigned track";
    const cur = bySite.get(site) || {
      siteName: site,
      expected: 0,
      complete: 0,
      missing: 0,
      late: 0,
      excused: 0,
      absent: 0,
      missingPunches: 0,
      averageHours: 0,
    };
    cur.expected += p.expected;
    cur.complete += p.complete;
    cur.missing += p.missing + p.partial;
    cur.late += p.late;
    cur.excused += p.excused;
    cur.absent += p.absent;
    cur.missingPunches += p.missingPunches;
    cur.averageHours += p.averageHours;
    bySite.set(site, cur);
  }
  return Array.from(bySite.values()).sort((a, b) =>
    a.siteName.localeCompare(b.siteName),
  );
}
