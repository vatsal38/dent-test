"use client";

import { formatBobFieldDisplayName } from "@/lib/bobDisplayTerminology";
import { cellDisplayValue } from "@/lib/bobAirtableDisplay";
import { useStudentDrawerContext } from "../../context/StudentDrawerContext";
import { useStudentLinkedFieldDisplay } from "../../hooks/useStudentLinkedFieldDisplay";
import {
  ALLERGY_KEYS,
  computeAgeFromDob,
  DOB_KEYS,
  EMERGENCY_KEYS,
  formatPersonalDate,
  GUARDIAN_EMAIL_KEYS,
  GUARDIAN_NAME_KEYS,
  GUARDIAN_PHONE_KEYS,
  pickField,
  pickPrimaryDob,
  SCHOOL_ONLY_KEYS,
  SKIP_IN_PERSONAL,
} from "../../lib/personalFieldDisplay";

function FieldCard({ label, value }: { label: string; value: string }) {
  if (!value || value === "—") return null;
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
      <dt className="text-[11px] text-gray-500">{formatBobFieldDisplayName(label)}</dt>
      <dd className="text-sm font-medium text-gray-900 whitespace-pre-wrap">{value}</dd>
    </div>
  );
}

function matchExtraFields(
  fields: Record<string, unknown>,
  used: Set<string>,
  patterns: RegExp[],
): { key: string; value: unknown }[] {
  const out: { key: string; value: unknown }[] = [];
  for (const [key, raw] of Object.entries(fields)) {
    if (used.has(key) || SKIP_IN_PERSONAL.has(key)) continue;
    if (raw == null || !String(raw).trim()) continue;
    if (patterns.some((p) => p.test(key))) {
      out.push({ key, value: raw });
      used.add(key);
    }
  }
  return out;
}

