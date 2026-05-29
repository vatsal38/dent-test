"use client";

import Link from "next/link";
import { DashboardCard } from "../primitives/DashboardCard";
import { DashboardWidgetSkeleton } from "../primitives/DashboardWidgetSkeleton";
import { DashboardEmpty } from "../primitives/DashboardEmpty";
import type { WidgetRenderProps } from "../types";

type Slice = {
  key: "thriving" | "stable" | "watch" | "concern";
  label: string;
  value: number;
  color: string;
};

function Donut({
  slices,
  size = 156,
  stroke = 18,
}: {
  slices: Slice[];
  size?: number;
  stroke?: number;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const total = Math.max(
    1,
    slices.reduce((acc, s) => acc + s.value, 0),
  );
  let offset = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(17,24,39,0.06)"
          strokeWidth={stroke}
        />
        {slices.map((s) => {
          const frac = s.value / total;
          const dash = frac * c;
          const dashArray = `${dash} ${c - dash}`;
          const dashOffset = -offset;
          offset += dash;
          return (
            <circle
              key={s.key}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={dashArray}
              strokeDashoffset={dashOffset}
            />
          );
        })}
      </g>
    </svg>
  );
}

export function WellnessDistributionWidget({
  snapshot,
  loading,
  isRefreshing,
  placement,
}: WidgetRenderProps) {
  const title = placement.title ?? "Wellness Distribution";
  if (loading) return <DashboardWidgetSkeleton variant="chart" />;

  const dist = snapshot?.wellnessDistribution;
  const slices: Slice[] = dist
    ? dist.slices.map((s) => ({
        key: s.key,
        label: s.label,
        value: s.count,
        color: s.color,
      }))
    : [];
  const total = dist?.total ?? slices.reduce((sum, s) => sum + s.value, 0);

  return (
    <DashboardCard
      title={title}
      refreshing={isRefreshing}
      action={
        <Link
          href="/app/bob/inbox?type=wellness_check"
          className="text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          Wellness inbox →
        </Link>
      }
    >
      <p className="text-sm text-gray-600 -mt-1 mb-4">
        Active BoB cohort — attendance today, open wellness checks, roster status
        {dist?.openWellnessChecks ? (
          <span className="text-amber-700">
            {" "}
            · {dist.openWellnessChecks} open check
            {dist.openWellnessChecks === 1 ? "" : "s"}
          </span>
        ) : null}
      </p>

      {total === 0 ? (
        <DashboardEmpty message="No active BoB students in this scope." />
      ) : (
        <>
          <div className="flex items-center justify-center">
            <Donut slices={slices.length ? slices : [{ key: "stable", label: "Stable", value: total, color: "#3B82F6" }]} />
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm">
            {slices.map((s) => (
              <div key={s.key} className="flex items-center gap-2">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: s.color }}
                />
                <span className="text-gray-700">
                  {s.label} ({s.value})
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </DashboardCard>
  );
}
