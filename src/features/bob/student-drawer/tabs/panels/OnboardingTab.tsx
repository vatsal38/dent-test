"use client";

import { useBobStudentOnboardingTasks } from "@/platform/query/hooks/useBobStudentOnboarding";
import {
  contractStatusLabel,
  onboardingPhaseTone,
  preSurveyLabel,
} from "@/features/bob/onboarding/statusLabels";
import { useStudentDrawerContext } from "../../context/StudentDrawerContext";
import { OnboardingTabSkeleton } from "../../widgets/TabPanelSkeleton";

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

export function OnboardingTab() {
  const { student, tab } = useStudentDrawerContext();
  const { data, isLoading } = useBobStudentOnboardingTasks(student?.id ?? null, {
    enabled: tab === "onboarding",
  });

  if (!student) return null;
  if (isLoading) return <OnboardingTabSkeleton />;

  const tasks = data?.tasks ?? [];
  const done = tasks.filter((t) => t.status === "done").length;
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  const ob = student.onboardingStatus;

  return (
    <div className="p-5 space-y-5">
      {ob ? (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-900">
            Airtable onboarding status
          </h3>
          <p className="text-xs text-gray-500">
            Pulled from Students &amp; Alums — Parent Contract, Student Contract,
            and Pre-Survey. Updates in Airtable show here after roster sync.
          </p>
          <div className="grid gap-2 sm:grid-cols-3">
            <StatusCard
              title="Parent contract"
              detail={
                ob.parentContract?.label
                  ? `${contractStatusLabel(ob.parentContract.phase)} — ${ob.parentContract.label}`
                  : contractStatusLabel(ob.parentContract?.phase ?? ob.contract.phase)
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
                        : ob.contract.phase === "in_progress"
                          ? "in_progress"
                          : "unknown"
              }
              fieldHint={ob.parentContract?.field ?? "BoB '26 Parent Contract Status"}
            />
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
                    : ob.youthContract?.phase === "not_started"
                      ? "not_started"
                      : "unknown"
              }
              fieldHint={
                ob.youthContract?.field ?? "BoB '26 Student Contract Status"
              }
            />
            <StatusCard
              title="Youth pre-survey"
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
          {ob.contractAndPreSurveyComplete ?? ob.readyForProgram ? (
            <p className="text-sm text-emerald-700 font-medium">
              Ready for program — parent contract, youth contract, and pre-survey
              complete.
            </p>
          ) : (
            <p className="text-sm text-amber-800">
              Onboarding incomplete — parent contract, youth contract, or
              pre-survey still pending in Airtable.
            </p>
          )}
        </div>
      ) : null}

      <div>
        <div className="flex justify-between text-sm mb-1">
          <span className="font-medium text-gray-900">Dent checklist</span>
          <span className="text-gray-600">
            {done}/{tasks.length || 0}
          </span>
        </div>
        <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
          <div
            className="h-full bg-orange-500 transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <ul className="space-y-2">
        {tasks.length === 0 ? (
          <li className="text-sm text-gray-500 py-8 text-center rounded-xl border border-dashed">
            No Dent onboarding tasks yet — they are created when a student is
            placed from recruitment.
          </li>
        ) : (
          tasks.map((t) => (
            <li
              key={t.id}
              className="flex items-start gap-3 rounded-xl border border-gray-200 p-3"
            >
              <span
                className={`mt-0.5 h-5 w-5 rounded-full border-2 flex items-center justify-center text-[10px] ${
                  t.status === "done"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : "border-gray-300"
                }`}
                aria-hidden
              >
                {t.status === "done" ? "✓" : ""}
              </span>
              <div>
                <p className="text-sm font-medium text-gray-900">{t.title}</p>
                <p className="text-xs text-gray-500 capitalize">{t.status}</p>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
