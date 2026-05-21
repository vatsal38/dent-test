"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  resolveBobAirtableRecordLabels,
  type BobRosterSchemaField,
} from "@/lib/api";

export type BobAirtableFieldsRow = {
  airtableFields?: Record<string, unknown>;
};
import { extractAirtableRecordIds } from "@/lib/bobAirtableDisplay";

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

  const linkedFieldNames = useMemo(
    () =>
      fieldNames.filter((name) => linkedTableIdByFieldName.has(name)),
    [fieldNames, linkedTableIdByFieldName],
  );

  useEffect(() => {
    if (!linkedFieldNames.length || !records.length) return;

    const byTable = new Map<string, Set<string>>();
    for (const r of records) {
      const fields = (r.airtableFields || {}) as Record<string, unknown>;
      for (const fn of linkedFieldNames) {
        const tableId = linkedTableIdByFieldName.get(fn);
        if (!tableId) continue;
        const ids = extractAirtableRecordIds(fields[fn]);
        if (!ids.length) continue;
        if (!byTable.has(tableId)) byTable.set(tableId, new Set());
        const set = byTable.get(tableId)!;
        for (const id of ids) set.add(id);
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
