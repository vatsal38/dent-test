import type { BobRosterSchemaField } from "@/lib/api";
import {
  RETURNER_FIELD,
  TRACK_PLACEMENT_2026_FIELD,
  YW_STATUS_FIELD_NAMES,
} from "@/lib/bobRecruitmentFieldConstants";
import {
  BOB25_TRACK_SITE_LOOKUP_FIELDS,
  BOB26_TRACK_FIELD_NAMES,
  BOB26_TRACK_NAME_LOOKUP_FIELDS,
  BOB26_TRACK_SITE_LOOKUP_FIELDS,
  ROSTER_TRACK_PLACEMENT_2026_FIELD,
  ROSTER_YW_STATUS_FIELD_NAMES,
} from "@/lib/bobRosterFieldConstants";

/** Exact Airtable field names to show when present (order preserved). */
const IMPORTANT_INTAKE_FIELD_NAMES = [
  "Name",
  "Student Name",
  "First Name",
  "Last Name",
  "Email",
  "Student Email",
  "Phone",
  "Student Phone",
  "Student Cell Phone Number",
  "School",
  "Organization",
  "District",
  "Grade",
  "City",
  "Location",
  "Guardian Name",
  "Parent/Guardian Name",
  "Guardian Email",
  "Parent/Guardian Email",
  "Guardian Phone",
  "Program Interest",
  "Interest",
  "How did you hear",
  "How did you hear about us?",
  "Source",
  "Status",
  "Recruitment Status",
  "Application Status",
  ...YW_STATUS_FIELD_NAMES,
  TRACK_PLACEMENT_2026_FIELD,
  RETURNER_FIELD,
  "Pipeline",
  "Stage",
  "Assigned To",
  "Recruiter",
  "Counselor",
  "Notes",
];

/** If exact names are missing, pick at most one field per category from the schema. */
const INTAKE_FIELD_FALLBACKS: Array<RegExp> = [
  /^e-?mail$/i,
  /student\s*email/i,
  /phone|cell/i,
  /school|organization|district/i,
  /grade|year/i,
  /city|location|address/i,
  /guardian|parent/i,
  /program|interest/i,
  /how did you hear|source|referral/i,
  /youth\s*works.*bob.*26.*status/i,
  /status|stage|pipeline/i,
  /assign|recruit|counselor|owner/i,
  /notes?|comments?/i,
];

const MAX_IMPORTANT_COLUMNS = 16;

const TEXT_LIKE_FIELD_TYPES = new Set([
  "singleLineText",
  "multilineText",
  "richText",
  "multipleLookupValues",
  "singleSelect",
  "formula",
  "email",
  "url",
]);

/** Prefer a readable school name field over a raw Schools-table link. */
function pickSchoolField(
  list: BobRosterSchemaField[],
  byName: Map<string, BobRosterSchemaField>,
): BobRosterSchemaField | undefined {
  const lookup = list.find(
    (f) =>
      /school/i.test(f.name) &&
      f.type !== "multipleRecordLinks" &&
      TEXT_LIKE_FIELD_TYPES.has(f.type),
  );
  if (lookup) return lookup;
  return byName.get("School") ?? list.find((f) => /^school$/i.test(f.name));
}

/**
 * Curated Youth Apps & Intake columns for list/detail UI (not every Airtable field).
 */
export function importantIntakeTableColumns(
  schema: BobRosterSchemaField[] | null | undefined,
): BobRosterSchemaField[] {
  const list = (schema ?? []).filter((f) => f?.name);
  if (list.length === 0) return [];

  const byName = new Map(list.map((f) => [f.name, f]));
  const ordered: BobRosterSchemaField[] = [];
  const seen = new Set<string>();

  for (const name of IMPORTANT_INTAKE_FIELD_NAMES) {
    if (ordered.length >= MAX_IMPORTANT_COLUMNS) break;
    if (name === "School") {
      const schoolField = pickSchoolField(list, byName);
      if (schoolField && !seen.has(schoolField.name)) {
        ordered.push(schoolField);
        seen.add(schoolField.name);
      }
      continue;
    }
    const f = byName.get(name);
    if (f && !seen.has(name)) {
      ordered.push(f);
      seen.add(name);
    }
  }

  for (const pattern of INTAKE_FIELD_FALLBACKS) {
    if (ordered.length >= MAX_IMPORTANT_COLUMNS) break;
    const match = list.find((f) => !seen.has(f.name) && pattern.test(f.name));
    if (match) {
      ordered.push(match);
      seen.add(match.name);
    }
  }

  return ordered;
}

