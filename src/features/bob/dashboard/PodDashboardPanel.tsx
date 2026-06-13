"use client";

import { DashboardEngine } from "./engine/DashboardEngine";
import type { DashboardScope } from "./types";

type Props = {
  podId: string;
  podName?: string;
};

/** Example: embed parametric dashboard on pod detail — same engine, pod scope. */
export function PodDashboardPanel({ podId, podName }: Props) {
  const scope: DashboardScope = {
    level: "pod",
    podId,
    label: podName ?? "Track",
  };

  return (
    <DashboardEngine
      layoutId="pod_ops"
      scope={scope}
      className="mt-8 border-t border-gray-200 pt-8"
    />
  );
}
