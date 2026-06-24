/** FY26 BoB user-facing terminology — display labels only (not API/Airtable field names). */

/** Program track — coaches and site supporters are assigned to support one or more tracks. */
export const BOB_POD_SINGULAR = "Track";
export const BOB_POD_PLURAL = "Tracks";
export const BOB_MY_POD = "My Track";

/** Staff role title — not "Track Supporter". */
export const BOB_SITE_SUPPORTER = "Site Supporter";

const FIELD_DISPLAY_LABELS: Record<string, string> = {
  Pod: BOB_POD_SINGULAR,
};

export function formatBobFieldDisplayName(name: string): string {
  return FIELD_DISPLAY_LABELS[name] ?? name;
}

/** Normalize legacy track names for consistent UI copy. */
export function formatBobTrackDisplayLabel(label: string | null | undefined): string {
  let s = String(label ?? "").trim();
  if (!s) return s;

  const pipeParts = s.split("|").map((p) => p.trim()).filter(Boolean);
  if (pipeParts.length > 1) {
    const programLike =
      /bet\s*on\s*baltimore|2026\s*[-–—]\s*summer|summer\s*'?26/i;
    const trackPart = pipeParts.find((p) => !programLike.test(p));
    if (trackPart) s = trackPart;
  }

  s = s
    .replace(
      /^Bet\s+on\s+Baltimore\s*[-–—]\s*2026\s*[-–—]\s*Summer\s*[-–—|:\s]*/i,
      "",
    )
    .trim();

  if (/^NextGen Innovators:\s*Content Creation/i.test(s)) {
    return "Content Creation & Marketing";
  }
  if (/^NextGen Innovators\s*[-–—]\s*Content Creation/i.test(s)) {
    return "Content Creation & Marketing";
  }
  return s;
}