export function isStatusLikeIntakeField(name: string): boolean {
  const n = name.toLowerCase();
  if (/youth\s*works.*bob.*26.*status/i.test(n)) return true;
  if (/^status$/i.test(n)) return true;
  if (/recruitment\s*status|application\s*status|^pipeline$|^stage$/i.test(n)) return true;
  if (/\bstatus\b/i.test(n) && !/yw\s*id/i.test(n)) return true;
  return false;
}

/** Columns for the data table (status fields shown in Pipeline / YW columns instead). */
export function intakeDataTableColumns(
  schema: BobRosterSchemaField[] | null | undefined,
): BobRosterSchemaField[] {
  return importantIntakeTableColumns(schema).filter(
    (f) => !isStatusLikeIntakeField(f.name),
  );
}

/** @deprecated Use importantIntakeTableColumns */
export const allIntakeTableColumns = importantIntakeTableColumns;

/** Key All Students / roster fields for the list table (not every Airtable column). */
const IMPORTANT_ROSTER_FIELD_NAMES = [
  "Headshot",
  "Headshots",
  "Student Headshot",
  "Profile Photo",
  "Photo",
  "Preferred Name",
  "Student Email",
  "Student Cell Phone Number",
  "School",
  "Grade",
  "Pronouns",
  "City",
  "Location",
  "Parent/Guardian Email",
  "Parent/Guardian Name",
  "Guardian Email",
  "Start Date @ Dent",
  ...BOB25_TRACK_SITE_LOOKUP_FIELDS,
  ...BOB26_TRACK_FIELD_NAMES,
  ...BOB26_TRACK_NAME_LOOKUP_FIELDS,
  ...BOB26_TRACK_SITE_LOOKUP_FIELDS,
  ROSTER_TRACK_PLACEMENT_2026_FIELD,
  "Track",
  "Coach",
  "Pod",
  ...ROSTER_YW_STATUS_FIELD_NAMES,
  "Stage",
  "Interview Stage",
  "Status",
  "Notes",
];

const ROSTER_FIELD_FALLBACKS: Array<RegExp> = [
  /headshot|head\s*shot|profile\s*photo|student\s*photo/i,
  /preferred\s*name/i,
  /student\s*email|^email$/i,
  /phone|cell/i,
  /school|organization/i,
  /grade|year/i,
  /pronoun/i,
  /city|location|borough/i,
  /parent|guardian/i,
  /start\s*date.*dent|enroll/i,
  /track\s*-\s*site|bob\s*[''\u2019]?\d{2}\s*track|2026\s*track/i,
  /^track$|coach|pod/i,
  /yw\s*status|youth\s*works/i,
  /interview|stage|status/i,
  /notes?|comments?/i,
];

const MAX_ROSTER_COLUMNS = 18;

function pickHeadshotField(
  list: BobRosterSchemaField[],
): BobRosterSchemaField | undefined {
  return (
    list.find((f) => f.type === "multipleAttachments" && /headshot/i.test(f.name)) ||
    list.find((f) => /headshot|head\s*shot/i.test(f.name)) ||
    list.find(
      (f) =>
        f.type === "multipleAttachments" &&
        /profile\s*photo|student\s*photo|^photo$/i.test(f.name),
    )
  );
}

/** Curated roster table columns — important fields + headshot (supports multiple images). */
export function importantRosterTableColumns(
  schema: BobRosterSchemaField[] | null | undefined,
): BobRosterSchemaField[] {
  const list = (schema ?? []).filter((f) => f?.name);
  if (list.length === 0) return [];

  const byName = new Map(list.map((f) => [f.name, f]));
  const ordered: BobRosterSchemaField[] = [];
  const seen = new Set<string>();

  const headshot = pickHeadshotField(list);
  if (headshot) {
    ordered.push(headshot);
    seen.add(headshot.name);
  }

  for (const name of IMPORTANT_ROSTER_FIELD_NAMES) {
    if (ordered.length >= MAX_ROSTER_COLUMNS) break;
    if (/headshot|head\s*shot|profile\s*photo|^photo$/i.test(name)) continue;
    if (name === "School") {
      const schoolField = pickSchoolField(list, byName);
      if (schoolField && !seen.has(schoolField.name)) {
        ordered.push(schoolField);
        seen.add(schoolField.name);
      }
      continue;
    }
    const f = byName.get(name);
    if (f && !seen.has(name)) {
      ordered.push(f);
      seen.add(name);
    }
  }

  for (const pattern of ROSTER_FIELD_FALLBACKS) {
    if (ordered.length >= MAX_ROSTER_COLUMNS) break;
    const match = list.find((f) => !seen.has(f.name) && pattern.test(f.name));
    if (match) {
      ordered.push(match);
      seen.add(match.name);
    }
  }

  return ordered;
}
