import type { BobRosterSchemaField } from "@/platform/api/bob/students";
import type { BobStudent } from "@/platform/api/bob/students";
import { extractAirtableAttachments } from "@/lib/bobAirtableDisplay";
import { curatedRosterListColumns } from "@/features/bob/roster/curatedListColumns";

const HEADSHOT_FIELD_PATTERNS = [
  /headshot/i,
  /student\s*photo/i,
  /profile\s*photo/i,
  /^photo$/i,
];

function attachmentsFromField(fields: Record<string, unknown>, key: string): string {
  const url = extractAirtableAttachments(fields[key])?.[0]?.url;
  return url?.trim() || "";
}

/** Resolve best-effort headshot URL from schema + Airtable row fields. */
export function resolveStudentHeadshotUrl(
  student: BobStudent,
  schemaFields: BobRosterSchemaField[] | null | undefined,
): string {
  const fields = (student.airtableFields || {}) as Record<string, unknown>;
  const { headshot } = curatedRosterListColumns(schemaFields);
  if (headshot?.name) {
    const fromSchema = attachmentsFromField(fields, headshot.name);
    if (fromSchema) return fromSchema;
  }

  for (const key of Object.keys(fields)) {
    if (!HEADSHOT_FIELD_PATTERNS.some((p) => p.test(key))) continue;
    const url = attachmentsFromField(fields, key);
    if (url) return url;
  }

  const direct = (student as { headshotUrl?: string; photoUrl?: string }).headshotUrl
    || (student as { photoUrl?: string }).photoUrl;
  if (typeof direct === "string" && direct.trim()) return direct.trim();

  return "";
}
