import type { BobStudentsListParams } from "@/platform/api/bob/students";
import type { BobStudentsFacetsResponse } from "@/platform/api/bob/students";

/** Canonical BoB '26 track labels for roster queue tabs. */
export const ROSTER_TRACK_TAB_FILTERS = [
  { id: "track_made_at_dent", label: "Made@Dent", track: "Made@Dent" },
  { id: "track_denternship", label: "Denternship", track: "Denternship" },
  { id: "track_ayd", label: "AYD", track: "Accelerate Your Dent" },
  {
    id: "track_content_creation",
    label: "Content Creation",
    track: "Content Creation",
  },
] as const;

export type RosterQueueId =
  | "bob_cohort"
  | "onboarding_pending"
  | "track_made_at_dent"
  | "track_denternship"
  | "track_ayd"
  | "track_content_creation"
  | "dropped_out";

export interface RosterQueueDef {
  id: RosterQueueId;
  label: string;
  description: string;
  listParams: Partial<BobStudentsListParams>;
}

export const ROSTER_QUEUES: RosterQueueDef[] = [
  {
    id: "bob_cohort",
    label: "All BoB",
    description: "BoB '26 youth marked In Program, Active",
    listParams: { bobCohort: "active" },
  },
  ...ROSTER_TRACK_TAB_FILTERS.map((t) => ({
    id: t.id as RosterQueueId,
    label: t.label,
    description: `${t.label} track roster`,
    listParams: { bobCohort: "active" as const, track: t.track },
  })),
  {
    id: "onboarding_pending",
    label: "Onboarding",
    description: "Parent/youth contract or pre-survey still incomplete",
    listParams: { bobCohort: "active", onboardingReady: "no" },
  },
  {
    id: "dropped_out",
    label: "Dropped out",
    description: "BoB '26 Active Status dropouts and withdrawn students",
    listParams: { bobActiveStatus: "dropped" },
  },
];

export function getRosterQueue(id: string | null | undefined): RosterQueueDef {
  return ROSTER_QUEUES.find((q) => q.id === id) ?? ROSTER_QUEUES[0];
}

/** Youth-facing roster tabs — cohort and track views only. */
export const STUDENT_ROSTER_QUEUES = ROSTER_QUEUES.filter(
  (q) => q.id !== "onboarding_pending" && q.id !== "dropped_out",
);

function facetCount(
  options: Array<{ value: string; count: number }> | undefined,
  value: string,
): number | null {
  const row = options?.find(
    (o) => o.value.toLowerCase() === value.toLowerCase(),
  );
  return row?.count ?? null;
}

function trackFacetCount(
  facets: BobStudentsFacetsResponse | null | undefined,
  trackMatch: string,
): number | null {
  if (!facets?.tracks?.length) return null;
  const needle = trackMatch.toLowerCase();
  const row = facets.tracks.find((t) => {
    const v = t.value.toLowerCase();
    return v.includes(needle) || needle.includes(v);
  });
  return row?.count ?? null;
}

export function rosterQueueCount(
  queueId: RosterQueueId,
  facets: BobStudentsFacetsResponse | null | undefined,
): number | null {
  if (!facets) return null;
  switch (queueId) {
    case "bob_cohort":
      return facets.bobCohort?.active ?? null;
    case "onboarding_pending":
      return facets.onboarding?.incomplete ?? null;
    case "dropped_out":
      return facets.droppedOut?.count ?? facetCount(facets.statuses, "withdrawn");
    case "track_made_at_dent":
      return trackFacetCount(facets, "Made@Dent");
    case "track_denternship":
      return trackFacetCount(facets, "Denternship");
    case "track_ayd":
      return trackFacetCount(facets, "Accelerate Your Dent");
    case "track_content_creation":
      return trackFacetCount(facets, "Content Creation");
    default:
      return null;
  }
}
