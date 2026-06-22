/** FY26 BoB user-facing terminology — display labels only (not API/Airtable field names). */

/** Pod = the unit a Site Supporter + Fellow (coach) support (often two program tracks). */
export const BOB_POD_SINGULAR = "Pod";
export const BOB_POD_PLURAL = "Pods";
export const BOB_MY_POD = "My Pod";

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
  const s = String(label ?? "").trim();
  if (!s) return s;
  if (/^NextGen Innovators:\s*Content Creation/i.test(s)) {
    return "Content Creation & Marketing";
  }
  return s;
}
