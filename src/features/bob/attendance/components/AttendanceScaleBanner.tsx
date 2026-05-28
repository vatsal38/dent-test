"use client";

import type { AttendanceScaleMeta } from "../types";

export function AttendanceScaleBanner({
  scale,
  onSelectPod,
}: {
  scale: AttendanceScaleMeta;
  onSelectPod?: () => void;
}) {
  if (!scale.requiresPodScope && !scale.recommendPodScope && !scale.weekViewHeavy) {
    return null;
  }

  if (scale.requiresPodScope) {
    return (
      <div className="mb-4 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-950">
        <p className="font-semibold">Large roster ({scale.enrollmentCount} students)</p>
        <p className="mt-1 text-orange-900/90">
          Select a pod to load attendance faster and keep alerts actionable. Org-wide
          summaries stay in the health bar and pod queue above.
        </p>
        {onSelectPod ? (
          <button
            type="button"
            onClick={onSelectPod}
            className="mt-2 text-xs font-medium text-orange-800 underline"
          >
            Open pod picker
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-950">
      <p className="font-medium">
        {scale.enrollmentCount} students in scope
        {scale.recommendPodScope
          ? " — filter by pod for faster scanning and fewer alerts."
          : ""}
        {scale.weekViewHeavy
          ? " Week view works best per pod at this size."
          : ""}
      </p>
    </div>
  );
}
