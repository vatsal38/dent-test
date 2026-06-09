"use client";

import type { AttendanceScaleMeta } from "../types";

export function AttendanceScaleBanner({
  scale,
  onSelectTrack,
  inline = false,
}: {
  scale: AttendanceScaleMeta;
  onSelectTrack?: () => void;
  inline?: boolean;
}) {
  if (!scale.requiresPodScope && !scale.recommendPodScope && !scale.weekViewHeavy) {
    return null;
  }

  if (inline) {
    const message = scale.requiresPodScope
      ? `${scale.enrollmentCount} students — select a track for best performance`
      : `${scale.enrollmentCount} in scope${scale.recommendPodScope ? " · filter by track" : ""}`;
    return (
      <p className="text-[11px] text-gray-500 shrink-0">
        {message}
        {scale.requiresPodScope && onSelectTrack ? (
          <>
            {" · "}
            <button
              type="button"
              onClick={onSelectTrack}
              className="text-orange-600 hover:underline font-medium"
            >
              Pick track
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
        {" — select a track for faster loading. "}
        {onSelectTrack ? (
          <button
            type="button"
            onClick={onSelectTrack}
            className="font-medium text-orange-800 underline"
          >
            Open track picker
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mb-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-950">
      {scale.enrollmentCount} students in scope
      {scale.recommendPodScope ? " — filter by track for faster scanning." : ""}
      {scale.weekViewHeavy ? " Week view works best with a track selected." : ""}
    </div>
  );
}
