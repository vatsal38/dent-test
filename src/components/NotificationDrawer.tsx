"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  HiOutlineBell,
  HiOutlineClipboardList,
  HiOutlineExclamation,
  HiOutlineHeart,
  HiOutlinePhone,
  HiOutlineX,
} from "react-icons/hi";
import { Drawer } from "@/components/Drawer";
import { cardTitle, formatWhen } from "@/features/bob/submissions/display";
import type { BobSubmissionNotificationsResponse } from "@/platform/api/bob/submissions";
import { useBobSubmissionNotifications } from "@/platform/query/hooks/useBobSubmissions";
import { useBobAccess } from "@/platform/rbac/useBobAccess";

const READ_KEY = "bob:notifications:read";

type Tone = "default" | "warning" | "danger";

interface NotificationItem {
  id: string;
  type: string;
  typeLabel: string;
  actor: string;
  content: string;
  subject: string;
  createdAt: string;
  tone: Tone;
  href: string;
}

function loadReadIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(READ_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function saveReadIds(ids: Set<string>) {
  localStorage.setItem(READ_KEY, JSON.stringify([...ids]));
}

function dayGroupLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startYesterday = new Date(startToday.getTime() - 86400000);
  const startWeek = new Date(startToday.getTime() - 6 * 86400000);
  if (d >= startToday) return "Today";
  if (d >= startYesterday) return "Yesterday";
  if (d >= startWeek) return "Earlier this week";
  return "Earlier";
}

function iconForType(type: string) {
  if (type.includes("incident")) {
    return <HiOutlineExclamation className="w-4 h-4 shrink-0" />;
  }
  if (type.includes("wellness")) {
    return <HiOutlineHeart className="w-4 h-4 shrink-0" />;
  }
  if (type.includes("parent")) {
    return <HiOutlinePhone className="w-4 h-4 shrink-0" />;
  }
  return <HiOutlineClipboardList className="w-4 h-4 shrink-0" />;
}

function toneClasses(tone: Tone) {
  if (tone === "danger") return "border-red-200 bg-red-50/70";
  if (tone === "warning") return "border-amber-200 bg-amber-50/70";
  return "border-gray-200 bg-white";
}

