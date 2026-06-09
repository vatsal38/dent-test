import type { BobRecruitmentFacetsResponse, BobRosterSchemaField } from "@/lib/api";
import { importantIntakeTableColumns } from "@/lib/bobIntakeColumns";
import {
  isSystemFilterIntakeField,
  isYouthWorksBoB26StatusField,
  isTrackPlacement2026Field,
  isReturnerField,
} from "@/lib/bobRecruitmentFieldConstants";

export type FilterMatchMode = "and" | "or";

export type FilterOperator =
  | "contains"
  | "not_contains"
  | "is"
  | "is_not"
  | "is_empty"
  | "is_not_empty";

export type RecruitmentFilterCondition = {
  id: string;
  field: string;
  operator: FilterOperator;
  value: string;
};

export type RecruitmentTableFilterState = {
  search: string;
  match: FilterMatchMode;
  conditions: RecruitmentFilterCondition[];
};

export type RecruitmentFilterFieldDef = {
  id: string;
  label: string;
  group: string;
  kind: "text" | "select" | "boolean";
  /** Mongo / API field key */
  path: string;
};

export const EMPTY_RECRUITMENT_FILTERS: RecruitmentTableFilterState = {
  search: "",
  match: "and",
  conditions: [],
};

export const FILTER_OPERATORS: Array<{
  id: FilterOperator;
  label: string;
  needsValue: boolean;
}> = [
  { id: "contains", label: "contains", needsValue: true },
  { id: "not_contains", label: "does not contain", needsValue: true },
  { id: "is", label: "is", needsValue: true },
  { id: "is_not", label: "is not", needsValue: true },
  { id: "is_empty", label: "is empty", needsValue: false },
  { id: "is_not_empty", label: "is not empty", needsValue: false },
];

