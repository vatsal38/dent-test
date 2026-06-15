const DOB_KEYS = [
  "Date of Birth",
  "Birthday",
  "Birth Date",
  "DOB",
] as const;

const ALLERGY_KEYS = [
  "Allergies",
  "Allergy",
  "Food Allergies",
  "Medical Allergies",
] as const;

const GUARDIAN_NAME_KEYS = [
  "Parent/Guardian Name",
  "Parent Name",
  "Guardian Name",
  "Parent/Guardian",
] as const;

const GUARDIAN_PHONE_KEYS = [
  "Parent Phone",
  "Parent/Guardian Phone",
  "Guardian Phone",
  "Parent Cell Phone",
  "Parent/Guardian Cell Phone",
] as const;

const GUARDIAN_EMAIL_KEYS = [
  "Parent/Guardian Email",
  "Parent Email",
  "Guardian Email",
] as const;

const EMERGENCY_KEYS = [
  "Emergency Contact",
  "Emergency Contact Name",
  "Emergency Contact Phone",
] as const;

const SCHOOL_ONLY_KEYS = [
  "School",
  "Grade",
  "Graduation Year",
  "2026-27 Grade",
  "GPA",
  "Counselor",
  "Teacher",
] as const;

const SKIP_IN_PERSONAL = new Set([
  "Student Email",
  "Email",
  "Student Cell Phone Number",
  "Phone",
  "Address",
  "City",
  "Zip",
  "Track",
  "Coach",
  "Pod",
  "Site",
  "Programs",
]);

export function pickField(
  fields: Record<string, unknown>,
  keys: readonly string[],
): { key: string; value: unknown } | null {
  for (const key of keys) {
    const raw = fields[key];
    if (raw != null && String(raw).trim()) return { key, value: raw };
  }
  for (const [key, raw] of Object.entries(fields)) {
    if (raw == null || !String(raw).trim()) continue;
    const lower = key.toLowerCase();
    for (const pattern of keys) {
      if (lower.includes(pattern.toLowerCase().replace(/\//g, ""))) {
        return { key, value: raw };
      }
    }
  }
  return null;
}

export function computeAgeFromDob(value: unknown): number | null {
  const iso = String(value || "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const dob = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(dob.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age -= 1;
  return age >= 0 && age < 120 ? age : null;
}

export function formatPersonalDate(value: unknown): string {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const iso = raw.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const d = new Date(`${iso}T12:00:00`);
    if (!Number.isNaN(d.getTime())) {
      const age = computeAgeFromDob(iso);
      const formatted = d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      return age != null ? `${formatted} (age ${age})` : formatted;
    }
  }
  return raw;
}

export {
  DOB_KEYS,
  ALLERGY_KEYS,
  GUARDIAN_NAME_KEYS,
  GUARDIAN_PHONE_KEYS,
  GUARDIAN_EMAIL_KEYS,
  EMERGENCY_KEYS,
  SCHOOL_ONLY_KEYS,
  SKIP_IN_PERSONAL,
};
