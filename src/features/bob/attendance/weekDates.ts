export const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const MONTH_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function getWeekMonday(d: Date): string {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  return date.toISOString().slice(0, 10);
}

export function getWeekSunday(mondayISO: string): string {
  const d = new Date(mondayISO);
  d.setDate(d.getDate() + 6);
  return d.toISOString().slice(0, 10);
}

export function getDaysInRange(startISO: string, endISO: string): string[] {
  const out: string[] = [];
  const start = new Date(startISO);
  const end = new Date(endISO);
  for (let t = start.getTime(); t <= end.getTime(); t += 24 * 60 * 60 * 1000) {
    out.push(new Date(t).toISOString().slice(0, 10));
  }
  return out;
}

export function getDaysInWeek(mondayISO: string): string[] {
  return getDaysInRange(mondayISO, getWeekSunday(mondayISO));
}

/** Calendar month containing `focusDate` (YYYY-MM-DD). */
export function getCalendarMonthBounds(focusDate: string): {
  key: string;
  label: string;
  startDate: string;
  endDate: string;
} {
  const iso = String(focusDate || "").slice(0, 10);
  const year = Number(iso.slice(0, 4));
  const month = Number(iso.slice(5, 7));
  if (!year || !month) {
    return {
      key: iso.slice(0, 7) || "",
      label: iso,
      startDate: iso,
      endDate: iso,
    };
  }
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const mm = String(month).padStart(2, "0");
  return {
    key: `${year}-${mm}`,
    label: `${MONTH_LONG[month - 1] || mm} ${year}`,
    startDate: `${year}-${mm}-01`,
    endDate: `${year}-${mm}-${String(lastDay).padStart(2, "0")}`,
  };
}

/** Shift focus date by ±1 calendar month, keeping the day-of-month when possible. */
export function shiftFocusMonth(focusDate: string, deltaMonths: number): string {
  const iso = String(focusDate || "").slice(0, 10);
  const year = Number(iso.slice(0, 4));
  const month = Number(iso.slice(5, 7));
  const day = Number(iso.slice(8, 10)) || 1;
  if (!year || !month) return iso;
  const base = new Date(Date.UTC(year, month - 1 + deltaMonths, 1));
  const lastDay = new Date(
    Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + 1, 0),
  ).getUTCDate();
  const clampedDay = Math.min(day, lastDay);
  return `${base.getUTCFullYear()}-${String(base.getUTCMonth() + 1).padStart(2, "0")}-${String(clampedDay).padStart(2, "0")}`;
}
