import type { BobSubmission } from "@/platform/api/bob/submissions";
import { formatMileageAmount } from "@/features/bob/submit/mileageReimbursement";

export function mileageRouteSummary(s: BobSubmission): string | null {
  const legs = s.mileageLegs?.filter(Boolean) ?? [];
  if (legs.length === 1) {
    return `${legs[0].from} → ${legs[0].to}`;
  }
  if (legs.length > 1) {
    return `${legs[0].from} → … → ${legs[legs.length - 1].to} (${legs.length} legs)`;
  }
  if (s.fromLocation && s.toLocation) {
    return `${s.fromLocation} → ${s.toLocation}`;
  }
  return null;
}

interface MileageReimbursementDetailProps {
  data: BobSubmission;
}

export function MileageReimbursementDetail({
  data,
}: MileageReimbursementDetailProps) {
  const legs = data.mileageLegs?.filter(Boolean) ?? [];
  if (!legs.length) return null;

  const rateUsd = data.mileageRateUsd ?? null;
  const totalMiles = data.mileageTotalMiles ?? null;

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <h3 className="text-xs font-semibold text-gray-600 uppercase mb-3">
        Mileage breakdown
      </h3>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-gray-800">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
              <th className="pb-2 pr-3 font-semibold">From</th>
              <th className="pb-2 pr-3 font-semibold">To</th>
              <th className="pb-2 font-semibold text-right">Miles</th>
            </tr>
          </thead>
          <tbody>
            {legs.map((leg, index) => (
              <tr key={`${leg.from}-${leg.to}-${index}`} className="border-t border-gray-200">
                <td className="py-2 pr-3 align-top">{leg.from}</td>
                <td className="py-2 pr-3 align-top">{leg.to}</td>
                <td className="py-2 text-right align-top tabular-nums">
                  {leg.miles.toLocaleString("en-US", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalMiles != null && rateUsd != null && data.requestAmount != null ? (
        <p className="mt-3 text-sm text-gray-700">
          {totalMiles.toLocaleString("en-US", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
          })}{" "}
          total miles × ${formatMileageAmount(rateUsd)}/mile ={" "}
          <span className="font-semibold text-gray-900">
            $
            {data.requestAmount.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </p>
      ) : null}
    </div>
  );
}
