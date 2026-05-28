import type { BobRecruitmentListParams } from "@/platform/api/bob/recruitment";
import type { BobRecruitmentFacetsResponse } from "@/platform/api/bob/recruitment";

export type IntakeQueueId =
  | "all"
  | "new"
  | "review"
  | "ready_transfer"
  | "awaiting_approval"
  | "transferred"
  | "approved";

export interface IntakeQueueDef {
  id: IntakeQueueId;
  label: string;
  description: string;
  /** Applied on top of search / drawer filters */
  listParams: Partial<BobRecruitmentListParams>;
}

export const INTAKE_QUEUES: IntakeQueueDef[] = [
  {
    id: "all",
    label: "All",
    description: "Full intake pipeline",
    listParams: {},
  },
  {
    id: "new",
    label: "New leads",
    description: "Applications not yet reviewed",
    listParams: { status: "New Lead" },
  },
  {
    id: "review",
    label: "Needs review",
    description: "Pending staff review",
    listParams: { status: "Pending Review" },
  },
  {
    id: "ready_transfer",
    label: "Ready to transfer",
    description: "Reviewed and ready for Students & Alums",
    listParams: { status: "Ready To Transfer", transferred: "no" },
  },
  {
    id: "awaiting_approval",
    label: "Awaiting approval",
    description: "Transferred — approve to roster",
    listParams: { transferred: "yes", onRoster: "no" },
  },
  {
    id: "transferred",
    label: "Transferred",
    description: "On Students & Alums",
    listParams: { transferred: "yes" },
  },
  {
    id: "approved",
    label: "On roster",
    description: "Approved students",
    listParams: { onRoster: "yes" },
  },
];

export function getIntakeQueue(id: string | null | undefined): IntakeQueueDef {
  return INTAKE_QUEUES.find((q) => q.id === id) ?? INTAKE_QUEUES[0];
}

export function intakeQueueCount(
  queueId: IntakeQueueId,
  facets: BobRecruitmentFacetsResponse | null | undefined,
): number | null {
  if (!facets?.pipeline) return null;
  const p = facets.pipeline;
  switch (queueId) {
    case "all":
      return p.total;
    case "new":
      return facetCount(facets.appStatuses, "New Lead");
    case "review":
      return facetCount(facets.appStatuses, "Pending Review");
    case "ready_transfer":
      return facetCount(facets.appStatuses, "Ready To Transfer");
    case "awaiting_approval":
      return Math.max(0, p.transferred - p.onRoster);
    case "transferred":
      return p.transferred;
    case "approved":
      return p.onRoster;
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
