"use client";

import Link from "next/link";
import type { BobAccessContext } from "./types";
import { bobRoleLabel } from "./roles";

type ScopedEmptyStateProps = {
  access: BobAccessContext;
  resource?: string;
  actionHref?: string;
  actionLabel?: string;
};

/**
 * Empty state when scoped lists return no rows (coach pod, site supporter site).
 */
export function ScopedEmptyState({
  access,
  resource = "records",
  actionHref,
  actionLabel,
}: ScopedEmptyStateProps) {
  const scopeHint =
    access.scopeType === "pod" && access.primaryPod
      ? `your pod (${access.primaryPod.name})`
      : access.scopeType === "site" && access.siteNames.length
        ? `your site${access.siteNames.length > 1 ? "s" : ""} (${access.siteNames.join(", ")})`
        : `your ${bobRoleLabel(access.role).toLowerCase()} scope`;

  return (
    <div className="p-8 text-center text-gray-500">
      <p>No {resource} found for {scopeHint}.</p>
      {access.role === "coach" && !access.primaryPod && (
        <p className="mt-2 text-sm">
          Ask a program manager to assign you to a pod.
        </p>
      )}
      {actionHref && actionLabel && (
        <Link
          href={actionHref}
          className="mt-4 inline-block text-sm text-orange-600 hover:underline"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
