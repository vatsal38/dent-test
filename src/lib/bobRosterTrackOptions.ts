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

function isExcludedRosterTrackLabel(label: string): boolean {
  const s = String(label || "").trim();
  if (!s) return true;
  return /^applicant$/i.test(s) || /^global$/i.test(s);
}

/**
 * Track labels for scope filters — sourced from live roster facet counts (not hardcoded).
 */
export function rosterTrackFilterOptions(
  facets: BobStudentsFacetsResponse | null | undefined,
): RosterTrackOption[] {
  if (!facets) return [];

  return (facets.bob26TrackSites ?? [])
    .map((row) => {
      const canonical = formatBobTrackDisplayLabel(String(row.value ?? "").trim());
      return {
        value: canonical,
        label: canonical,
        count: row.count ?? 0,
      };
    })
    .filter((row) => row.value.length > 0 && !isExcludedRosterTrackLabel(row.value))
    .sort((a, b) =>
      a.label.localeCompare(b.label, undefined, { sensitivity: "base" }),
    );
}

/** Same rules as roster API track filter — canonical labels plus raw Airtable prefixes. */
export function rosterTrackLabelMatches(
  trackFilter: string,
  label: string,
): boolean {
  const want = String(trackFilter ?? "").trim();
  const norm = String(label ?? "").trim();
  if (!want || !norm) return false;
  if (/^rec[a-zA-Z0-9]+$/i.test(norm)) return false;

  const wantCanonical = formatBobTrackDisplayLabel(want);
  const labelCanonical = formatBobTrackDisplayLabel(norm);
  if (
    wantCanonical &&
    labelCanonical &&
    wantCanonical.toLowerCase() === labelCanonical.toLowerCase()
  ) {
    return true;
  }

  const escaped = want.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (new RegExp(`^\\s*${escaped}(\\s*\\+|\\s*$)`, "i").test(norm)) {
    return true;
  }

  if (wantCanonical && wantCanonical !== want) {
    const canonEscaped = wantCanonical.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`^\\s*${canonEscaped}(\\s*\\+|\\s*$)`, "i").test(norm)) {
      return true;
    }
    if (new RegExp(canonEscaped, "i").test(norm)) return true;
  }

  return false;
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

/** Whether a student-day has real sign-in/out or hours evidence (not roster baseline / status-only). */
function hasRecordedAttendanceEvidence(day: {
  punches?: Record<
    string,
    { youthTimeIso?: string; timeLabel?: string }
  >;
  totalHoursLabel?: string;
}): boolean {
  if (day.punches) {
    for (const slot of Object.values(day.punches)) {
      if (slot.youthTimeIso) return true;
      if (
        slot.timeLabel &&
        slot.timeLabel !== "—" &&
        slot.timeLabel !== "[object Object]"
      ) {
        return true;
      }
    }
  }
  const raw = String(day.totalHoursLabel || "").replace(/[^\d.]/g, "");
  const hours = Number(raw);
  return Number.isFinite(hours) && hours >= 0.5;
}

/** Whether a student-day counts as present for daily attendance (not hours). */
export function isStudentPresentToday(day: {
  attendanceState: string;
  health: string;
  punches?: Record<
    string,
    { youthTimeIso?: string; timeLabel?: string }
  >;
  totalHoursLabel?: string;
}): boolean {
  if (
    day.attendanceState === "excused" ||
    day.attendanceState === "absent" ||
    day.attendanceState === "auto_filled"
  ) {
    return false;
  }

  if (!hasRecordedAttendanceEvidence(day)) {
    return false;
  }

  return (
    day.attendanceState === "present" ||
    day.attendanceState === "late" ||
    day.health === "complete"
  );
}
