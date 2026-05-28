import type {
  BobSubmissionStatus,
  BobSubmissionType,
  BobSubmissionsListParams,
} from "@/platform/api/bob/submissions";

export interface SubmissionFilterState {
  type: BobSubmissionType | "";
  status: BobSubmissionStatus | "";
  priority: string;
  severity: string;
  showOnlyMine: boolean;
  search: string;
  excludeArchived: boolean;
  archivedOnly: boolean;
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
};

export function parseFiltersFromSearchParams(
  sp: URLSearchParams,
): SubmissionFilterState {
  return {
    type: (sp.get("type") as BobSubmissionType) || "",
    status: (sp.get("status") as BobSubmissionStatus) || "",
    priority: sp.get("priority") || "",
    severity: sp.get("severity") || "",
    showOnlyMine: sp.get("mine") === "1",
    search: sp.get("q") || "",
    excludeArchived: sp.get("archived") !== "1" && sp.get("archivedOnly") !== "1",
    archivedOnly: sp.get("archivedOnly") === "1",
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
  return sp;
}

export function filtersToListParams(
  filters: SubmissionFilterState,
  debouncedSearch: string,
  myUserId: string | null,
): BobSubmissionsListParams {
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
    limit: 300,
  };
}
