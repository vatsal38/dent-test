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

function clampNonNeg(n: number) {
  return Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0;
}

function deriveWellness(snapshot: WidgetRenderProps["snapshot"]): Slice[] {
  const total = clampNonNeg(
    snapshot?.kpis.studentsEnrolled?.value ??
      snapshot?.cards.studentsEnrolled ??
      0,
  );
  const concern = clampNonNeg(
    snapshot?.kpis.atRiskCount?.value ?? snapshot?.atRiskStudents?.length ?? 0,
  );
  const watch = clampNonNeg(
    snapshot?.kpis.noShowsToday?.value ?? snapshot?.noShowsToday?.length ?? 0,
  );
  const onTrack = clampNonNeg(total - concern - watch);

  return [
    { key: "thriving" as const, label: "Thriving", value: onTrack, color: "#10B981" },
    { key: "stable" as const, label: "Stable", value: 0, color: "#3B82F6" },
    { key: "watch" as const, label: "Watch", value: watch, color: "#F59E0B" },
    { key: "concern" as const, label: "Concern", value: concern, color: "#EF4444" },
  ].filter((slice) => slice.value > 0 || slice.key === "thriving");
}

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
  const total = Math.max(1, slices.reduce((acc, s) => acc + s.value, 0));
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

  const slices = deriveWellness(snapshot);
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);

  return (
    <DashboardCard
      title={title}
      refreshing={isRefreshing}
      action={
        <Link
          href="/app/bob/roster"
          className="text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          View all →
        </Link>
      }
    >
      <p className="text-sm text-gray-600 -mt-1 mb-4">
        Student health status overview
      </p>

      {total === 0 ? (
        <DashboardEmpty message="No enrolled students in this scope. Assign students to pods from the Pods page." />
      ) : (
        <>
          <div className="flex items-center justify-center">
            <Donut slices={slices} />
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

