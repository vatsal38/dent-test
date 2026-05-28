"use client";

import type { ReactNode } from "react";

type Props = {
  columns?: 1 | 2 | 3;
  children: ReactNode;
};

export function DashboardGrid({ columns = 2, children }: Props) {
  const colClass =
    columns === 1
      ? "grid-cols-1"
      : columns === 3
        ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-12"
        : "grid-cols-1 lg:grid-cols-2";

  return (
    <div className={`grid ${colClass} gap-4 xl:gap-5 grid-flow-dense`}>
      {children}
    </div>
  );
}
