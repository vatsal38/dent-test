/** FY26 BoB user-facing terminology — display labels only (not API/Airtable field names). */

const FIELD_DISPLAY_LABELS: Record<string, string> = {
  Pod: "Track",
  Site: "Track",
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
