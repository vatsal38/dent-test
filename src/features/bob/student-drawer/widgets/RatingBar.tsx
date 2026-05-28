"use client";

export function RatingBar({
  score,
  max = 5,
  label,
}: {
  score: number;
  max?: number;
  label?: string;
}) {
  const filled = Math.round(Math.max(0, Math.min(max, score)));
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5" aria-label={`Rating ${filled} of ${max}`}>
        {Array.from({ length: max }, (_, i) => (
          <span
            key={i}
            className={`h-2 w-5 rounded-sm ${
              i < filled ? "bg-orange-500" : "bg-gray-200"
            }`}
          />
        ))}
      </div>
      {label ? (
        <span className="text-xs font-medium text-gray-600">{label}</span>
      ) : null}
    </div>
  );
}
