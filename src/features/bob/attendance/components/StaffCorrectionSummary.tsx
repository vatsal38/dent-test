"use client";

import type { StaffCorrectionSession, StaffCorrections } from "../types";

function CorrectionBlock({
  title,
  session,
  compact = false,
}: {
  title: string;
  session: StaffCorrectionSession;
  compact?: boolean;
}) {
  const inLabel = session.in && session.in !== "[object Object]" ? session.in : "—";
  const outLabel = session.out && session.out !== "[object Object]" ? session.out : "—";
  const hasTimes = inLabel !== "—" || outLabel !== "—";

  if (compact) {
    return (
      <div className="min-w-[120px]">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-orange-700 mb-1">
          {title}
        </p>
        {hasTimes ? (
          <div className="flex items-center gap-1.5 text-xs text-gray-800">
            <span className="h-2 w-2 rounded-full bg-orange-400" title="In" />
            <span>{inLabel}</span>
            <span className="text-gray-300">→</span>
            <span className="h-2 w-2 rounded-full bg-orange-300" title="Out" />
            <span>{outLabel}</span>
          </div>
        ) : (
          <p className="text-xs text-gray-400">—</p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-orange-200 bg-orange-50/50 p-3 space-y-2">
      <h4 className="text-sm font-semibold text-orange-900">{title}</h4>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-orange-700">Sign in</p>
          <p className="font-medium text-gray-900">{inLabel}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-orange-700">Sign out</p>
          <p className="font-medium text-gray-900">{outLabel}</p>
        </div>
      </div>
    </div>
  );
}

export function StaffCorrectionSummary({
  corrections,
  compact = false,
}: {
  corrections: StaffCorrections;
  date?: string;
  compact?: boolean;
}) {
  if (!corrections.hasCorrections) {
    return (
      <span className="text-xs text-gray-400">—</span>
    );
  }

  const hoursLabel = corrections.hoursLabel;

  if (compact) {
    return (
      <div className="space-y-1">
        <div className="flex flex-wrap gap-4">
          <CorrectionBlock title="Morning" session={corrections.morning} compact />
          <CorrectionBlock title="Afternoon" session={corrections.afternoon} compact />
        </div>
        {hoursLabel ? (
          <p className="text-[10px] text-orange-700 font-medium">{hoursLabel} corrected</p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <CorrectionBlock title="Morning" session={corrections.morning} />
      <CorrectionBlock title="Afternoon" session={corrections.afternoon} />
      {hoursLabel ? (
        <p className="text-xs text-orange-800 font-medium">{hoursLabel} from staff corrections</p>
      ) : null}
    </div>
  );
}
