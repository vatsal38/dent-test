export const FEEDBACK_CATEGORIES = [
  { value: "program", label: "Program" },
  { value: "logistics", label: "Logistics" },
  { value: "partners", label: "Partners (FFT, field trips, etc.)" },
  { value: "staff", label: "Staff" },
  { value: "events", label: "Events" },
  { value: "other", label: "Other" },
] as const;

export function feedbackCategoryLabel(value: string | null | undefined): string {
  const match = FEEDBACK_CATEGORIES.find((c) => c.value === value);
  return match?.label ?? value?.replace(/_/g, " ") ?? "Feedback";
}
