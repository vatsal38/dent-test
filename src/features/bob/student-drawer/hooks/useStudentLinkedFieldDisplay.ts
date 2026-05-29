"use client";

import { useCallback, useMemo } from "react";
import type { BobStudent } from "@/platform/api/bob/students";
import { useBobLinkedFieldLabels } from "@/hooks/useBobLinkedFieldLabels";
import { useBobRosterSchema } from "@/platform/query/hooks/useBobStudents";
import {
  cellDisplayValue,
  extractAirtableRecordIds,
} from "@/lib/bobAirtableDisplay";

/** Merge Mongo top-level fields into airtableFields for linked-record resolution. */
export function buildStudentLabelFields(
  student: BobStudent,
): Record<string, unknown> {
  const fields = { ...(student.airtableFields || {}) } as Record<string, unknown>;
  const assign = (key: string, val?: string | null) => {
    if (val == null || !String(val).trim()) return;
    if (fields[key] == null || fields[key] === "") fields[key] = val;
  };
  assign("School", student.school);
  assign("Track", student.track);
  assign("Coach", student.coach);
  assign("Site", student.site);
  assign("YW Status", student.ywStatus);
  assign("Youth Works Status", student.ywStatus);
  return fields;
}

export function useStudentLinkedFieldDisplay(
  student: BobStudent | null | undefined,
) {
  const { data: schemaRes } = useBobRosterSchema();
  const schema = schemaRes?.fields ?? null;

  const linkedSchemaNames = useMemo(
    () =>
      (schema || [])
        .filter((f) => f?.type === "multipleRecordLinks" && f?.name)
        .map((f) => f.name as string),
    [schema],
  );

  const fieldName = useCallback(
    (patterns: RegExp[], fallback?: string) => {
      const hit = linkedSchemaNames.find((n) => patterns.some((p) => p.test(n)));
      return hit || fallback || "";
    },
    [linkedSchemaNames],
  );

  const trackField = fieldName(
    [/final track/i, /^track$/i, /program\s*track/i, /\btrack\b/i],
    "Track",
  );
  const schoolField = fieldName(
    [/^school$/i, /student.*school/i, /\bsite\b/i, /organization/i],
    "School",
  );
  const coachField = fieldName([/^coach$/i, /case\s*manager/i], "Coach");
  const siteField = fieldName([/linked site/i, /^site$/i, /bob.*site/i], "Site");

  const labelFieldNames = useMemo(() => {
    const names = new Set<string>([
      trackField,
      schoolField,
      coachField,
      siteField,
      "School",
      "Track",
      "Coach",
      "Grade",
      "Pod",
      "Site",
      "Programs",
      "YW Status",
      "Youth Works Status",
      ...linkedSchemaNames,
    ]);
    return Array.from(names).filter(Boolean);
  }, [trackField, schoolField, coachField, siteField, linkedSchemaNames]);

  const records = useMemo(() => {
    if (!student) return [];
    return [{ airtableFields: buildStudentLabelFields(student) }];
  }, [student]);

  const { labelsForField, resolving } = useBobLinkedFieldLabels(
    schema,
    records,
    labelFieldNames,
  );

  const resolveLinked = useCallback(
    (field: string, ...values: (unknown | undefined)[]) => {
      const labelMap = labelsForField(field);
      for (const v of values) {
        if (v == null || v === "") continue;
        const ids = extractAirtableRecordIds(v);
        const hasUnresolved = ids.some((id) => !labelMap[id]);
        if (ids.length > 0 && hasUnresolved && resolving) return "Loading…";
        const out = cellDisplayValue(v, labelMap);
        if (out === "…" && resolving) return "Loading…";
        if (out && out !== "—") return out;
      }
      return "—";
    },
    [labelsForField, resolving],
  );

  const fields = student ? buildStudentLabelFields(student) : {};

  return {
    schema,
    fieldName,
    trackField,
    schoolField,
    coachField,
    siteField,
    fields,
    labelsForField,
    resolving,
    resolveLinked,
    school: student
      ? resolveLinked(
          schoolField,
          fields[schoolField],
          fields.School,
          student.school,
        )
      : "—",
    track: student
      ? resolveLinked(trackField, fields[trackField], fields.Track, student.track)
      : "—",
    coach: student
      ? resolveLinked(coachField, fields[coachField], fields.Coach, student.coach)
      : "—",
    site: student
      ? resolveLinked(siteField, fields[siteField], fields.Site, student.site)
      : "—",
  };
}
