import type { BobStudent } from "@/platform/api/bob/students";

export function studentDisplayName(s: BobStudent): string {
  return `${s.firstName || ""} ${s.lastName || ""}`.trim() || "Untitled";
}

export function initialsOf(name: string) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const a = parts[0]?.[0] || "?";
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
  return (a + b).toUpperCase();
}

export function studentSummaryRows(s: BobStudent): Array<{ label: string; value: string }> {
  const fields = (s.airtableFields || {}) as Record<string, unknown>;
  const get = (k: string) => {
    const v = fields[k];
    return v != null && String(v).trim() ? String(v).trim() : "";
  };

  return [
    { label: "Email", value: s.email || get("Student Email") || get("Email") },
    { label: "Phone", value: s.phone || get("Student Cell Phone Number") || get("Phone") },
    { label: "School", value: s.school || get("School") },
    { label: "Track", value: s.track || get("Track") },
    { label: "Coach", value: s.coach || get("Coach") },
    { label: "YW status", value: s.ywStatus || get("YW Status") || get("Youth Works Status") },
  ].filter((r) => r.value);
}

export function attendanceSummary(s: BobStudent): string {
  const a = s.attendanceStats;
  if (!a) return "No attendance data";
  const present = a.present ?? 0;
  const absent = a.absent ?? 0;
  return `${present} present · ${absent} absent`;
}

export function milestoneSummary(s: BobStudent): string {
  const m = s.milestoneStats;
  if (!m) return "No deliverable data";
  const submitted = m.submitted ?? 0;
  const total = m.total ?? 0;
  if (!total) return `${submitted} submitted`;
  return `${submitted}/${total} submitted`;
}
