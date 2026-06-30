export const PROGRESS_DELIVERABLE_STATUS_OPTIONS = [
  { value: "completed", label: "Completed" },
  { value: "progress", label: "In progress" },
  { value: "not_done", label: "Not done" },
  { value: "behind", label: "Behind / stuck" },
] as const;

export function progressStatusLabel(value: string | null | undefined): string {
  if (!value) return "—";
  const match = PROGRESS_DELIVERABLE_STATUS_OPTIONS.find(
    (o) => o.value === value,
  );
  return match?.label ?? value;
}
