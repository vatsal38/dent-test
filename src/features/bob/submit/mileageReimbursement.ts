export interface MileageLeg {
  from: string;
  to: string;
  miles: string;
}

export interface MileageCalculation {
  totalMiles: number;
  amount: number;
  rateUsd: number;
}

export const DEFAULT_MILEAGE_RATE_USD = 0.67;

export function emptyMileageLeg(): MileageLeg {
  return { from: "", to: "", miles: "" };
}

export function parseMileageLegsJson(raw: string | undefined): MileageLeg[] {
  if (!raw?.trim()) return [emptyMileageLeg()];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || !parsed.length) return [emptyMileageLeg()];
    return parsed.map((leg) => ({
      from: String((leg as MileageLeg)?.from ?? ""),
      to: String((leg as MileageLeg)?.to ?? ""),
      miles:
        (leg as MileageLeg)?.miles != null
          ? String((leg as MileageLeg).miles)
          : "",
    }));
  } catch {
    return [emptyMileageLeg()];
  }
}

export function serializeMileageLegs(legs: MileageLeg[]): string {
  return JSON.stringify(legs);
}

export function normalizeLegMiles(value: string): number | null {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100) / 100;
}

export function calculateMileageReimbursement(
  legs: MileageLeg[],
  rateUsd: number,
): MileageCalculation | null {
  let totalMiles = 0;
  for (const leg of legs) {
    const miles = normalizeLegMiles(leg.miles);
    if (miles == null) continue;
    if (!leg.from.trim() || !leg.to.trim()) continue;
    totalMiles += miles;
  }
  if (totalMiles <= 0) return null;
  totalMiles = Math.round(totalMiles * 100) / 100;
  const amount = Math.round(totalMiles * rateUsd * 100) / 100;
  return { totalMiles, amount, rateUsd };
}

export function formatMileageAmount(amount: number): string {
  return amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function mileageLegsForSubmit(legs: MileageLeg[]) {
  return legs
    .map((leg) => ({
      from: leg.from.trim(),
      to: leg.to.trim(),
      miles: normalizeLegMiles(leg.miles),
    }))
    .filter(
      (leg): leg is { from: string; to: string; miles: number } =>
        Boolean(leg.from && leg.to && leg.miles != null),
    );
}
