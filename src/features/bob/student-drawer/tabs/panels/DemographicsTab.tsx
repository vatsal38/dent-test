"use client";

import { cellDisplayValue } from "@/lib/bobAirtableDisplay";
import { formatBobFieldDisplayName } from "@/lib/bobDisplayTerminology";
import { studentSummaryRows } from "@/features/bob/roster/recordDisplay";
import { useStudentDrawerContext } from "../../context/StudentDrawerContext";
import { useStudentLinkedFieldDisplay } from "../../hooks/useStudentLinkedFieldDisplay";

const DEMO_GROUPS: { title: string; keys: string[] }[] = [
  {
    title: "Identity",
    keys: ["First Name", "Last Name", "Preferred Name", "Pronouns", "Date of Birth"],
  },
  {
    title: "Contact",
    keys: [
      "Student Email",
      "Email",
      "Student Cell Phone Number",
      "Phone",
      "Address",
      "City",
      "Zip",
    ],
  },
  {
    title: "Family",
    keys: ["Parent/Guardian Name", "Parent Phone", "Emergency Contact"],
  },
  {
    title: "School & program",
    keys: ["School", "Grade", "Track", "Coach", "Pod", "Site"],
  },
];

export function DemographicsTab() {
  const { student } = useStudentDrawerContext();
  const { fields, labelsForField, resolveLinked, school, track, coach, site } =
    useStudentLinkedFieldDisplay(student);

  if (!student) return null;

  const coreRows = studentSummaryRows(student).map((r) => {
    if (r.label === "School") return { ...r, value: school };
    if (r.label === "Track") return { ...r, value: track };
    if (r.label === "Coach") return { ...r, value: coach };
    return r;
  });

  function displayField(key: string, raw: unknown): string {
    if (raw == null || raw === "") return "";
    if (key === "School") return school;
    if (key === "Track") return track;
    if (key === "Coach") return coach;
    if (key === "Site") return site;
    return resolveLinked(key, raw) || cellDisplayValue(raw, labelsForField(key));
  }

  function row(label: string, value: string) {
    if (!value || value === "—") return null;
    const displayLabel = formatBobFieldDisplayName(label);
    return (
      <div
        key={label}
        className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2"
      >
        <dt className="text-[11px] text-gray-500">{displayLabel}</dt>
        <dd className="text-sm font-medium text-gray-900">{value}</dd>
      </div>
    );
  }

  return (
    <div className="p-5 space-y-6">
      <section>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Core profile
        </h3>
        <dl className="grid gap-2 sm:grid-cols-2">
          {coreRows.map((r) => row(r.label, r.value))}
        </dl>
      </section>

      {DEMO_GROUPS.map((group) => {
        const entries = group.keys
          .map((key) => {
            const raw = fields[key];
            if (raw == null || raw === "") return null;
            const value = displayField(key, raw);
            if (!value || value === "—") return null;
            return { key, value };
          })
          .filter(Boolean) as { key: string; value: string }[];

        if (!entries.length) return null;

        return (
          <section key={group.title}>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              {group.title}
            </h3>
            <dl className="grid gap-2 sm:grid-cols-2">
              {entries.map((e) => row(e.key, e.value))}
            </dl>
          </section>
        );
      })}

      {Object.keys(fields).length === 0 ? (
        <p className="text-sm text-gray-500">
          Sync Airtable fields to see full demographics.
        </p>
      ) : null}
    </div>
  );
}
