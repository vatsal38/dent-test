/**
 * Shared Airtable field names for Youth Apps & Intake (BoB recruitment).
 * Keep in sync with dent-be/lib/bobRecruitmentFieldConstants.js
 */
export const YW_STATUS_FIELD_NAMES = [
  "Youth Works BoB '26 Status (Pay Source)",
  "Youth Works BoB '26 Status",
  "Youth Works BoB ’26 Status",
] as const;

export const TRACK_PLACEMENT_2026_FIELD = "2026 Track Placement";
export const RETURNER_FIELD = "Returner";

export function isYouthWorksBoB26StatusField(name: string): boolean {
  return /youth\s*works.*bob\s*[''\u2019]?26.*status/i.test(name);
}

export function isTrackPlacement2026Field(name: string): boolean {
  return /^2026\s*track\s*placement$/i.test(name.trim());
}

export function isReturnerField(name: string): boolean {
  return /^returner$/i.test(name.trim());
}

/** Intake fields covered by sys: filter ids — hide duplicates in filter catalog. */
export function isSystemFilterIntakeField(name: string): boolean {
  return (
    isYouthWorksBoB26StatusField(name) ||
    isTrackPlacement2026Field(name) ||
    isReturnerField(name)
  );
}
