/** Shared Airtable-style filter types and helpers (recruitment + roster). */

export type FilterMatchMode = "and" | "or";

export type FilterOperator =
  | "contains"
  | "not_contains"
  | "is"
  | "is_not"
  | "is_empty"
  | "is_not_empty";

export type FilterCondition = {
  id: string;
  field: string;
  operator: FilterOperator;
  value: string;
};

export type TableFilterState = {
  search: string;
  match: FilterMatchMode;
  conditions: FilterCondition[];
};

export type FilterFieldDef = {
  id: string;
  label: string;
  group: string;
  kind: "text" | "select" | "boolean";
  path: string;
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

export function operatorsForField(
  def: FilterFieldDef | undefined,
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

export function conditionIsComplete(c: FilterCondition): boolean {
  if (!c.field) return false;
  const op = FILTER_OPERATORS.find((o) => o.id === c.operator);
  if (!op) return false;
  if (!op.needsValue) return true;
  return Boolean(String(c.value ?? "").trim());
}

export function formatBooleanValue(value: string): string {
  if (value === "yes") return "Yes";
  if (value === "no") return "No";
  return value;
}
