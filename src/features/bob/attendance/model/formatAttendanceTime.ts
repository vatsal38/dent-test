/** Display Airtable ISO timestamps in local 12h time — formatting only, no business logic. */
export function formatAttendanceTime(value?: string | null): string | undefined {
  if (!value) return undefined;
  const raw = String(value).trim();
  if (!raw) return undefined;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatHoursLabel(value?: string | number | null): string | undefined {
  if (value == null || value === "") return undefined;
  const n = typeof value === "number" ? value : Number(String(value).replace(/[^\d.]/g, ""));
  if (Number.isFinite(n)) return `${n}h`;
  return String(value);
}