/** Formerly Demographics — identity, family, and school info without duplicating overview contact. */
export function DemographicsTab() {
  const { student } = useStudentDrawerContext();
  const { fields, labelsForField, resolveLinked, school } =
    useStudentLinkedFieldDisplay(student);

  if (!student) return null;

  const used = new Set<string>();

  function displayField(key: string, raw: unknown): string {
    if (DOB_KEYS.includes(key as (typeof DOB_KEYS)[number])) {
      return (
        formatPersonalDate(raw) ||
        resolveLinked(key, raw) ||
        cellDisplayValue(raw, labelsForField(key))
      );
    }
    if (key === "School") return school;
    return resolveLinked(key, raw) || cellDisplayValue(raw, labelsForField(key));
  }

  function collect(keys: readonly string[]) {
    const items: { key: string; value: string }[] = [];
    for (const key of keys) {
      const raw = fields[key];
      if (raw == null || !String(raw).trim()) continue;
      used.add(key);
      const value = displayField(key, raw);
      if (value && value !== "—") items.push({ key, value });
    }
    return items;
  }

  // 80B — one DOB field only (prefer Date of Birth; drop Birthday duplicates)
  const primaryDob = pickPrimaryDob(fields);
  if (primaryDob) {
    used.add(primaryDob.key);
    for (const key of DOB_KEYS) used.add(key);
  }
  // 81B — Age as its own block (not appended to DOB)
  const age =
    primaryDob != null ? computeAgeFromDob(primaryDob.value) : null;

  const identityKeys = [
    "First Name",
    "Last Name",
    "Preferred Name",
    "Pronouns",
    ...ALLERGY_KEYS,
    "Gender",
    "Race/Ethnicity",
    "Ethnicity",
    "English First Language",
    "Other Identities",
  ];

  const identity = [
    ...collect(identityKeys),
    ...matchExtraFields(fields, used, [
      /pronoun/i,
      /allerg/i,
      /gender/i,
      /ethnic/i,
      /identit/i,
      /language/i,
    ]).map(({ key, value }) => ({
      key,
      value: displayField(key, value),
    })),
  ].filter((e) => e.value && e.value !== "—");

  // Skip Birthday / Birth Date / DOB extras that aren't the primary DOB
  const birthExtras = matchExtraFields(fields, used, [/birth/i]).filter(
    ({ key }) => !/^birthday$/i.test(key) && !/^birth\s*date$/i.test(key),
  );

  const guardianName = pickField(fields, GUARDIAN_NAME_KEYS);
  const guardianPhone = pickField(fields, GUARDIAN_PHONE_KEYS);
  const guardianEmail = pickField(fields, GUARDIAN_EMAIL_KEYS);
  const emergency = pickField(fields, EMERGENCY_KEYS);
  [guardianName, guardianPhone, guardianEmail, emergency].forEach((f) => {
    if (f) used.add(f.key);
  });

  const familyExtras = matchExtraFields(fields, used, [
    /parent/i,
    /guardian/i,
    /emergency/i,
    /family/i,
    /home phone/i,
  ]);

  const schoolItems = [
    ...collect(SCHOOL_ONLY_KEYS),
    ...matchExtraFields(fields, used, [
      /school/i,
      /grade/i,
      /graduation/i,
      /counselor/i,
      /teacher/i,
    ]),
  ]
    .map(({ key, value }) => ({
      key,
      value: typeof value === "string" ? value : displayField(key, value),
    }))
    .filter((e) => e.value && e.value !== "—");

  const hasPersonalBlock =
    identity.length > 0 || primaryDob != null || age != null;

  return (
    <div className="p-5 space-y-6">
      <p className="text-sm text-gray-600">
        Personal and family details from Airtable. Contact info and track live on
        Overview.
      </p>

      {hasPersonalBlock ? (
        <section>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Personal
          </h3>
          <dl className="grid gap-2 sm:grid-cols-2">
            {identity.map((e) => (
              <FieldCard key={e.key} label={e.key} value={e.value} />
            ))}
            {primaryDob ? (
              <FieldCard
                key={primaryDob.key}
                label={
                  /^date of birth$/i.test(primaryDob.key) ||
                  /^dob$/i.test(primaryDob.key)
                    ? "Date of Birth"
                    : primaryDob.key
                }
                value={formatPersonalDate(primaryDob.value)}
              />
            ) : null}
            {/* 81B — separate Age block */}
            {age != null ? (
              <div className="rounded-lg border border-orange-100 bg-orange-50/50 px-3 py-2 sm:col-span-1">
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-orange-800/80">
                  Age
                </dt>
                <dd className="text-xl font-bold text-orange-950 tabular-nums mt-0.5">
                  {age}
                </dd>
              </div>
            ) : null}
            {birthExtras.map((e) => (
              <FieldCard
                key={e.key}
                label={e.key}
                value={displayField(e.key, e.value)}
              />
            ))}
          </dl>
        </section>
      ) : null}

      {guardianName || guardianPhone || guardianEmail || emergency || familyExtras.length ? (
        <section>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Family & emergency
          </h3>
          <div className="rounded-xl border border-orange-100 bg-orange-50/40 p-4 mb-3 space-y-2">
            {guardianName ? (
              <p className="text-sm font-semibold text-gray-900">
                {displayField(guardianName.key, guardianName.value)}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-700">
              {guardianPhone ? (
                <span>
                  {formatBobFieldDisplayName(guardianPhone.key)}:{" "}
                  {displayField(guardianPhone.key, guardianPhone.value)}
                </span>
              ) : null}
              {guardianEmail ? (
                <span>
                  {formatBobFieldDisplayName(guardianEmail.key)}:{" "}
                  {displayField(guardianEmail.key, guardianEmail.value)}
                </span>
              ) : null}
            </div>
            {emergency ? (
              <p className="text-sm text-gray-700">
                {formatBobFieldDisplayName(emergency.key)}:{" "}
                {displayField(emergency.key, emergency.value)}
              </p>
            ) : null}
          </div>
          {familyExtras.length > 0 ? (
            <dl className="grid gap-2 sm:grid-cols-2">
              {familyExtras.map((e) => (
                <FieldCard
                  key={e.key}
                  label={e.key}
                  value={displayField(e.key, e.value)}
                />
              ))}
            </dl>
          ) : null}
        </section>
      ) : null}

      {schoolItems.length > 0 ? (
        <section>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            School
          </h3>
          <dl className="grid gap-2 sm:grid-cols-2">
            {schoolItems.map((e) => (
              <FieldCard key={e.key} label={e.key} value={e.value} />
            ))}
          </dl>
        </section>
      ) : null}

      {!hasPersonalBlock && !guardianName && schoolItems.length === 0 ? (
        <p className="text-sm text-gray-500">
          Sync Airtable fields to see personal details.
        </p>
      ) : null}
    </div>
  );
}