function buildItems(
  data: BobSubmissionNotificationsResponse | undefined,
  submissionsHref: string,
): NotificationItem[] {
  const items: NotificationItem[] = [];
  const cutoff = Date.now() - 7 * 86400000;

  for (const s of data?.submissions ?? []) {
    const createdAt = s.createdAt || s.updatedAt;
    if (new Date(createdAt).getTime() < cutoff) continue;
    const tone: Tone =
      s.type === "incident" || s.severity === "high" ? "danger" : "warning";
    items.push({
      id: `sub:${s.id}`,
      type: s.type,
      typeLabel: s.type.replace(/_/g, " "),
      actor: s.assignedToLabel || s.createdBy || "System",
      content: cardTitle(s),
      subject: s.student || "Submission",
      createdAt,
      tone,
      href: `${submissionsHref}?id=${encodeURIComponent(s.id)}`,
    });
  }

  for (const e of data?.events ?? []) {
    if (new Date(e.createdAt).getTime() < cutoff) continue;
    items.push({
      id: `evt:${e.id}`,
      type: e.type,
      typeLabel: "Notification",
      actor: e.targetRole || "Staff",
      content: e.message || "New activity",
      subject: "Submission",
      createdAt: e.createdAt,
      tone: "default",
      href: e.submissionId
        ? `${submissionsHref}?id=${encodeURIComponent(e.submissionId)}`
        : submissionsHref,
    });
  }

  return items.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function useNotifications() {
  const access = useBobAccess();
  const orgWide = access.can("inbox.notificationsAll");
  const submissionsHref = access.can("inbox.view")
    ? "/app/bob/inbox"
    : "/app/bob/my-submissions";
  const enabled = access.can("inbox.view") || access.can("submissions.viewOwn");
  const { data, isLoading } = useBobSubmissionNotifications(orgWide, enabled);
  const [open, setOpen] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(() => loadReadIds());
  const [tab, setTab] = useState<"all" | "unread">("all");

  const allItems = useMemo(
    () => buildItems(data, submissionsHref),
    [data, submissionsHref],
  );
  const unreadCount = allItems.filter((item) => !readIds.has(item.id)).length;
  const badgeTone: "danger" | "warning" | "default" = allItems.some(
    (i) => !readIds.has(i.id) && i.tone === "danger",
  )
    ? "danger"
    : allItems.some((i) => !readIds.has(i.id) && i.tone === "warning")
      ? "warning"
      : "default";

  const visibleItems = useMemo(
    () =>
      tab === "unread"
        ? allItems.filter((item) => !readIds.has(item.id))
        : allItems,
    [allItems, readIds, tab],
  );

  const grouped = useMemo(() => {
    const map = new Map<string, NotificationItem[]>();
    for (const item of visibleItems) {
      const label = dayGroupLabel(item.createdAt);
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(item);
    }
    return [...map.entries()];
  }, [visibleItems]);

  function markRead(id: string) {
    const next = new Set(readIds);
    next.add(id);
    setReadIds(next);
    saveReadIds(next);
  }

  function markAllRead() {
    const next = new Set(allItems.map((i) => i.id));
    setReadIds(next);
    saveReadIds(next);
  }

  const badgeColor =
    badgeTone === "danger"
      ? "bg-red-500"
      : badgeTone === "warning"
        ? "bg-orange-500"
        : "bg-gray-500";

  return {
    open,
    setOpen,
    unreadCount,
    bell: (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-700"
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
      >
        <HiOutlineBell className="w-5 h-5" />
        {unreadCount > 0 ? (
          <span
            className={`absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center ${badgeColor}`}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>
    ),
    drawer: (
      <Drawer open={open} onClose={() => setOpen(false)} widthClassName="w-full sm:w-[400px]">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={markAllRead}
                className="text-sm text-orange-600 hover:text-orange-700 font-medium"
              >
                Mark all read
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1 rounded hover:bg-gray-100"
                aria-label="Close notifications"
              >
                <HiOutlineX className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>

          <div className="px-4 pt-3 flex gap-2 border-b border-gray-100">
            {(["all", "unread"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                  tab === t
                    ? "bg-orange-100 text-orange-800"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {t === "all" ? "All" : "Unread"}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {isLoading && !data ? (
              <p className="text-sm text-gray-500">Loading notifications…</p>
            ) : visibleItems.length === 0 ? (
              <div className="text-center py-12">
                <HiOutlineBell className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-600">No notifications</p>
                <p className="text-xs text-gray-400 mt-1">
                  Activity from the last 7 days appears here.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {grouped.map(([label, items]) => (
                  <section key={label}>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                      {label}
                    </h3>
                    <ul className="space-y-2">
                      {items.map((item) => (
                        <li key={item.id}>
                          <Link
                            href={item.href}
                            onClick={() => {
                              markRead(item.id);
                              setOpen(false);
                            }}
                            className={`block rounded-lg border p-3 hover:shadow-sm transition-shadow ${toneClasses(item.tone)} ${readIds.has(item.id) ? "opacity-70" : ""}`}
                          >
                            <div className="flex items-start gap-2">
                              <span className="mt-0.5 text-gray-600">
                                {iconForType(item.type)}
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    {item.typeLabel}
                                  </span>
                                  <span className="text-xs text-gray-400 shrink-0">
                                    {formatWhen(item.createdAt)}
                                  </span>
                                </div>
                                <p className="text-sm font-medium text-gray-900 mt-0.5">
                                  {item.content}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {item.actor} · {item.subject}
                                </p>
                              </div>
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            )}
          </div>
        </div>
      </Drawer>
    ),
  };
}