function newId() {
  return `fc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function createEmptyCondition(
  fieldId?: string,
): RecruitmentFilterCondition {
  const fields = buildFilterFieldCatalog(null);
  const first = fieldId || fields[0]?.id || "sys:recruitmentStatus";
  const def = fields.find((f) => f.id === first);
  return {
    id: newId(),
    field: first,
    operator: def?.kind === "boolean" ? "is" : "contains",
    value: "",
  };
}

export function buildFilterFieldCatalog(
  schema: BobRosterSchemaField[] | null | undefined,
): RecruitmentFilterFieldDef[] {
  const system: RecruitmentFilterFieldDef[] = [
    {
      id: "sys:recruitmentStatus",
      label: "App status",
      group: "Pipeline",
      kind: "select",
      path: "recruitmentStatus",
    },
    {
      id: "sys:ywStatus",
      label: "Youth Works BoB '26 status (Pay Source)",
      group: "Pipeline",
      kind: "select",
      path: "ywStatus",
    },
    {
      id: "sys:trackPlacement2026",
      label: "2026 Track Placement",
      group: "BoB '26",
      kind: "select",
      path: "trackPlacement2026",
    },
    {
      id: "sys:returner",
      label: "Returner",
      group: "BoB '26",
      kind: "select",
      path: "returner",
    },
    {
      id: "sys:topTrackProgram",
      label: "Top track (program)",
      group: "BoB '26",
      kind: "select",
      path: "topTrackProgram",
    },
    {
      id: "sys:transferred",
      label: "In Students & Alums",
      group: "Pipeline",
      kind: "boolean",
      path: "transferred",
    },
    {
      id: "sys:onRoster",
      label: "On roster",
      group: "Pipeline",
      kind: "boolean",
      path: "onRoster",
    },
    {
      id: "sys:hasPrograms",
      label: "Programs linked",
      group: "Pipeline",
      kind: "boolean",
      path: "hasPrograms",
    },
    {
      id: "sys:synced",
      label: "Airtable sync",
      group: "Record",
      kind: "boolean",
      path: "synced",
    },
    {
      id: "sys:label",
      label: "Name",
      group: "Record",
      kind: "text",
      path: "label",
    },
    {
      id: "sys:email",
      label: "Email",
      group: "Contact",
      kind: "text",
      path: "email",
    },
  ];

  const intake = importantIntakeTableColumns(schema)
    .filter((f) => !isSystemFilterIntakeField(f.name))
    .map((f) => ({
    id: `airtable:${f.name}`,
    label: f.name,
    group: "Intake fields",
    kind: (/status|stage|source|grade|school/i.test(f.name)
      ? "select"
      : "text") as "text" | "select",
    path: `airtableFields.${f.name}`,
  }));

  const seen = new Set<string>();
  return [...system, ...intake].filter((f) => {
    if (seen.has(f.id)) return false;
    seen.add(f.id);
    return true;
  });
}

export function operatorsForField(
  def: RecruitmentFilterFieldDef | undefined,
): typeof FILTER_OPERATORS {
  if (!def) return FILTER_OPERATORS;
  if (def.kind === "boolean") {
    return FILTER_OPERATORS.filter((o) =>
      ["is", "is_not", "is_empty", "is_not_empty"].includes(o.id),
    );
  }
  if (def.kind === "select") {
    return FILTER_OPERATORS.filter((o) =>
      ["is", "is_not", "contains", "not_contains", "is_empty", "is_not_empty"].includes(
        o.id,
      ),
    );
  }
  return FILTER_OPERATORS;
}

export function conditionIsComplete(c: RecruitmentFilterCondition): boolean {
  if (!c.field) return false;
  const op = FILTER_OPERATORS.find((o) => o.id === c.operator);
  if (!op) return false;
  if (!op.needsValue) return true;
  return Boolean(String(c.value ?? "").trim());
}

export function countDrawerRecruitmentFilters(
  f: RecruitmentTableFilterState,
): number {
  return f.conditions.filter(conditionIsComplete).length;
}

export function countActiveRecruitmentFilters(
  f: RecruitmentTableFilterState,
): number {
  return (f.search.trim() ? 1 : 0) + countDrawerRecruitmentFilters(f);
}

export function formatFilterValueLabel(
  fieldId: string,
  value: string,
  programOptions?: Array<{ id: string; label: string }>,
): string {
  if (fieldId === "sys:topTrackProgram" && programOptions?.length) {
    return programOptions.find((p) => p.id === value)?.label ?? value;
  }
  return value;
}

export function formatConditionChip(
  c: RecruitmentFilterCondition,
  fieldCatalog: RecruitmentFilterFieldDef[],
  programOptions?: Array<{ id: string; label: string }>,
): string {
  const def = fieldCatalog.find((x) => x.id === c.field);
  const label = def?.label || c.field;
  const op = FILTER_OPERATORS.find((o) => o.id === c.operator)?.label || c.operator;
  if (!FILTER_OPERATORS.find((o) => o.id === c.operator)?.needsValue) {
    return `${label} ${op}`;
  }
  const valueLabel =
    def?.kind === "boolean"
      ? formatBooleanValue(c.value)
      : formatFilterValueLabel(c.field, c.value, programOptions);
  return `${label} ${op} “${valueLabel}”`;
}

/** Payload for GET /api/bob/recruitment?filters=... */
export function serializeFiltersForApi(
  f: RecruitmentTableFilterState,
): string | undefined {
  const conditions = f.conditions.filter(conditionIsComplete);
  if (conditions.length === 0) return undefined;
  return JSON.stringify({
    match: f.match,
    conditions: conditions.map(({ id: _id, ...rest }) => rest),
  });
}

export function facetOptionsForField(
  fieldId: string,
  facets: BobRecruitmentFacetsResponse | null,
  programOptions?: Array<{ id: string; label: string }>,
): string[] {
  if (!facets) return [];
  switch (fieldId) {
    case "sys:recruitmentStatus":
      return facets.appStatuses.map((x) => x.value);
    case "sys:ywStatus":
      return facets.ywStatuses.map((x) => x.value);
    case "sys:trackPlacement2026":
      return (facets.trackPlacements2026 ?? []).map((x) => x.value);
    case "sys:returner":
      return (facets.returners ?? []).map((x) => x.value);
    case "sys:topTrackProgram":
      return (programOptions ?? [])
        .filter((p) => /2026|bet on baltimore.*2026/i.test(p.label))
        .map((p) => p.id);
    case "sys:transferred":
      return ["yes", "no"];
    case "sys:onRoster":
      return ["yes", "no"];
    case "sys:hasPrograms":
      return ["yes", "no"];
    case "sys:synced":
      return ["yes", "no"];
    default:
      if (fieldId.startsWith("airtable:")) {
        return facetOptionsForAirtableFieldName(
          fieldId.slice("airtable:".length),
          facets,
        );
      }
      return [];
  }
}

function facetOptionsForAirtableFieldName(
  name: string,
  facets: BobRecruitmentFacetsResponse,
): string[] {
  if (/school|organization/i.test(name)) {
    return facets.schools.map((x) => x.value);
  }
  if (/grade/i.test(name)) {
    return facets.grades.map((x) => x.value);
  }
  if (/assign|recruit|counselor/i.test(name)) {
    return facets.assignedTo.map((x) => x.value);
  }
  if (isYouthWorksBoB26StatusField(name)) {
    return facets.ywStatuses.map((x) => x.value);
  }
  if (isTrackPlacement2026Field(name)) {
    return (facets.trackPlacements2026 ?? []).map((x) => x.value);
  }
  if (isReturnerField(name)) {
    return (facets.returners ?? []).map((x) => x.value);
  }
  return [];
}

export function formatBooleanValue(value: string): string {
  if (value === "yes") return "Yes";
  if (value === "no") return "No";
  return value;
}
