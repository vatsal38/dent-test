export const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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
