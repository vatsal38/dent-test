"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  addBobSubmissionComment,
  BobSubmission,
  BobSubmissionEvent,
  BobSubmissionStatus,
  BobSubmissionType,
  getBobSubmission,
  getBobSubmissionEvents,
  getBobSubmissions,
  updateBobSubmission,
  BOB_SUBMISSION_STATUSES,
  BOB_SUBMISSION_TYPES,
  auth,
} from "@/lib/api";
import { Skeleton } from "@/components/Skeleton";
import { Drawer } from "@/components/Drawer";

const STATUS_LABELS: Record<BobSubmissionStatus, string> = {
  new: "New",
  triaged: "Triaged",
  in_progress: "In progress",
  waiting: "Waiting",
  done: "Done",
  archived: "Archived",
};

const TYPE_LABELS: Record<BobSubmissionType, string> = {
  incident: "Incident",
  blitz_points: "Blitz points",
  anonymous_feedback: "Anonymous feedback",
  progress_update: "Progress update",
  parent_contact: "Parent contact",
};

function badgeClassesForType(type: BobSubmissionType) {
  switch (type) {
    case "incident":
      return "bg-red-50 text-red-700 border-red-200";
    case "parent_contact":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "progress_update":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "anonymous_feedback":
      return "bg-purple-50 text-purple-700 border-purple-200";
    case "blitz_points":
      return "bg-green-50 text-green-700 border-green-200";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
}

function formatWhen(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function cardTitle(s: BobSubmission) {
  if (s.type === "incident")
    return s.incidentType ? `Incident · ${s.incidentType}` : "Incident";
  if (s.type === "blitz_points")
    return s.team ? `Blitz points · ${s.team}` : "Blitz points";
  if (s.type === "anonymous_feedback")
    return s.category ? `Feedback · ${s.category}` : "Anonymous feedback";
  if (s.type === "progress_update")
    return s.milestone ? `Progress · ${s.milestone}` : "Progress update";
  if (s.type === "parent_contact")
    return s.parentName ? `Parent contact · ${s.parentName}` : "Parent contact";
  return TYPE_LABELS[s.type] || s.type;
}

function cardSummary(s: BobSubmission) {
  const parts: string[] = [];
  if (s.student) parts.push(s.student);
  if (s.studentId && !s.student) parts.push(`student:${s.studentId}`);
  if (s.severity) parts.push(`severity: ${s.severity}`);
  if (s.points != null) parts.push(`${s.points} pts`);
  const body = (
    s.description ||
    s.feedback ||
    s.notes ||
    s.reason ||
    ""
  ).trim();
  if (body) parts.push(body.length > 80 ? body.slice(0, 80) + "…" : body);
  return parts.join(" · ");
}

export default function BobWorkflowPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<BobSubmission[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [typeFilter, setTypeFilter] = useState<BobSubmissionType | "">("");
  const [statusFilter, setStatusFilter] = useState<BobSubmissionStatus | "">(
    "",
  );
  const [showOnlyMine, setShowOnlyMine] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const me = auth.currentUser?.uid || null;
      const res = await getBobSubmissions({
        type: typeFilter || undefined,
        status: statusFilter || undefined,
        assignedTo: showOnlyMine && me ? me : undefined,
        search: debouncedSearch.trim() ? debouncedSearch.trim() : undefined,
        limit: 200,
      });
      setItems(res.submissions || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load workflow");
    } finally {
      setLoading(false);
    }
  }, [typeFilter, statusFilter, showOnlyMine, debouncedSearch]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(t);
  }, [search]);

  const columns = useMemo(() => {
    const map = new Map<BobSubmissionStatus, BobSubmission[]>();
    for (const st of BOB_SUBMISSION_STATUSES) map.set(st, []);
    for (const s of items) {
      const arr = map.get(s.status) || [];
      arr.push(s);
      map.set(s.status, arr);
    }
    return BOB_SUBMISSION_STATUSES.map((st) => ({
      status: st,
      label: STATUS_LABELS[st],
      items: (map.get(st) || []).sort(
        (a, b) =>
          new Date(b.lastTouchedAt).getTime() -
          new Date(a.lastTouchedAt).getTime(),
      ),
    }));
  }, [items]);

  const selected = useMemo(
    () => (selectedId ? items.find((x) => x.id === selectedId) || null : null),
    [items, selectedId],
  );

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-[520px] max-w-full" />
          </div>
          <Skeleton className="h-10 w-32" rounded="lg" />
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="min-w-[320px] w-[320px] bg-white border border-gray-200 rounded-lg p-4"
            >
              <Skeleton className="h-4 w-28 mb-3" />
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((__, j) => (
                  <div
                    key={j}
                    className="p-3 rounded-lg bg-gray-50 border border-gray-200"
                  >
                    <Skeleton className="h-4 w-44 mb-2" />
                    <Skeleton className="h-3 w-56" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
        <Link
          href="/app/bob"
          className="mt-4 inline-block text-sm text-orange-600 hover:underline"
        >
          ← Back to BoB
        </Link>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-[calc(100vh-5.5rem)] md:h-[calc(100vh-4rem)] min-h-0 overflow-hidden">
      <div className="px-6 py-6 border-b border-gray-200 bg-white">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">BoB workflow</h1>
            <p className="text-gray-600">
              Triage one-stop submissions into owned work and close the loop.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/app/bob/submit"
              className="px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 text-sm font-medium"
            >
              + New submission
            </Link>
            <button
              type="button"
              onClick={load}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-4">
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
              Search
            </label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Student, notes, reason…"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400"
            />
          </div>
          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
              Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) =>
                setTypeFilter(e.target.value as BobSubmissionType | "")
              }
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400"
            >
              <option value="">All</option>
              {BOB_SUBMISSION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as BobSubmissionStatus | "")
              }
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400"
            >
              <option value="">All</option>
              {BOB_SUBMISSION_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2 flex items-end">
            <label className="inline-flex items-center gap-2 text-sm text-gray-700 select-none">
              <input
                type="checkbox"
                checked={showOnlyMine}
                onChange={(e) => setShowOnlyMine(e.target.checked)}
                className="w-4 h-4 text-orange-600 border-gray-300 rounded"
              />
              Only mine
            </label>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden bg-gray-50">
        <div className="flex h-full min-h-0">
          <div
            className={`flex-1 min-w-0 overflow-x-auto pb-4 px-4 py-4 ${selectedId ? "hidden md:block" : ""}`}
          >
            <div className="flex gap-4 min-h-0">
              {columns
                .filter((c) => c.status !== "archived")
                .map((col) => (
                  <div
                    key={col.status}
                    className="min-w-[320px] w-[320px] flex flex-col min-h-0"
                  >
                    <div className="px-3 py-2 rounded-lg bg-white border border-gray-200 mb-3 flex items-center justify-between">
                      <div className="text-sm font-semibold text-gray-900">
                        {col.label}
                      </div>
                      <div className="text-xs text-gray-500">
                        {col.items.length}
                      </div>
                    </div>
                    <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1">
                      {col.items.length === 0 ? (
                        <div className="p-4 text-sm text-gray-500 bg-white border border-dashed border-gray-300 rounded-lg">
                          Nothing here.
                        </div>
                      ) : (
                        col.items.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => setSelectedId(s.id)}
                            className={`w-full text-left p-3 rounded-lg border shadow-sm transition-colors ${selectedId === s.id ? "bg-orange-50 border-orange-200" : "bg-white border-gray-200 hover:bg-gray-50"}`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <span
                                className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full border ${badgeClassesForType(s.type)}`}
                              >
                                {TYPE_LABELS[s.type]}
                              </span>
                              <span className="text-xs text-gray-400 whitespace-nowrap">
                                {formatWhen(s.createdAt)}
                              </span>
                            </div>
                            <p className="mt-2 text-sm font-medium text-gray-900 line-clamp-1">
                              {cardTitle(s)}
                            </p>
                            <p className="mt-1 text-xs text-gray-600 line-clamp-2">
                              {cardSummary(s) || "—"}
                            </p>
                            <div className="mt-2 flex items-center justify-between">
                              <span className="text-[11px] text-gray-500 truncate">
                                {s.assignedToLabel ||
                                  (s.assignedTo
                                    ? `Assigned: ${s.assignedTo}`
                                    : "Unassigned")}
                              </span>
                              {s.priority && (
                                <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                                  {s.priority}
                                </span>
                              )}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      <Drawer
        open={!!selectedId}
        onClose={() => setSelectedId(null)}
        widthClassName="w-full sm:w-[420px]"
        panelClassName="border-l border-gray-200"
      >
        {selectedId && (
          <SubmissionPanel
            submissionId={selectedId}
            onClose={() => setSelectedId(null)}
            onUpdated={load}
          />
        )}
      </Drawer>
    </div>
  );
}

function SubmissionPanel({
  submissionId,
  onClose,
  onUpdated,
}: {
  submissionId: string;
  onClose: () => void;
  onUpdated: () => Promise<void>;
}) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<BobSubmission | null>(null);
  const [events, setEvents] = useState<BobSubmissionEvent[]>([]);
  const [saving, setSaving] = useState(false);
  const [comment, setComment] = useState("");
  const [commenting, setCommenting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, ev] = await Promise.all([
        getBobSubmission(submissionId),
        getBobSubmissionEvents(submissionId, 100),
      ]);
      setData(s);
      setEvents(ev.events || []);
    } finally {
      setLoading(false);
    }
  }, [submissionId]);

  useEffect(() => {
    load();
  }, [load]);

  const myId = auth.currentUser?.uid || null;

  async function handleQuickAssign(toMe: boolean) {
    if (!data) return;
    setSaving(true);
    try {
      const next = await updateBobSubmission(data.id, {
        assignedTo: toMe ? myId : null,
        assignedToLabel: toMe ? "Me" : null,
        status: data.status === "new" ? "triaged" : data.status,
      });
      setData(next);
      await onUpdated();
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function handleStatus(next: BobSubmissionStatus) {
    if (!data) return;
    setSaving(true);
    try {
      const updated = await updateBobSubmission(data.id, { status: next });
      setData(updated);
      await onUpdated();
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function handleComment() {
    const c = comment.trim();
    if (!c || !data) return;
    setCommenting(true);
    try {
      await addBobSubmissionComment(data.id, c);
      setComment("");
      await load();
      await onUpdated();
    } finally {
      setCommenting(false);
    }
  }

  if (loading) {
    return (
      <div className="w-full bg-white p-6">
        <Skeleton className="h-6 w-48 mb-4" />
        <Skeleton className="h-4 w-64 mb-2" />
        <Skeleton className="h-10 w-full" rounded="lg" />
        <Skeleton className="h-32 w-full mt-4" rounded="lg" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="w-full bg-white flex flex-col min-h-0">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full border ${badgeClassesForType(data.type)}`}
              >
                {TYPE_LABELS[data.type]}
              </span>
              <span className="text-xs text-gray-500">
                {formatWhen(data.createdAt)}
              </span>
            </div>
            <h2 className="mt-2 text-lg font-semibold text-gray-900">
              {cardTitle(data)}
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              {data.student ||
                (data.studentId ? `student:${data.studentId}` : "—")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={saving || !myId}
            onClick={() => handleQuickAssign(true)}
            className="px-3 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 text-sm font-medium"
          >
            Assign to me
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => handleQuickAssign(false)}
            className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 text-sm font-medium"
          >
            Unassign
          </button>
        </div>

        <div className="mt-4">
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
            Status
          </label>
          <select
            value={data.status}
            onChange={(e) =>
              handleStatus(e.target.value as BobSubmissionStatus)
            }
            disabled={saving}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 disabled:opacity-60"
          >
            {BOB_SUBMISSION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6">
        <section>
          <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
            Details
          </h3>
          <div className="mt-2 bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2 text-sm text-gray-800">
            {data.description && (
              <p>
                <span className="font-medium">Description:</span>{" "}
                {data.description}
              </p>
            )}
            {data.feedback && (
              <p>
                <span className="font-medium">Feedback:</span> {data.feedback}
              </p>
            )}
            {data.notes && (
              <p>
                <span className="font-medium">Notes:</span> {data.notes}
              </p>
            )}
            {data.reason && (
              <p>
                <span className="font-medium">Reason:</span> {data.reason}
              </p>
            )}
            {data.points != null && (
              <p>
                <span className="font-medium">Points:</span> {data.points}
              </p>
            )}
            {data.team && (
              <p>
                <span className="font-medium">Team:</span> {data.team}
              </p>
            )}
            {data.parentName && (
              <p>
                <span className="font-medium">Parent:</span> {data.parentName}
              </p>
            )}
            {data.severity && (
              <p>
                <span className="font-medium">Severity:</span> {data.severity}
              </p>
            )}
            {data.incidentType && (
              <p>
                <span className="font-medium">Incident type:</span>{" "}
                {data.incidentType}
              </p>
            )}
            {data.milestone && (
              <p>
                <span className="font-medium">Milestone:</span> {data.milestone}
              </p>
            )}
            {!data.description &&
              !data.feedback &&
              !data.notes &&
              !data.reason && (
                <p className="text-gray-500">No additional fields.</p>
              )}
          </div>
        </section>

        <section>
          <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
            Activity
          </h3>
          <div className="mt-2 space-y-2">
            {events.length === 0 ? (
              <div className="text-sm text-gray-500">No activity yet.</div>
            ) : (
              events.map((e) => (
                <div
                  key={e.id}
                  className="p-3 rounded-lg bg-white border border-gray-200"
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs text-gray-500">
                      {formatWhen(e.createdAt)}
                    </span>
                    <span className="text-xs text-gray-400">{e.type}</span>
                  </div>
                  {e.content && (
                    <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                      {e.content}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <div className="p-6 border-t border-gray-200 bg-white">
        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
          Add comment
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          placeholder="What happened? What’s next?"
          className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400"
        />
        <button
          type="button"
          disabled={commenting || !comment.trim()}
          onClick={handleComment}
          className="mt-2 w-full px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50 text-sm font-medium"
        >
          {commenting ? "Posting…" : "Post comment"}
        </button>
      </div>
    </div>
  );
}
