import type { BobRecruitmentListParams } from "@/platform/api/bob/recruitment";
import type { BobRecruitmentFacetsResponse } from "@/platform/api/bob/recruitment";

export type IntakeQueueId =
  | "all"
  | "new"
  | "review"
  | "bob26_transfer"
  | "ready_transfer"
  | "awaiting_approval"
  | "transferred"
  | "approved";

export const DEFAULT_INTAKE_QUEUE_ID: IntakeQueueId = "bob26_transfer";

export interface IntakeQueueDef {
  id: IntakeQueueId;
  label: string;
  description: string;
  /** Applied on top of search / drawer filters */
  listParams: Partial<BobRecruitmentListParams>;
}

export const INTAKE_QUEUES: IntakeQueueDef[] = [
  {
    id: "bob26_transfer",
    label: "BoB '26 bulk transfer",
    description:
      "Not yet in Students & Alums — BoB '26 track, YW status, or programs linked",
    listParams: { transferred: "no", bob26Cohort: "yes" },
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
  {
    id: "all",
    label: "Full history",
    description: "Entire intake pipeline (all statuses)",
    listParams: {},
  },
];

export function getIntakeQueue(id: string | null | undefined): IntakeQueueDef {
  return (
    INTAKE_QUEUES.find((q) => q.id === id) ??
    INTAKE_QUEUES.find((q) => q.id === DEFAULT_INTAKE_QUEUE_ID)!
  );
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
    case "bob26_transfer":
      return p.bob26NotTransferred ?? Math.max(0, p.withPrograms - p.transferred);
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
