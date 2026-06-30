"use client";

interface CoachFeedbackFormFieldsProps {
  form: Record<string, string>;
  setForm: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

const RATING_OPTIONS = [
  { value: "1", label: "1 — Very difficult week" },
  { value: "2", label: "2 — Challenging" },
  { value: "3", label: "3 — Mixed" },
  { value: "4", label: "4 — Good" },
  { value: "5", label: "5 — Excellent" },
];

export function CoachFeedbackFormFields({
  form,
  setForm,
}: CoachFeedbackFormFieldsProps) {
  return (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Overall week (1–5)
        </label>
        <select
          value={form.coachRating ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, coachRating: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
          required
        >
          <option value="">Select rating</option>
          {RATING_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          How was your week?
        </label>
        <textarea
          value={form.description ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
          rows={4}
          required
          placeholder="Experience with students, pod, and program flow"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Curriculum feedback
        </label>
        <textarea
          value={form.curriculumFeedback ?? ""}
          onChange={(e) =>
            setForm((f) => ({ ...f, curriculumFeedback: e.target.value }))
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
          rows={3}
          placeholder="What worked or didn't in sessions and materials?"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Logistics feedback
        </label>
        <textarea
          value={form.logisticsFeedback ?? ""}
          onChange={(e) =>
            setForm((f) => ({ ...f, logisticsFeedback: e.target.value }))
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
          rows={3}
          placeholder="Space, schedule, supplies, transportation, etc."
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Questions for leadership
        </label>
        <textarea
          value={form.openQuestions ?? ""}
          onChange={(e) =>
            setForm((f) => ({ ...f, openQuestions: e.target.value }))
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
          rows={2}
          placeholder="Anything you need answered or unblocked?"
        />
      </div>
      <p className="text-xs text-gray-500">
        One survey per coach per program week. Routed to program leadership.
      </p>
    </>
  );
}

export function isCoachFeedbackType(value: string | null | undefined) {
  return value === "coach_feedback";
}
