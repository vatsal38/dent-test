/**
 * Shared Airtable field names for Students & Alums (roster).
 * Keep in sync with dent-be/lib/bobRosterFieldConstants.js
 */
export const BOB25_TRACK_SITE_LOOKUP_FIELDS = [
  "Track - Site (from BoB '25 Final Track)",
  "Track - Site (from BOB '25 FINAL TRACK)",
] as const;

export const BOB26_TRACK_FIELD_NAMES = ["BoB '26 Track", "BOB '26 Track"] as const;

export const BOB26_TRACK_SITE_LOOKUP_FIELDS = [
  "Track - Site (from BoB '26 Track)",
  "Track - Site (from BOB '26 Track)",
] as const;

export const ROSTER_TRACK_PLACEMENT_2026_FIELD = "2026 Track Placement";

export const ROSTER_YW_STATUS_FIELD_NAMES = [
  "Youth Works BoB '26 Status (Pay Source)",
  "Youth Works BoB '26 Status",
  "Youth Works BoB ’26 Status",
  "Youth Works Status",
  "YW Status",
  "BoB '24 YW Status",
] as const;

export const INDUSTRY_CREDENTIAL_FIELD_NAMES = [
  "Industry Credential",
  "Industry Credentials",
  "Industry Certificate",
  "Has Industry Credential",
] as const;

export function isYouthWorksStatusField(name: string): boolean {
  return /youth\s*works|yw\s*status|bob\s*[''\u2019]?\d{2}\s*yw\s*status/i.test(
    name,
  );
}

export function isTrackSiteField(name: string): boolean {
  return /track\s*-\s*site\s*\(from\s*bob/i.test(name);
}

export function isBob26TrackField(name: string): boolean {
  return /bob\s*[''\u2019]?26\s*track/i.test(name);
}

export function isSystemFilterRosterField(name: string): boolean {
  return (
    isTrackSiteField(name) ||
    isBob26TrackField(name) ||
    isYouthWorksStatusField(name) ||
    /^2026\s*track\s*placement$/i.test(name.trim()) ||
    /^bob\s*[''\u2019]?25\s*final\s*track$/i.test(name.trim())
  );
}
