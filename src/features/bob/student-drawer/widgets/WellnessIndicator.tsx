"use client";

import type { WellnessSignal } from "../types";

const TONE: Record<
  WellnessSignal["level"],
  { dot: string; bg: string; text: string }
> = {
  good: {
    dot: "bg-emerald-500",
    bg: "bg-emerald-50 border-emerald-200",
    text: "text-emerald-900",
  },
  watch: {
    dot: "bg-amber-500",
    bg: "bg-amber-50 border-amber-200",
    text: "text-amber-900",
  },
  concern: {
    dot: "bg-rose-500",
    bg: "bg-rose-50 border-rose-200",
    text: "text-rose-900",
  },
};

export function WellnessIndicator({ signal }: { signal: WellnessSignal }) {
  const t = TONE[signal.level];
  return (
    <div
      className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 ${t.bg}`}
      title={signal.detail}
    >
      <span className={`h-2 w-2 shrink-0 rounded-full ${t.dot}`} aria-hidden />
      <div className="min-w-0">
        <p className={`text-xs font-semibold ${t.text}`}>{signal.label}</p>
        {signal.detail ? (
          <p className="text-[11px] text-gray-600 truncate">{signal.detail}</p>
        ) : null}
      </div>
    </div>
  );
}

export function WellnessStrip({ signals }: { signals: WellnessSignal[] }) {
  if (!signals.length) return null;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {signals.slice(0, 6).map((s) => (
        <WellnessIndicator key={s.id} signal={s} />
      ))}
    </div>
  );
}
