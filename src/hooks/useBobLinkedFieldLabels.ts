"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  resolveBobAirtableRecordLabels,
  type BobRosterSchemaField,
} from "@/lib/api";

import { extractAirtableRecordIds } from "@/lib/bobAirtableDisplay";

export type BobAirtableFieldsRow = {
  airtableFields?: Record<string, unknown>;
  school?: string | null;
  track?: string | null;
  coach?: string | null;
  site?: string | null;
  ywStatus?: string | null;
};

const TOP_LEVEL_FIELD_ALIASES: Record<string, keyof BobAirtableFieldsRow> = {
  School: "school",
  Track: "track",
  Coach: "coach",
  Site: "site",
  "YW Status": "ywStatus",
  "Youth Works Status": "ywStatus",
};

function mergedAirtableFields(row: BobAirtableFieldsRow): Record<string, unknown> {
  const fields = { ...(row.airtableFields || {}) };
  for (const [fieldName, topKey] of Object.entries(TOP_LEVEL_FIELD_ALIASES)) {
    const val = row[topKey];
    if (val == null || !String(val).trim()) continue;
    if (fields[fieldName] == null || fields[fieldName] === "") {
      fields[fieldName] = val;
    }
  }
  return fields;
}

type LabelCache = Record<string, Record<string, string>>;

export function useBobLinkedFieldLabels(
  schema: BobRosterSchemaField[] | null | undefined,
  records: BobAirtableFieldsRow[],
  fieldNames: string[],
  overrideLinkedTableIdByFieldName?: Record<string, string>,
) {
  const [cache, setCache] = useState<LabelCache>({});
  const cacheRef = useRef<LabelCache>({});
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    cacheRef.current = cache;
  }, [cache]);

  const linkedTableIdByFieldName = useMemo(() => {
    const m = new Map<string, string>();
    for (const f of schema || []) {
      if (!f?.name) continue;
      if (f.type !== "multipleRecordLinks") continue;
      if (f.linkedTableId) m.set(f.name, f.linkedTableId);
    }
    for (const [fieldName, tableId] of Object.entries(
      overrideLinkedTableIdByFieldName || {},
    )) {
      if (fieldName && tableId) m.set(fieldName, tableId);
    }
    return m;
  }, [schema, overrideLinkedTableIdByFieldName]);

  const linkedFieldNames = useMemo(() => {
    const names = new Set(
      fieldNames.filter((name) => linkedTableIdByFieldName.has(name)),
    );
    for (const f of schema || []) {
      if (f?.type !== "multipleRecordLinks" || !f?.name) continue;
      if (!f.linkedTableId) continue;
      for (const r of records) {
        const fields = mergedAirtableFields(r);
        if (extractAirtableRecordIds(fields[f.name]).length) names.add(f.name);
      }
    }
    return Array.from(names);
  }, [fieldNames, linkedTableIdByFieldName, schema, records]);

  useEffect(() => {
    if (!linkedFieldNames.length || !records.length) return;

    const byTable = new Map<string, Set<string>>();
    for (const r of records) {
      const fields = mergedAirtableFields(r);
      for (const fn of linkedFieldNames) {
        const tableId = linkedTableIdByFieldName.get(fn);
        if (!tableId) continue;
        const ids = extractAirtableRecordIds(fields[fn]);
        const topKey = TOP_LEVEL_FIELD_ALIASES[fn];
        const topIds =
          topKey && r[topKey] ? extractAirtableRecordIds(r[topKey]) : [];
        const allIds = [...new Set([...ids, ...topIds])];
        if (!allIds.length) continue;
        if (!byTable.has(tableId)) byTable.set(tableId, new Set());
        const set = byTable.get(tableId)!;
        for (const id of allIds) set.add(id);
      }
    }

    const tasks: Array<{ tableId: string; ids: string[] }> = [];
    for (const [tableId, idSet] of byTable.entries()) {
      const ids = Array.from(idSet).slice(0, 200);
      const existing = cacheRef.current[tableId] || {};
      const missing = ids.filter((id) => !existing[id]);
      if (missing.length) tasks.push({ tableId, ids: missing });
    }

    if (!tasks.length) return;

    let cancelled = false;
    setResolving(true);

    (async () => {
      try {
        for (const t of tasks) {
          const resp = await resolveBobAirtableRecordLabels({
            tableId: t.tableId,
            recordIds: t.ids,
          });
          if (cancelled) return;

          setCache((prev) => {
            const next = { ...prev };
            const bucket = { ...(next[t.tableId] || {}) };
            for (const [rid, lab] of Object.entries(resp.labels || {})) {
              if (typeof lab === "string" && lab.trim()) bucket[rid] = lab.trim();
            }
            next[t.tableId] = bucket;
            return next;
          });
        }
      } catch {
        // best-effort
      } finally {
        if (!cancelled) setResolving(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [records, linkedFieldNames, linkedTableIdByFieldName]);

  const labelsForField = useCallback(
    (fieldName: string): Record<string, string> => {
      const tableId = linkedTableIdByFieldName.get(fieldName);
      if (!tableId) return {};
      return cache[tableId] || {};
    },
    [cache, linkedTableIdByFieldName],
  );

  return { labelsForField, resolving, linkedTableIdByFieldName };
}
