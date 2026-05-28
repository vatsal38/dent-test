"use client";

import Link from "next/link";

type Props = {
  title?: string;
  message: string;
  actionLabel?: string;
  actionHref?: string;
};

export function DashboardEmpty({
  title = "Nothing here yet",
  message,
  actionLabel,
  actionHref,
}: Props) {
  return (
    <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/80 px-4 py-8 text-center">
      <p className="text-sm font-medium text-gray-800">{title}</p>
      <p className="mt-1 text-sm text-gray-500">{message}</p>
      {actionLabel && actionHref ? (
        <Link
          href={actionHref}
          className="mt-3 inline-block text-sm font-medium text-orange-600 hover:text-orange-700"
        >
          {actionLabel} →
        </Link>
      ) : null}
    </div>
  );
}
