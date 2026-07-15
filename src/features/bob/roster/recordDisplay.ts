import type { BobStudent } from "@/platform/api/bob/students";
import { resolveStudentTrackLabel } from "@/lib/bobRosterTrackOptions";

export function studentDisplayName(s: BobStudent): string {
  const first = String(s.firstName || "").trim();
  const last = String(s.lastName || "").trim();
  const preferred = String(
    s.preferredName ||
      (s.airtableFields?.["Preferred Name"] as string | undefined) ||
      "",
  ).trim();
  const firstPart =
    preferred && preferred.toLowerCase() !== first.toLowerCase()
      ? `${first} '${preferred}'`
      : first;
  return `${firstPart} ${last}`.trim() || "Untitled";
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
    {
      label: "Preferred Name",
      value: s.preferredName || get("Preferred Name"),
    },
    { label: "Email", value: s.email || get("Student Email") || get("Email") },
    { label: "Phone", value: s.phone || get("Student Cell Phone Number") || get("Phone") },
    { label: "School", value: s.school || get("School") },
    {
      label: "Track",
      value: (() => {
        const label = resolveStudentTrackLabel(s);
        return label === "Unassigned" ? "" : label;
      })(),
    },
    { label: "Coach", value: s.coach || get("Coach") },
  ].filter((r) => r.value);
}

export function attendanceSummary(s: BobStudent): string {
  const a = s.attendanceStats;
  if (!a) return "No attendance data";
  if (typeof a.hoursPct === "number") {
    const hours =
      a.hoursAttended != null && a.hoursPotential != null
        ? `${a.hoursAttended}h/${a.hoursPotential}h`
        : null;
    return hours ? `${a.hoursPct}% (${hours})` : `${a.hoursPct}% attendance`;
  }
  const present = a.present ?? 0;
  const absent = a.absent ?? 0;
  return `${present} present · ${absent} absent`;
}

export function milestoneSummary(s: BobStudent): string {
  const m = s.milestoneStats;
  if (!m) return "No deliverable data";
  const parts: string[] = [];
  if (typeof m.pctDueCompleted === "number") {
    parts.push(`${m.pctDueCompleted}% completed (due)`);
  } else if (typeof m.pctDueSubmitted === "number") {
    parts.push(`${m.pctDueSubmitted}% submitted (due)`);
  }
  if (m.overdue) parts.push(`${m.overdue} overdue`);
  if (parts.length) return parts.join(" · ");
  const submitted = m.submitted ?? 0;
  const total = m.total ?? 0;
  if (!total) return `${submitted} submitted`;
  return `${submitted}/${total} submitted`;
}
