/** FY26 BoB user-facing terminology — display labels only (not API/Airtable field names). */

/** Program track — coaches and site supporters are assigned to support one or more tracks. */
export const BOB_POD_SINGULAR = "Track";
export const BOB_POD_PLURAL = "Tracks";
export const BOB_MY_POD = "My Track";

/** Staff role title — Support Squad covers site supporters, fellows, and coaches when assigned on a track. */
export const BOB_SITE_SUPPORTER = "Support Squad";
/** @deprecated Alias — same as BOB_SITE_SUPPORTER */
export const BOB_SUPPORT_SQUAD = BOB_SITE_SUPPORTER;

const FIELD_DISPLAY_LABELS: Record<string, string> = {
  Pod: BOB_POD_SINGULAR,
  "Start Date @ Dent": "First year",
  "Start Date at Dent": "First year",
  "First Year at Dent": "First year",
  "First year at Dent": "First year",
  "Graduation Year": "Grad year",
  "2026-27 Grade": "2026-27 Grade",
};

export function formatBobFieldDisplayName(name: string): string {
  return FIELD_DISPLAY_LABELS[name] ?? name;
}

/** Normalize legacy track names for consistent UI copy (ticket 44B).
 * Prefer short Track Name — strip “Bet on Baltimore - 2026 - Summer” program season. */
export function formatBobTrackDisplayLabel(label: string | null | undefined): string {
  let s = String(label ?? "").trim();
  if (!s) return s;

  const programSeason =
    /bet\s*on\s*baltimore\s*[-–—]\s*2026\s*[-–—]\s*summer/i;
  const programLike =
    /bet\s*on\s*baltimore|2026\s*[-–—]\s*summer|summer\s*'?26/i;

  const pipeParts = s.split("|").map((p) => p.trim()).filter(Boolean);
  if (pipeParts.length > 1) {
    const trackPart = pipeParts.find((p) => !programLike.test(p));
    if (trackPart) s = trackPart;
  }

  // Strip full program season as prefix, suffix, or middle segment.
  s = s
    .replace(
      /^Bet\s+on\s+Baltimore\s*[-–—]\s*2026\s*[-–—]\s*Summer\s*[-–—|:\s]*/i,
      "",
    )
    .replace(
      /\s*[-–—|:]\s*Bet\s+on\s+Baltimore\s*[-–—]\s*2026\s*[-–—]\s*Summer\s*$/i,
      "",
    )
    .replace(programSeason, "")
    .replace(/^[-–—|:\s]+|[-–—|:\s]+$/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  if (/^NextGen Innovators:\s*Content Creation/i.test(s)) {
    return "Content Creation & Marketing";
  }
  if (/^NextGen Innovators\s*[-–—]\s*Content Creation/i.test(s)) {
    return "Content Creation & Marketing";
  }
  return s;
}
