import type { AttendanceWorkspaceData, IssueFilter, StudentDayAttendance } from "../types";
import { filterDaysByHealth } from "./computeWorkspace";
import { studentMatchesSearch } from "./filterRows";
import { resolveStudentName } from "./resolveDisplay";
import {
  getCalendarMonthBounds,
  getWeekMonday,
  getWeekSunday,
} from "../weekDates";
import {
  PROGRAM_END_DATE,
  PROGRAM_START_DATE,
} from "@/lib/bobProgramCalendar";

export type AttendanceExportViewMode = "day" | "week" | "month";

export function resolveAttendanceExportRange(
  viewMode: AttendanceExportViewMode,
  focusDate: string,
): { startDate: string; endDate: string; fileLabel: string } {
  if (viewMode === "week") {
    const startDate = getWeekMonday(new Date(`${focusDate}T12:00:00`));
    const endDate = getWeekSunday(startDate);
    return {
      startDate,
      endDate,
      fileLabel: `${startDate}_to_${endDate}`,
    };
  }

  if (viewMode === "month") {
    const bounds = getCalendarMonthBounds(focusDate);
    const startDate =
      bounds.startDate < PROGRAM_START_DATE
        ? PROGRAM_START_DATE
        : bounds.startDate;
    const endDate =
      bounds.endDate > PROGRAM_END_DATE ? PROGRAM_END_DATE : bounds.endDate;
    return {
      startDate,
      endDate,
      fileLabel: bounds.key || focusDate.slice(0, 7),
    };
  }

  return {
    startDate: focusDate,
    endDate: focusDate,
    fileLabel: focusDate,
  };
}

/**
 * Build export rows from the same selection the hub is showing:
 * date range (day/week/month), health filter, and search.
 */
export function selectAttendanceExportDays(input: {
  days: StudentDayAttendance[];
  workspace: Pick<AttendanceWorkspaceData, "studentById" | "podById">;
  healthFilter: IssueFilter;
  search: string;
  focusDate: string;
}): StudentDayAttendance[] {
  const { days, workspace, healthFilter, search, focusDate } = input;
  const filtered = filterDaysByHealth(days, healthFilter);

  const matched = filtered.filter((day) =>
    studentMatchesSearch(
      day.studentId,
      workspace.studentById,
      workspace.podById,
      day,
      search,
    ),
  );

  return matched.sort((a, b) => {
    const byDate = a.date.localeCompare(b.date);
    if (byDate !== 0) return byDate;
    const nameA = resolveStudentName(a.studentId, workspace.studentById);
    const nameB = resolveStudentName(b.studentId, workspace.studentById);
    const byName = nameA.localeCompare(nameB);
    if (byName !== 0) return byName;
    // Prefer focus date first within same student/date collisions
    if (a.date === focusDate && b.date !== focusDate) return -1;
    if (b.date === focusDate && a.date !== focusDate) return 1;
    return a.studentId.localeCompare(b.studentId);
  });
}
