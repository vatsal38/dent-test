"use client";

import type { MileageLeg } from "@/features/bob/submit/mileageReimbursement";
import {
  calculateMileageReimbursement,
  formatMileageAmount,
} from "@/features/bob/submit/mileageReimbursement";

interface MileageLegsEditorProps {
  legs: MileageLeg[];
  rateUsd: number;
  onChange: (legs: MileageLeg[]) => void;
}

export function MileageLegsEditor({
  legs,
  rateUsd,
  onChange,
}: MileageLegsEditorProps) {
  const calculation = calculateMileageReimbursement(legs, rateUsd);

  function updateLeg(index: number, patch: Partial<MileageLeg>) {
    onChange(legs.map((leg, i) => (i === index ? { ...leg, ...patch } : leg)));
  }

  function addLeg() {
    const last = legs[legs.length - 1];
    onChange([
      ...legs,
      { from: last?.to?.trim() || "", to: "", miles: "" },
    ]);
  }

  function removeLeg(index: number) {
    if (legs.length <= 1) {
      onChange([{ from: "", to: "", miles: "" }]);
      return;
    }
    onChange(legs.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-gray-700">Trip legs</p>
        <p className="text-xs text-gray-500">
          Rate: ${formatMileageAmount(rateUsd)}/mile
        </p>
      </div>
      {legs.map((leg, index) => (
        <div
          key={`mileage-leg-${index}`}
          className="rounded-lg border border-gray-200 bg-gray-50/80 p-3 space-y-3"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Leg {index + 1}
            </span>
            {legs.length > 1 ? (
              <button
                type="button"
                onClick={() => removeLeg(index)}
                className="text-xs text-gray-500 hover:text-gray-800"
              >
                Remove
              </button>
            ) : null}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                From
              </label>
              <input
                type="text"
                value={leg.from}
                onChange={(e) => updateLeg(index, { from: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 bg-white"
                required
                placeholder="e.g. Morgan State University"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                To
              </label>
              <input
                type="text"
                value={leg.to}
                onChange={(e) => updateLeg(index, { to: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 bg-white"
                required
                placeholder="e.g. Field trip site"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Miles
            </label>
            <input
              type="number"
              min={0}
              step="0.1"
              value={leg.miles}
              onChange={(e) => updateLeg(index, { miles: e.target.value })}
              className="w-full sm:max-w-[10rem] px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 bg-white"
              required
              placeholder="0.0"
            />
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={addLeg}
        className="text-sm font-medium text-orange-600 hover:text-orange-700"
      >
        + Add another stop
      </button>
      {calculation ? (
        <p className="text-sm text-sky-900 bg-sky-50 border border-sky-100 rounded-lg px-3 py-2">
          <span className="font-semibold">{calculation.totalMiles}</span> total
          miles × ${formatMileageAmount(calculation.rateUsd)} ={" "}
          <span className="font-semibold">
            ${formatMileageAmount(calculation.amount)}
          </span>
        </p>
      ) : (
        <p className="text-xs text-gray-500">
          Enter each leg&apos;s from, to, and miles. Amount is calculated
          automatically on submit.
        </p>
      )}
    </div>
  );
}
