/** Attendance UX thresholds — keep ops fast at scale. */
export const ATTENDANCE_PAGE_SIZE = 25;

/** Prefer pod-scoped views above this enrollment count. */
export const POD_SCOPE_ENROLLMENT_THRESHOLD = 60;

/** Week grid multiplies rows — discourage above this without a pod filter. */
export const WEEK_VIEW_ENROLLMENT_THRESHOLD = 40;

export const MAX_ALERTS_VISIBLE = 5;

export const MAX_POD_ALERTS = 4;

/** Single-day attendance hub fetch. */
export const ATTENDANCE_FETCH_LIMIT = 1000;

/** Week grid needs ~6 records × students × 5 days — default 500 truncated Monday. */
export const ATTENDANCE_WEEK_FETCH_LIMIT = 3000;

export const STUDENT_IDS_BATCH_MAX = 500;

export function countEnrollment(
  pods: { id: string; students?: string[] }[],
  podFilter?: string,
): number {
  let n = 0;
  for (const p of pods) {
    if (podFilter && p.id !== podFilter) continue;
    n += p.students?.length ?? 0;
  }
  return n;
}
