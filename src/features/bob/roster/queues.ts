import type {
  BobInterviewStage,
  BobStudentStatus,
  BobStudentsListParams,
} from "@/platform/api/bob/students";
import type { BobStudentsFacetsResponse } from "@/platform/api/bob/students";

export type RosterQueueId =
  | "all"
  | "active"
  | "inactive"
  | "placed"
  | "interview";

export interface RosterQueueDef {
  id: RosterQueueId;
  label: string;
  description: string;
  listParams: Partial<BobStudentsListParams>;
}

export const ROSTER_QUEUES: RosterQueueDef[] = [
  {
    id: "all",
    label: "All students",
    description: "Full operational roster",
    listParams: {},
  },
  {
    id: "active",
    label: "Active",
    description: "Currently enrolled",
    listParams: { status: "active" as BobStudentStatus },
  },
  {
    id: "inactive",
    label: "Inactive",
    description: "Not currently active in program",
    listParams: { status: "inactive" as BobStudentStatus },
  },
  {
    id: "interview",
    label: "In interview",
    description: "Interview pipeline in progress",
    listParams: { interviewStage: "interview" as BobInterviewStage },
  },
  {
    id: "placed",
    label: "Placed",
    description: "Placed in program sites",
    listParams: { interviewStage: "placed" as BobInterviewStage },
  },
];

export function getRosterQueue(id: string | null | undefined): RosterQueueDef {
  return ROSTER_QUEUES.find((q) => q.id === id) ?? ROSTER_QUEUES[0];
}

export function rosterQueueCount(
  queueId: RosterQueueId,
  facets: BobStudentsFacetsResponse | null | undefined,
): number | null {
  if (!facets) return null;
  const total = facets.pipeline?.total;
  switch (queueId) {
    case "all":
      return total ?? null;
    case "active":
      return facetCount(facets.statuses, "active");
    case "inactive":
      return facetCount(facets.statuses, "inactive");
    case "interview":
      return facetCount(facets.interviewStages, "interview");
    case "placed":
      return facetCount(facets.interviewStages, "placed");
    default:
      return null;
  }
}

function facetCount(
  options: Array<{ value: string; count: number }> | undefined,
  value: string,
): number | null {
  const row = options?.find(
    (o) => o.value.toLowerCase() === value.toLowerCase(),
  );
  return row?.count ?? null;
}
