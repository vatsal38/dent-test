import type {
  BobSubmissionStatus,
  BobSubmissionType,
  BobSubmissionsListParams,
} from "@/platform/api/bob/submissions";

/** Hidden from the default operations inbox (incidents + wellness focus). */
export const OPS_INBOX_EXCLUDED_TYPES: BobSubmissionType[] = [
  "blitz_points",
  "progress_update",
  "anonymous_feedback",
  "parent_contact",
  "dent_testimony",
];

export interface SubmissionFilterState {
  type: BobSubmissionType | "";
  status: BobSubmissionStatus | "";
  priority: string;
  severity: string;
  showOnlyMine: boolean;
  search: string;
  excludeArchived: boolean;
  archivedOnly: boolean;
  /** When false (default), blitz / progress / feedback types are excluded unless a type filter is set. */
  includeAllTypes: boolean;
}

export const DEFAULT_SUBMISSION_FILTERS: SubmissionFilterState = {
  type: "",
  status: "",
  priority: "",
  severity: "",
  showOnlyMine: false,
  search: "",
  excludeArchived: true,
  archivedOnly: false,
  includeAllTypes: false,
};

export function parseFiltersFromSearchParams(
  sp: URLSearchParams,
): SubmissionFilterState {
  const type = (sp.get("type") as BobSubmissionType) || "";
  return {
    type,
    status: (sp.get("status") as BobSubmissionStatus) || "",
    priority: sp.get("priority") || "",
    severity: sp.get("severity") || "",
    showOnlyMine: sp.get("mine") === "1",
    search: sp.get("q") || "",
    excludeArchived: sp.get("archived") !== "1" && sp.get("archivedOnly") !== "1",
    archivedOnly: sp.get("archivedOnly") === "1",
    includeAllTypes: sp.get("allTypes") === "1" || Boolean(type),
  };
}

export function filtersToSearchParams(
  filters: SubmissionFilterState,
): URLSearchParams {
  const sp = new URLSearchParams();
  if (filters.type) sp.set("type", filters.type);
  if (filters.status) sp.set("status", filters.status);
  if (filters.priority) sp.set("priority", filters.priority);
  if (filters.severity) sp.set("severity", filters.severity);
  if (filters.showOnlyMine) sp.set("mine", "1");
  if (filters.search.trim()) sp.set("q", filters.search.trim());
  if (filters.archivedOnly) sp.set("archivedOnly", "1");
  else if (!filters.excludeArchived) sp.set("archived", "1");
  if (filters.includeAllTypes) sp.set("allTypes", "1");
  return sp;
}

export function filtersToListParams(
  filters: SubmissionFilterState,
  debouncedSearch: string,
  myUserId: string | null,
): BobSubmissionsListParams {
  const excludeTypes =
    !filters.type && !filters.includeAllTypes
      ? OPS_INBOX_EXCLUDED_TYPES
      : undefined;

  return {
    type: filters.type || undefined,
    status: filters.status || undefined,
    priority: filters.priority || undefined,
    severity: filters.severity || undefined,
    assignedTo:
      filters.showOnlyMine && myUserId ? myUserId : undefined,
    search: debouncedSearch.trim() || undefined,
    excludeArchived: filters.archivedOnly ? false : filters.excludeArchived,
    archivedOnly: filters.archivedOnly || undefined,
    excludeTypes,
    limit: 300,
  };
}
