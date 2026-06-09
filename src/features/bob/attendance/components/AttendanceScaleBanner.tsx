"use client";

import type { AttendanceScaleMeta } from "../types";

export function AttendanceScaleBanner({
  scale,
  onSelectPod,
  inline = false,
}: {
  scale: AttendanceScaleMeta;
  onSelectPod?: () => void;
  inline?: boolean;
}) {
  if (!scale.requiresPodScope && !scale.recommendPodScope && !scale.weekViewHeavy) {
    return null;
  }

  if (inline) {
    const message = scale.requiresPodScope
      ? `${scale.enrollmentCount} students — select a pod for best performance`
      : `${scale.enrollmentCount} in scope${scale.recommendPodScope ? " · filter by pod" : ""}`;
    return (
      <p className="text-[11px] text-gray-500 shrink-0">
        {message}
        {scale.requiresPodScope && onSelectPod ? (
          <>
            {" · "}
            <button
              type="button"
              onClick={onSelectPod}
              className="text-orange-600 hover:underline font-medium"
            >
              Pick pod
            </button>
          </>
        ) : null}
      </p>
    );
  }

  if (scale.requiresPodScope) {
    return (
      <div className="mb-2 rounded-md border border-orange-200 bg-orange-50 px-3 py-2 text-xs text-orange-950">
        <span className="font-medium">{scale.enrollmentCount} students</span>
        {" — select a pod for faster loading. "}
        {onSelectPod ? (
          <button
            type="button"
            onClick={onSelectPod}
            className="font-medium text-orange-800 underline"
          >
            Open pod picker
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mb-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-950">
      {scale.enrollmentCount} students in scope
      {scale.recommendPodScope ? " — filter by pod for faster scanning." : ""}
      {scale.weekViewHeavy ? " Week view works best per pod." : ""}
    </div>
  );
}
