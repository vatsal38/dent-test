import type { BobRecruitmentRecord } from "@/platform/api/bob/recruitment";
import { cellDisplayValue } from "@/lib/bobAirtableDisplay";

export function initialsOf(name: string) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const a = parts[0]?.[0] || "?";
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
  return (a + b).toUpperCase();
}

export function pickRecordSubtitle(
  fields: Record<string, unknown>,
  r: BobRecruitmentRecord,
  schoolLabels?: Record<string, string>,
): string {
  for (const k of ["Email", "Student Email"]) {
    const v = fields[k];
    if (v != null && String(v).trim()) return String(v).trim();
  }
  for (const k of ["School", "Organization", "District", "City"]) {
    const text = cellDisplayValue(fields[k], schoolLabels);
    if (text && text !== "—" && text !== "…") return text;
  }
  if (r.airtableRecordId) return "Synced from Airtable";
  return "Youth Apps & Intake";
}

export function pickSummaryFields(
  fields: Record<string, unknown>,
  record: BobRecruitmentRecord,
): Array<{ label: string; value: string }> {
  const get = (...keys: string[]) => {
    for (const k of keys) {
      const v = fields[k];
      if (v != null && String(v).trim()) return String(v).trim();
    }
    return "";
  };

  const rows: Array<{ label: string; value: string }> = [
    { label: "Email", value: get("Student Email", "Email") || record.email || "" },
    { label: "Phone", value: get("Student Cell Phone Number", "Phone", "Student Phone") || record.phone || "" },
    { label: "School", value: get("School", "Organization") },
    { label: "Grade", value: get("Grade") },
    {
      label: "Programs",
      value:
        Array.isArray(record.programRecordIds) && record.programRecordIds.length
          ? `${record.programRecordIds.length} linked`
          : "",
    },
    { label: "Counselor", value: record.counselor || get("Assigned To", "Recruiter") },
  ];

  return rows.filter((r) => r.value);
}
