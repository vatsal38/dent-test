"use client";

import Link from "next/link";
import type { ActivityTimelineItem } from "../types";

const DOT: Record<NonNullable<ActivityTimelineItem["tone"]>, string> = {
  neutral: "bg-gray-400",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-rose-500",
  info: "bg-sky-500",
};

function formatWhen(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ActivityTimeline({
  items,
  emptyMessage = "No activity yet.",
}: {
  items: ActivityTimelineItem[];
  emptyMessage?: string;
}) {
  if (!items.length) {
    return (
      <p className="text-sm text-gray-500 py-6 text-center">{emptyMessage}</p>
    );
  }

  return (
    <ol className="relative ml-1 space-y-4">
      {items.map((item) => {
        const tone = item.tone ?? "neutral";
        const inner = (
          <div className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={`mt-1.5 h-2.5 w-2.5 rounded-full ring-2 ring-white ${DOT[tone]}`}
                aria-hidden
              />
              <span className="mt-2 w-px flex-1 bg-gray-200" aria-hidden />
            </div>
            <div className="min-w-0 pb-1">
              <p className="text-sm font-medium text-gray-900">{item.title}</p>
              {item.subtitle ? (
                <p className="text-xs text-gray-500 capitalize">{item.subtitle}</p>
              ) : null}
              <time className="text-[11px] text-gray-400">{formatWhen(item.at)}</time>
            </div>
          </div>
        );
        return (
          <li key={item.id} className="relative">
            {item.href ? (
              <Link
                href={item.href}
                className="block rounded-lg px-2 py-1 hover:bg-gray-50 transition-colors"
              >
                {inner}
              </Link>
            ) : (
              <div className="px-2 py-0.5">{inner}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
