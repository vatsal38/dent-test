"use client";

import { cellDisplayValue } from "@/lib/bobAirtableDisplay";
import { formatBobFieldDisplayName } from "@/lib/bobDisplayTerminology";
import {
  contractStatusLabel,
  onboardingPhaseTone,
  preSurveyLabel,
} from "@/features/bob/onboarding/statusLabels";
import { HEALTH_FIELD_KEYS } from "@/features/bob/student-drawer/lib/personalFieldDisplay";
import { useStudentDrawerContext } from "../../context/StudentDrawerContext";
import { useStudentLinkedFieldDisplay } from "../../hooks/useStudentLinkedFieldDisplay";

const CONTRACT_FIELD_KEYS = [
  "BoB '26 Parent Contract Status",
  "BoB '26 Student Contract Status",
  "BoB '26 Pre-Survey Status",
  "BoB '26 All Forms Completed",
] as const;

function FieldCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-3 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
        {formatBobFieldDisplayName(label)}
      </p>
      <p className="mt-1 text-sm font-medium text-gray-900 whitespace-pre-wrap">
        {value}
      </p>
      {hint ? (
        <p className="mt-1.5 text-[10px] text-gray-400">Airtable: {hint}</p>
      ) : null}
    </div>
  );
}

function StatusCard({
  title,
  detail,
  phase,
  fieldHint,
}: {
  title: string;
  detail: string;
  phase: Parameters<typeof onboardingPhaseTone>[0];
  fieldHint?: string | null;
}) {
  return (
    <div className={`rounded-xl border p-3 ${onboardingPhaseTone(phase)}`}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-80">
        {title}
      </p>
      <p className="text-sm font-medium mt-1">{detail}</p>
      {fieldHint ? (
        <p className="text-[10px] mt-1.5 opacity-70">Airtable: {fieldHint}</p>
      ) : null}
    </div>
  );
}

/**
 * Staff-only — Contract status + Medical & Health History from Students & Alums.
 * Hidden from students (ticket 33A).
 */
export function ContractsHealthTab() {
  const { student } = useStudentDrawerContext();
  const { fields, labelsForField, resolveLinked } =
    useStudentLinkedFieldDisplay(student);

  if (!student) return null;

  const ob = student.onboardingStatus;

  const healthRows = HEALTH_FIELD_KEYS.map((key) => {
    const raw = fields[key];
    if (raw == null || raw === "") return null;
    const value =
      resolveLinked(key, raw) ||
      cellDisplayValue(raw, labelsForField(key));
    if (!value || value === "—") return null;
    return { key, value };
  }).filter(Boolean) as { key: string; value: string }[];

  const extraContractRows = CONTRACT_FIELD_KEYS.filter(
    (key) =>
      key === "BoB '26 All Forms Completed" ||
      (!ob && fields[key] != null && fields[key] !== ""),
  )
    .map((key) => {
      const raw = fields[key];
      if (raw == null || raw === "") return null;
      const value =
        resolveLinked(key, raw) ||
        cellDisplayValue(raw, labelsForField(key));
      if (!value || value === "—") return null;
      return { key, value };
    })
    .filter(Boolean) as { key: string; value: string }[];

  return (
    <div className="p-5 space-y-6">
      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            Contract status
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            From Students &amp; Alums (BoB &apos;26). Staff view only — not shown
            to youth.
          </p>
        </div>
        {ob ? (
          <div className="grid gap-2 sm:grid-cols-3">
            <StatusCard
              title="Youth contract"
              detail={
                ob.youthContract?.label
                  ? `${contractStatusLabel(ob.youthContract.phase)} — ${ob.youthContract.label}`
                  : contractStatusLabel(ob.youthContract?.phase ?? "unknown")
              }
              phase={
                ob.youthContract?.phase === "signed"
                  ? "signed"
                  : ob.youthContract?.phase === "in_progress"
                    ? "in_progress"
                    : "not_started"
              }
              fieldHint={
                ob.youthContract?.field ?? "BoB '26 Student Contract Status"
              }
            />
            <StatusCard
              title="Parent/Guardian contract"
              detail={
                ob.parentContract?.label
                  ? `${contractStatusLabel(ob.parentContract.phase)} — ${ob.parentContract.label}`
                  : contractStatusLabel(
                      ob.parentContract?.phase ?? ob.contract.phase,
                    )
              }
              phase={
                ob.parentContract?.phase === "signed" ||
                ob.parentContract?.phase === "not_needed"
                  ? ob.parentContract.phase
                  : ob.parentContract?.phase === "in_progress"
                    ? "in_progress"
                    : ob.parentContract?.phase === "not_started"
                      ? "not_started"
                      : ob.contract.phase === "signed"
                        ? "signed"
                        : "unknown"
              }
              fieldHint={
                ob.parentContract?.field ?? "BoB '26 Parent Contract Status"
              }
            />
            <StatusCard
              title="Pre-survey"
              detail={preSurveyLabel(ob.preSurvey)}
              phase={
                ob.preSurveyComplete
                  ? "complete"
                  : ob.preSurvey.phase === "incomplete"
                    ? "incomplete"
                    : "unknown"
              }
              fieldHint={ob.preSurvey.field ?? "BoB '26 Pre-Survey Status"}
            />
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            Contract fields not synced yet — run roster Airtable sync.
          </p>
        )}
        {extraContractRows.length > 0 ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {extraContractRows.map((row) => (
              <FieldCard key={row.key} label={row.key} value={row.value} hint={row.key} />
            ))}
          </div>
        ) : null}
      </section>

      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            Medical &amp; health history
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Health History, allergies, and OTC authorization from Students &amp;
            Alums.
          </p>
        </div>
        {healthRows.length === 0 ? (
          <p className="text-sm text-gray-500 rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center">
            No medical or health fields on this record yet.
          </p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {healthRows.map((row) => (
              <FieldCard
                key={row.key}
                label={row.key}
                value={row.value}
                hint={row.key}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
