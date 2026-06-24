import type { BobStudentsFacetsResponse } from "@/platform/api/bob/students";
import {
  BOB26_TRACK_NAME_LOOKUP_FIELDS,
  BOB26_TRACK_SITE_LOOKUP_FIELDS,
  ROSTER_TRACK_PLACEMENT_2026_FIELD,
} from "@/lib/bobRosterFieldConstants";
import { formatBobTrackDisplayLabel } from "@/lib/bobDisplayTerminology";

export interface RosterTrackOption {
  value: string;
  label: string;
  count: number;
}

/**
 * Track labels for scope filters — sourced from live roster facet counts (not hardcoded).
 */
export function rosterTrackFilterOptions(
  facets: BobStudentsFacetsResponse | null | undefined,
): RosterTrackOption[] {
  if (!facets) return [];

  return (facets.bob26TrackSites ?? [])
    .map((row) => ({
      value: String(row.value ?? "").trim(),
      label: String(row.value ?? "").trim(),
      count: row.count ?? 0,
    }))
    .filter((row) => row.value.length > 0)
    .sort((a, b) =>
      a.label.localeCompare(b.label, undefined, { sensitivity: "base" }),
    );
}

/** Same prefix/exact rules as roster API track filter (`buildTrackSiteQuery` + `is`). */
export function rosterTrackLabelMatches(
  trackFilter: string,
  label: string,
): boolean {
  const want = String(trackFilter ?? "").trim();
  const norm = String(label ?? "").trim();
  if (!want || !norm) return false;
  if (/^rec[a-zA-Z0-9]+$/i.test(norm)) return false;
  const escaped = want.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^\\s*${escaped}(\\s*\\+|\\s*$)`, "i").test(norm);
}

/** Match a roster student against a track filter value (facet label). */
export function studentMatchesRosterTrack(
  student: {
    track?: string | null;
    airtableFields?: Record<string, unknown> | null;
  },
  trackFilter: string,
): boolean {
  const want = String(trackFilter ?? "").trim();
  if (!want) return true;

  const labels: string[] = [];

  if (student.track) {
    labels.push(String(student.track).trim());
  }

  const af = student.airtableFields;
  if (af && typeof af === "object") {
    const scopeFields = [
      ...BOB26_TRACK_NAME_LOOKUP_FIELDS,
      ...BOB26_TRACK_SITE_LOOKUP_FIELDS,
      ROSTER_TRACK_PLACEMENT_2026_FIELD,
    ];
    for (const key of scopeFields) {
      const raw = af[key];
      const arr = Array.isArray(raw) ? raw : raw != null ? [raw] : [];
      for (const v of arr) {
        const s = String(v ?? "").trim();
        if (s) labels.push(s);
      }
    }
  }

  return labels.some((label) => rosterTrackLabelMatches(want, label));
}

/** Canonical FY26 track label for rollups and analytics. */
export function resolveStudentTrackLabel(student: {
  track?: string | null;
  airtableFields?: Record<string, unknown> | null;
}): string {
  const af = student.airtableFields;
  if (af && typeof af === "object") {
    for (const key of BOB26_TRACK_NAME_LOOKUP_FIELDS) {
      const raw = af[key];
      const arr = Array.isArray(raw) ? raw : raw != null ? [raw] : [];
      for (const v of arr) {
        const s = String(v ?? "").trim();
        if (s && !/^rec[a-zA-Z0-9]+$/i.test(s)) {
          return formatBobTrackDisplayLabel(s);
        }
      }
    }
  }

  const labels: string[] = [];

  if (student.track) {
    const t = String(student.track).trim();
    if (t && !/^rec[a-zA-Z0-9]+$/i.test(t)) labels.push(t);
  }

  if (af && typeof af === "object") {
    for (const key of [
      ...BOB26_TRACK_SITE_LOOKUP_FIELDS,
      ROSTER_TRACK_PLACEMENT_2026_FIELD,
    ]) {
      const raw = af[key];
      const arr = Array.isArray(raw) ? raw : raw != null ? [raw] : [];
      for (const v of arr) {
        const s = String(v ?? "").trim();
        if (s && !/^rec[a-zA-Z0-9]+$/i.test(s)) labels.push(s);
      }
    }
  }

  const first = labels.find(Boolean);
  return first ? formatBobTrackDisplayLabel(first) : "Unassigned";
}
