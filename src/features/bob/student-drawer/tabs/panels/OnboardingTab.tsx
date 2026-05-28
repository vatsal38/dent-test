"use client";

import { useBobStudentOnboardingTasks } from "@/platform/query/hooks/useBobStudentOnboarding";
import { useStudentDrawerContext } from "../../context/StudentDrawerContext";
import { TabPanelSkeleton } from "../../widgets/TabPanelSkeleton";

export function OnboardingTab() {
  const { student, tab } = useStudentDrawerContext();
  const { data, isLoading } = useBobStudentOnboardingTasks(student?.id ?? null, {
    enabled: tab === "onboarding",
  });

  if (!student) return null;
  if (isLoading) return <TabPanelSkeleton rows={4} />;

  const tasks = data?.tasks ?? [];
  const done = tasks.filter((t) => t.status === "done").length;
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;

  return (
    <div className="p-5 space-y-5">
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span className="font-medium text-gray-900">Checklist progress</span>
          <span className="text-gray-600">{done}/{tasks.length || 0}</span>
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
            No onboarding tasks yet — they are created when a student is placed
            from recruitment.
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
