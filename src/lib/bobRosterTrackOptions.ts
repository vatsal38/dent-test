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
/** FY26 operational tracks — always offer in attendance filters even when facet counts lag. */
const FY26_ATTENDANCE_TRACKS = [
  "Made@Dent",
  "Denternship",
  "Accelerate Your Dent (AYD)",
  "Content Creation & Marketing",
];

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

/** Facet counts + FY26 track labels (+ optional pod names) for attendance hub filters. */
export function attendanceTrackFilterOptions(
  facets: BobStudentsFacetsResponse | null | undefined,
  pods?: Array<{ name?: string | null; displayLabel?: string | null }>,
): RosterTrackOption[] {
  const merged = new Map<string, RosterTrackOption>();

  for (const row of rosterTrackFilterOptions(facets)) {
    merged.set(row.value.toLowerCase(), row);
  }

  for (const raw of FY26_ATTENDANCE_TRACKS) {
    const canonical = formatBobTrackDisplayLabel(raw);
    if (!canonical || isExcludedRosterTrackLabel(canonical)) continue;
    const key = canonical.toLowerCase();
    if (!merged.has(key)) {
      merged.set(key, { value: canonical, label: canonical, count: 0 });
    }
  }

  for (const pod of pods || []) {
    const raw = String(pod.displayLabel || pod.name || "").trim();
    const canonical = formatBobTrackDisplayLabel(raw);
    if (!canonical || isExcludedRosterTrackLabel(canonical)) continue;
    const key = canonical.toLowerCase();
    if (!merged.has(key)) {
      merged.set(key, { value: canonical, label: canonical, count: 0 });
    }
  }

  return [...merged.values()].sort((a, b) =>
    a.label.localeCompare(b.label, undefined, { sensitivity: "base" }),
  );
}

/** Short labels / URL params → canonical FY26 track filter value. */
const TRACK_FILTER_CANONICAL_ALIASES: Record<string, string> = {
  ayd: "Accelerate Your Dent (AYD)",
  "accelerate your dent": "Accelerate Your Dent (AYD)",
  "content creation": "Content Creation & Marketing",
  denternship: "Denternship",
  "made@dent": "Made@Dent",
  "made at dent": "Made@Dent",
};

/** Regex aliases — keep in sync with dent-be/lib/bobTrackConstants.js */
const TRACK_LABEL_MATCH_ALIASES: Record<string, RegExp[]> = {
  "Accelerate Your Dent (AYD)": [/accelerate\s*your\s*dent/i, /\bayd\b/i],
  "Content Creation & Marketing": [
    /nextgen\s*innovators\s*[-–—:]\s*content\s*creation/i,
    /content\s*creation\s*(?:&|and)\s*marketing/i,
  ],
  "Made@Dent": [/made\s*@?\s*dent/i],
  Denternship: [/denternship/i],
};

export function normalizeTrackFilterValue(track: string): string {
  const raw = String(track ?? "").trim();
  if (!raw) return "";
  const alias = TRACK_FILTER_CANONICAL_ALIASES[raw.toLowerCase()];
  return formatBobTrackDisplayLabel(alias || raw);
}

/** Same rules as roster API track filter — canonical labels plus raw Airtable prefixes. */
export function rosterTrackLabelMatches(
  trackFilter: string,
  label: string,
): boolean {
  const want = normalizeTrackFilterValue(trackFilter);
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

  const aliasPatterns = TRACK_LABEL_MATCH_ALIASES[wantCanonical];
  if (aliasPatterns?.some((rx) => rx.test(norm))) return true;

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

  if (aliasPatterns?.some((rx) => rx.test(labelCanonical))) return true;

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

import { isScheduleAutofillTime } from "@/features/bob/attendance/model/staffRecordDerived";

/** Whether a student-day has real sign-in/out evidence (not roster baseline / status-only). */
function hasRecordedAttendanceEvidence(day: {
  punches?: Record<
    string,
    { youthTimeIso?: string; timeLabel?: string }
  >;
  hasManualCorrection?: boolean;
  staffCorrections?: { hasCorrections?: boolean };
  finalRecord?: {
    morning?: { in?: string; out?: string };
    afternoon?: { in?: string; out?: string };
    totalHours?: string;
  };
}): boolean {
  if (day.punches) {
    for (const slot of Object.values(day.punches)) {
      // Prefer youth punch ISO — timeLabel alone can be Airtable autofill bleed
      if (
        slot.youthTimeIso &&
        !isScheduleAutofillTime(slot.youthTimeIso)
      ) {
        return true;
      }
    }
  }
  if (day.hasManualCorrection || day.staffCorrections?.hasCorrections) {
    return true;
  }
  const final = day.finalRecord;
  if (final) {
    const times = [
      final.morning?.in,
      final.morning?.out,
      final.afternoon?.in,
      final.afternoon?.out,
    ];
    if (
      times.some(
        (t) =>
          Boolean(t) &&
          t !== "—" &&
          !isScheduleAutofillTime(t),
      )
    ) {
      return true;
    }
  }
  // Do not use totalHoursLabel alone — Airtable rollups inflate when autofill
  // sign-outs (12:30 / 6:30 PM) invent hours without real attendance.
  return false;
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
  hasManualCorrection?: boolean;
  staffCorrections?: { hasCorrections?: boolean };
  finalRecord?: {
    morning?: { in?: string; out?: string };
    afternoon?: { in?: string; out?: string };
    totalHours?: string;
  };
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
    day.health === "complete" ||
    day.hasManualCorrection === true ||
    day.staffCorrections?.hasCorrections === true
  );
}
