"use client";

import { useEffect, useMemo, useState } from "react";
import { Drawer } from "@/components/Drawer";
import type { BobStudentsFacetsResponse, BobRosterSchemaField } from "@/lib/api";
import {
  EMPTY_ROSTER_FILTERS,
  FILTER_OPERATORS,
  buildFilterFieldCatalog,
  conditionIsComplete,
  countActiveRosterFilters,
  countDrawerRosterFilters,
  createEmptyCondition,
  facetOptionsForField,
  formatBooleanValue,
  formatConditionChip,
  operatorsForField,
  type RosterFilterCondition,
  type RosterTableFilterState,
} from "@/lib/bobRosterFilters";

export type { RosterTableFilterState } from "@/lib/bobRosterFilters";
export {
  EMPTY_ROSTER_FILTERS,
  countActiveRosterFilters,
  countDrawerRosterFilters,
};

function ConditionRow({
  condition,
  index,
  match,
  fieldCatalog,
  facets,
  onChange,
  onRemove,
  onMatchChange,
}: {
  condition: RosterFilterCondition;
  index: number;
  match: "and" | "or";
  fieldCatalog: ReturnType<typeof buildFilterFieldCatalog>;
  facets: BobStudentsFacetsResponse | null;
  onChange: (next: RosterFilterCondition) => void;
  onRemove: () => void;
  onMatchChange: (m: "and" | "or") => void;
}) {
  const def = fieldCatalog.find((f) => f.id === condition.field);
  const ops = operatorsForField(def);
  const opMeta = FILTER_OPERATORS.find((o) => o.id === condition.operator);
  const options = facetOptionsForField(condition.field, facets);
  const showSelect =
    options.length > 0 && ["is", "is_not"].includes(condition.operator);
  const showBoolean =
    def?.kind === "boolean" && opMeta?.needsValue;

  return (
    <div className="flex flex-wrap items-start gap-2">
      {index === 0 ? (
        <span className="w-14 shrink-0 pt-2 text-xs font-medium text-gray-500">
          Where
        </span>
      ) : index === 1 ? (
        <select
          value={match}
          onChange={(e) => onMatchChange(e.target.value as "and" | "or")}
          className="w-14 shrink-0 rounded-md border border-gray-300 bg-white px-1.5 py-2 text-xs font-medium text-gray-700"
          aria-label="Match mode"
        >
          <option value="and">and</option>
          <option value="or">or</option>
        </select>
      ) : (
        <span className="w-14 shrink-0 pt-2 text-xs font-medium text-gray-500 capitalize">
          {match}
        </span>
      )}

      <select
        value={condition.field}
        onChange={(e) => {
          const field = e.target.value;
          const nextDef = fieldCatalog.find((f) => f.id === field);
          const allowed = operatorsForField(nextDef);
          onChange({
            ...condition,
            field,
            operator: allowed[0]?.id ?? "contains",
            value: "",
          });
        }}
        className="min-w-[140px] flex-1 rounded-md border border-gray-300 bg-white px-2 py-2 text-sm"
      >
        {Object.entries(
          fieldCatalog.reduce<Record<string, typeof fieldCatalog>>((acc, f) => {
            if (!acc[f.group]) acc[f.group] = [];
            acc[f.group].push(f);
            return acc;
          }, {}),
        ).map(([group, fields]) => (
          <optgroup key={group} label={group}>
            {fields.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>

      <select
        value={condition.operator}
        onChange={(e) =>
          onChange({
            ...condition,
            operator: e.target.value as RosterFilterCondition["operator"],
            value: FILTER_OPERATORS.find((o) => o.id === e.target.value)?.needsValue
              ? condition.value
              : "",
          })
        }
        className="w-[148px] shrink-0 rounded-md border border-gray-300 bg-white px-2 py-2 text-sm"
      >
        {ops.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>

      {opMeta?.needsValue ? (
        showSelect ? (
          <select
            value={condition.value}
            onChange={(e) => onChange({ ...condition, value: e.target.value })}
            className="min-w-[120px] flex-1 rounded-md border border-gray-300 bg-white px-2 py-2 text-sm"
          >
            <option value="">Select…</option>
            {options.map((v) => (
              <option key={v} value={v}>
                {def?.kind === "boolean" ? formatBooleanValue(v) : v}
              </option>
            ))}
          </select>
        ) : showBoolean ? (
          <select
            value={condition.value}
            onChange={(e) => onChange({ ...condition, value: e.target.value })}
            className="min-w-[100px] flex-1 rounded-md border border-gray-300 bg-white px-2 py-2 text-sm"
          >
            <option value="">Select…</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        ) : (
          <input
            type="text"
            value={condition.value}
            onChange={(e) => onChange({ ...condition, value: e.target.value })}
            placeholder="Enter a value"
            className="min-w-[120px] flex-1 rounded-md border border-gray-300 bg-white px-2 py-2 text-sm"
          />
        )
      ) : (
        <span className="flex-1 pt-2 text-xs text-gray-400 italic">—</span>
      )}

      <button
        type="button"
        onClick={onRemove}
        className="shrink-0 rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
        aria-label="Remove condition"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

function AirtableFilterBuilder({
  draft,
  schema,
  facets,
  facetsLoading,
  onChange,
}: {
  draft: RosterTableFilterState;
  schema: BobRosterSchemaField[] | null;
  facets: BobStudentsFacetsResponse | null;
  facetsLoading?: boolean;
  onChange: (next: RosterTableFilterState) => void;
}) {
  const fieldCatalog = useMemo(() => buildFilterFieldCatalog(schema), [schema]);

  const conditions =
    draft.conditions.length > 0 ? draft.conditions : [createEmptyCondition()];

  function updateCondition(id: string, next: RosterFilterCondition) {
    onChange({
      ...draft,
      conditions: conditions.map((c) => (c.id === id ? next : c)),
    });
  }

  function removeCondition(id: string) {
    const next = conditions.filter((c) => c.id !== id);
    onChange({
      ...draft,
      conditions: next.length > 0 ? next : [createEmptyCondition()],
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        In this view, show records
      </p>

      {facetsLoading ? (
        <p className="text-xs text-gray-500">Loading field options…</p>
      ) : null}

      <div className="rounded-lg border border-gray-200 bg-gray-50/80 p-3 space-y-3">
        {conditions.map((c, index) => (
          <ConditionRow
            key={c.id}
            condition={c}
            index={index}
            match={draft.match}
            fieldCatalog={fieldCatalog}
            facets={facets}
            onChange={(next) => updateCondition(c.id, next)}
            onRemove={() => removeCondition(c.id)}
            onMatchChange={(match) => onChange({ ...draft, match })}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={() =>
          onChange({
            ...draft,
            conditions: [...conditions, createEmptyCondition()],
          })
        }
        className="text-sm font-medium text-blue-600 hover:text-blue-800"
      >
        + Add condition
      </button>

      <p className="text-[11px] text-gray-500 leading-relaxed">
        Tip: use <span className="font-medium">contains</span> for partial text,{" "}
        <span className="font-medium">is</span> for exact matches. Pipeline fields support
        Yes/No for Airtable sync and boolean fields.
      </p>
    </div>
  );
}

/** Inline search + Filters button (drawer holds Airtable-style conditions). */
export function RosterRecordsToolbar({
  filters,
  facets,
  facetsLoading,
  schema,
  drawerOpen,
  onDrawerOpenChange,
  onSearchChange,
  onApplyDrawerFilters,
  onClearDrawerFilters,
}: {
  filters: RosterTableFilterState;
  facets: BobStudentsFacetsResponse | null;
  facetsLoading?: boolean;
  schema: BobRosterSchemaField[] | null;
  drawerOpen: boolean;
  onDrawerOpenChange: (open: boolean) => void;
  onSearchChange: (search: string) => void;
  onApplyDrawerFilters: (drawer: Omit<RosterTableFilterState, "search">) => void;
  onClearDrawerFilters: () => void;
}) {
  const [draft, setDraft] = useState(filters);
  const drawerActive = countDrawerRosterFilters(filters);
  const fieldCatalog = useMemo(() => buildFilterFieldCatalog(schema), [schema]);

  useEffect(() => {
    if (drawerOpen) {
      setDraft(
        filters.conditions.length > 0
          ? filters
          : { ...filters, conditions: [createEmptyCondition()] },
      );
    }
  }, [drawerOpen, filters]);

  function applyAndClose() {
    const complete = draft.conditions.filter(conditionIsComplete);
    onApplyDrawerFilters({
      match: draft.match,
      conditions: complete,
    });
    onDrawerOpenChange(false);
  }

  function clearDrawer() {
    const cleared = {
      ...EMPTY_ROSTER_FILTERS,
      search: filters.search,
    };
    setDraft({ ...cleared, conditions: [createEmptyCondition()] });
    onClearDrawerFilters();
  }

  function removeConditionChip(id: string) {
    const nextConditions = filters.conditions.filter((c) => c.id !== id);
    onApplyDrawerFilters({
      match: filters.match,
      conditions: nextConditions,
    });
  }

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="relative flex-1 min-w-0">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="search"
            placeholder="Search name, email, phone, school, track, coach…"
            value={filters.search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>
        <button
          type="button"
          onClick={() => onDrawerOpenChange(true)}
          className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium shrink-0 transition-colors ${
            drawerActive > 0
              ? "border-blue-300 bg-blue-50 text-blue-800"
              : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          Filter
          {drawerActive > 0 ? (
            <span className="inline-flex min-w-[1.25rem] h-5 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-semibold px-1.5">
              {drawerActive}
            </span>
          ) : null}
        </button>
      </div>

      {drawerActive > 0 ? (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {filters.match === "or" ? (
            <span className="text-xs font-medium text-gray-500 mr-1">Match any:</span>
          ) : null}
          {filters.conditions.map((c) =>
            conditionIsComplete(c) ? (
              <button
                key={c.id}
                type="button"
                onClick={() => removeConditionChip(c.id)}
                className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-900 border border-blue-200 hover:bg-blue-100 max-w-full"
                title={formatConditionChip(c, fieldCatalog)}
              >
                <span className="truncate max-w-[280px]">
                  {formatConditionChip(c, fieldCatalog)}
                </span>
                <span className="text-blue-500 shrink-0" aria-hidden>
                  ×
                </span>
              </button>
            ) : null,
          )}
          <button
            type="button"
            onClick={onClearDrawerFilters}
            className="text-xs font-medium text-gray-500 hover:text-blue-700"
          >
            Clear all
          </button>
        </div>
      ) : null}

      <Drawer
        open={drawerOpen}
        onClose={() => onDrawerOpenChange(false)}
        widthClassName="w-full sm:w-[520px]"
        panelClassName="border-l border-gray-200"
      >
        <div className="flex flex-col min-h-full bg-white">
          <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-200 bg-white">
            <div className="flex items-center gap-2">
              <svg
                className="w-4 h-4 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              <h2 className="text-sm font-semibold text-gray-900">Filter</h2>
            </div>
            <button
              type="button"
              onClick={() => onDrawerOpenChange(false)}
              className="inline-flex h-8 w-8 items-center justify-center rounded text-gray-500 hover:bg-gray-100"
              aria-label="Close filters"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4">
            <AirtableFilterBuilder
              draft={draft}
              schema={schema}
              facets={facets}
              facetsLoading={facetsLoading}
              onChange={setDraft}
            />
          </div>

          <div className="sticky bottom-0 flex items-center justify-between gap-2 px-4 py-3 border-t border-gray-200 bg-white">
            <button
              type="button"
              onClick={clearDrawer}
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Clear all
            </button>
            <button
              type="button"
              onClick={applyAndClose}
              className="px-5 py-2 rounded-md bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
            >
              Apply filters
            </button>
          </div>
        </div>
      </Drawer>
    </>
  );
}

/** @deprecated Use RosterRecordsToolbar */
export function RosterTableFilters(props: {
  filters: RosterTableFilterState;
  facets: BobStudentsFacetsResponse | null;
  facetsLoading?: boolean;
  schema?: BobRosterSchemaField[] | null;
  onChange: (next: RosterTableFilterState) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <RosterRecordsToolbar
      filters={props.filters}
      facets={props.facets}
      facetsLoading={props.facetsLoading}
      schema={props.schema ?? null}
      drawerOpen={open}
      onDrawerOpenChange={setOpen}
      onSearchChange={(search) => props.onChange({ ...props.filters, search })}
      onApplyDrawerFilters={(drawer) =>
        props.onChange({ ...props.filters, ...drawer })
      }
      onClearDrawerFilters={() =>
        props.onChange({
          ...props.filters,
          ...EMPTY_ROSTER_FILTERS,
          search: props.filters.search,
        })
      }
    />
  );
}
