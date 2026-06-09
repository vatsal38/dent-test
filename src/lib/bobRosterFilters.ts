import type { BobRosterSchemaField, BobStudentsFacetsResponse } from "@/lib/api";
import { importantRosterTableColumns } from "@/lib/bobIntakeColumns";
import {
  isSystemFilterRosterField,
  isYouthWorksStatusField,
  isTrackSiteField,
  isBob26TrackField,
  ROSTER_TRACK_PLACEMENT_2026_FIELD,
} from "@/lib/bobRosterFieldConstants";
import {
  FILTER_OPERATORS,
  conditionIsComplete,
  formatBooleanValue,
  operatorsForField,
  type FilterCondition,
  type FilterFieldDef,
  type FilterMatchMode,
  type FilterOperator,
  type TableFilterState,
} from "@/lib/bobTableFiltersShared";

export type RosterFilterCondition = FilterCondition;
export type RosterTableFilterState = TableFilterState;
export type RosterFilterFieldDef = FilterFieldDef;

export const EMPTY_ROSTER_FILTERS: RosterTableFilterState = {
  search: "",
  match: "and",
  conditions: [],
};

export {
  FILTER_OPERATORS,
  conditionIsComplete,
  operatorsForField,
  formatBooleanValue,
};

function newId() {
  return `fc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function createEmptyCondition(fieldId?: string): RosterFilterCondition {
  const fields = buildFilterFieldCatalog(null);
  const first = fieldId || fields[0]?.id || "sys:status";
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
): RosterFilterFieldDef[] {
  const system: RosterFilterFieldDef[] = [
    {
      id: "sys:status",
      label: "Student status",
      group: "Roster",
      kind: "select",
      path: "status",
    },
    {
      id: "sys:interviewStage",
      label: "Interview stage",
      group: "Roster",
      kind: "select",
      path: "interviewStage",
    },
    {
      id: "sys:synced",
      label: "Airtable sync",
      group: "Record",
      kind: "boolean",
      path: "synced",
    },
    {
      id: "sys:name",
      label: "Name",
      group: "Record",
      kind: "text",
      path: "name",
    },
    {
      id: "sys:email",
      label: "Email",
      group: "Contact",
      kind: "text",
      path: "email",
    },
    {
      id: "sys:phone",
      label: "Phone",
      group: "Contact",
      kind: "text",
      path: "phone",
    },
    {
      id: "sys:school",
      label: "School",
      group: "School",
      kind: "text",
      path: "school",
    },
    {
      id: "sys:track",
      label: "Track site",
      group: "Program",
      kind: "select",
      path: "track",
    },
    {
      id: "sys:bob26Track",
      label: "BoB '26 track",
      group: "Program",
      kind: "select",
      path: "bob26Track",
    },
    {
      id: "sys:trackPlacement2026",
      label: "2026 Track Placement",
      group: "Program",
      kind: "select",
      path: "trackPlacement2026",
    },
    {
      id: "sys:ywStatus",
      label: "Youth Works status",
      group: "Program",
      kind: "select",
      path: "ywStatus",
    },
    {
      id: "sys:coach",
      label: "Coach",
      group: "Program",
      kind: "select",
      path: "coach",
    },
  ];

  const airtable = importantRosterTableColumns(schema)
    .filter((f) => !isSystemFilterRosterField(f.name))
    .map((f) => ({
    id: `airtable:${f.name}`,
    label: f.name,
    group: "Airtable fields",
    kind: (/status|stage|grade|school|track|coach|pod|pronoun/i.test(f.name)
      ? "select"
      : "text") as "text" | "select",
    path: `airtableFields.${f.name}`,
  }));

  const seen = new Set<string>();
  return [...system, ...airtable].filter((f) => {
    if (seen.has(f.id)) return false;
    seen.add(f.id);
    return true;
  });
}

export function countDrawerRosterFilters(f: RosterTableFilterState): number {
  return f.conditions.filter(conditionIsComplete).length;
}

export function countActiveRosterFilters(f: RosterTableFilterState): number {
  return (f.search.trim() ? 1 : 0) + countDrawerRosterFilters(f);
}

export function formatConditionChip(
  c: RosterFilterCondition,
  fieldCatalog: RosterFilterFieldDef[],
): string {
  const def = fieldCatalog.find((x) => x.id === c.field);
  const label = def?.label || c.field;
  const op =
    FILTER_OPERATORS.find((o) => o.id === c.operator)?.label || c.operator;
  if (!FILTER_OPERATORS.find((o) => o.id === c.operator)?.needsValue) {
    return `${label} ${op}`;
  }
  return `${label} ${op} “${c.value}”`;
}

export function serializeFiltersForApi(
  f: RosterTableFilterState,
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
  facets: BobStudentsFacetsResponse | null,
): string[] {
  if (!facets) return [];
  switch (fieldId) {
    case "sys:status":
      return facets.statuses.map((x) => x.value);
    case "sys:interviewStage":
      return facets.interviewStages.map((x) => x.value);
    case "sys:synced":
      return ["yes", "no"];
    case "sys:track":
      return facets.tracks.map((x) => x.value);
    case "sys:bob26Track":
      return (facets.bob26TrackSites ?? []).map((x) => x.value);
    case "sys:trackPlacement2026":
      return facets.tracks
        .map((x) => x.value)
        .filter((v) => /2026|bet on baltimore/i.test(v));
    case "sys:ywStatus":
      return (facets.ywStatuses ?? []).map((x) => x.value);
    case "sys:coach":
      return facets.coaches.map((x) => x.value);
    case "sys:school":
      return facets.schools.map((x) => x.value);
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
  facets: BobStudentsFacetsResponse,
): string[] {
  if (/school|organization/i.test(name)) {
    return facets.schools.map((x) => x.value);
  }
  if (/grade/i.test(name)) {
    return facets.grades.map((x) => x.value);
  }
  if (isTrackSiteField(name) || /^track$/i.test(name)) {
    return facets.tracks.map((x) => x.value);
  }
  if (isBob26TrackField(name)) {
    return (facets.bob26TrackSites ?? []).map((x) => x.value);
  }
  if (name === ROSTER_TRACK_PLACEMENT_2026_FIELD) {
    return facets.tracks
      .map((x) => x.value)
      .filter((v) => /2026|bet on baltimore/i.test(v));
  }
  if (/coach/i.test(name)) {
    return facets.coaches.map((x) => x.value);
  }
  if (isYouthWorksStatusField(name)) {
    return (facets.ywStatuses ?? []).map((x) => x.value);
  }
  return [];
}
