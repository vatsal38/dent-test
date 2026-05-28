"use client";

import Link from "next/link";

type UnauthorizedStateProps = {
  title?: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
  compact?: boolean;
};

export function UnauthorizedState({
  title = "Not authorized",
  description = "You don't have permission to view this content.",
  backHref = "/app/bob",
  backLabel = "← Back to Command Center",
  compact = false,
}: UnauthorizedStateProps) {
  if (compact) {
    return (
      <p className="text-sm text-gray-500" role="status">
        {description}
      </p>
    );
  }

  return (
    <div
      className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-900"
      role="alert"
    >
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-amber-800">{description}</p>
      {backHref && (
        <Link
          href={backHref}
          className="mt-4 inline-block text-sm font-medium text-orange-700 hover:underline"
        >
          {backLabel}
        </Link>
      )}
    </div>
  );
}
