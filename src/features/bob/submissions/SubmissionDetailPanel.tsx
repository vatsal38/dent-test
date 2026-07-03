"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import {
  BOB_SUBMISSION_STATUSES,
  type BobSubmissionStatus,
} from "@/platform/api/bob/submissions";
import { Skeleton } from "@/components/Skeleton";
import {
  badgeClassesForType,
  cardTitle,
  eventTypeLabel,
  formatEventSummary,
  formatWhen,
  formatLabel,
  resolveActorLabel,
  severityBadge,
  SUBMISSION_STATUS_LABELS,
  SUBMISSION_TYPE_LABELS,
} from "@/features/bob/submissions/display";
import { progressStatusLabel } from "@/features/bob/progress/progressConstants";
import { PRIORITY_OPTIONS } from "@/features/bob/submissions/workflow/constants";
import { useBobStaffList } from "@/platform/query/hooks/useBobStaff";
import { downloadBobSubmissionAttachment } from "@/platform/api/bob/submissions";
import {
  useAddBobSubmissionAttachment,
  useAddBobSubmissionComment,
  useBobSubmissionDetail,
  useBobSubmissionEvents,
  useUpdateBobSubmission,
} from "@/platform/query/hooks/useBobSubmissions";

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      const base64 = result.includes(",") ? result.split(",")[1] : result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function SubmissionDetailPanel({
  submissionId,
  onClose,
}: {
  submissionId: string;
  onClose: () => void;
}) {
  const { data, isLoading } = useBobSubmissionDetail(submissionId);
  const { data: events = [] } = useBobSubmissionEvents(submissionId);
  const { data: staffData } = useBobStaffList();
  const updateMutation = useUpdateBobSubmission();
  const commentMutation = useAddBobSubmissionComment();
  const attachmentMutation = useAddBobSubmissionAttachment();
  const [comment, setComment] = useState("");
  const [resolutionNote, setResolutionNote] = useState("");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const myId = auth.currentUser?.uid || null;
  const saving = updateMutation.isPending;
  const staff = staffData?.staff ?? [];

  if (isLoading || !data) {
    return (
      <div className="p-6">
        <Skeleton className="h-6 w-48 mb-4" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    );
  }

  const bodyText =
    data.reflection ||
    data.description ||
    data.concernSummary ||
    data.feedback ||
    data.notes ||
    data.reason ||
    [
      data.curriculumFeedback
        ? `Curriculum: ${data.curriculumFeedback}`
        : "",
      data.logisticsFeedback ? `Logistics: ${data.logisticsFeedback}` : "",
      data.openQuestions ? `Questions: ${data.openQuestions}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");

  return (
    <div className="flex flex-col min-h-full bg-white">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between gap-3">
          <div>
            <span
              className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full border ${badgeClassesForType(data.type)}`}
            >
              {SUBMISSION_TYPE_LABELS[data.type]}
            </span>
            <h2 className="mt-2 text-lg font-semibold text-gray-900">
              {cardTitle(data)}
            </h2>
            {data.type === "dent_testimony" &&
            data.testimonySubject === "staff" &&
            (data.staffMemberName || data.staffMemberId) ? (
              <Link
                href={
                  data.staffMemberId
                    ? `/app/bob/staff?staffId=${encodeURIComponent(data.staffMemberId)}`
                    : "/app/bob/staff"
                }
                className="text-sm text-orange-600 hover:underline font-medium"
              >
                {data.staffMemberName || "View staff roster"} →
              </Link>
            ) : data.type === "pto_request" && (data.staffMemberName || data.staffMemberId) ? (
              <Link
                href={
                  data.staffMemberId
                    ? `/app/bob/staff?staffId=${encodeURIComponent(data.staffMemberId)}`
                    : "/app/bob/staff"
                }
                className="text-sm text-orange-600 hover:underline font-medium"
              >
                {data.staffMemberName || "View staff roster"} →
              </Link>
            ) : data.studentId || (data.studentIds && data.studentIds.length > 0) ? (
              data.studentIds && data.studentIds.length > 1 ? (
                <div className="text-sm text-gray-600 space-y-1">
                  <p className="font-medium text-gray-700">Students</p>
                  <ul className="list-disc list-inside">
                    {(data.student || "")
                      .split(",")
                      .map((name) => name.trim())
                      .filter(Boolean)
                      .map((name) => (
                        <li key={name}>{name}</li>
                      ))}
                  </ul>
                </div>
              ) : data.studentId ? (
                <Link
                  href={`/app/bob/roster?id=${encodeURIComponent(data.studentId)}`}
                  className="text-sm text-orange-600 hover:underline font-medium"
                >
                  {data.student || "Open student profile"} →
                </Link>
              ) : (
                <p className="text-sm text-gray-600">{data.student || "—"}</p>
              )
            ) : (
              <p className="text-sm text-gray-600">{data.student || "—"}</p>
            )}
            {data.createdByLabel && !data.isAnonymous ? (
              <p className="text-xs text-gray-500 mt-1">
                Submitted by {data.createdByLabel}
              </p>
            ) : data.isAnonymous ? (
              <p className="text-xs text-gray-500 mt-1">Submitted anonymously</p>
            ) : null}
            {data.routingReason ? (
              <p className="text-xs text-gray-500 mt-1">
                Routed: {data.routingReason.replace(/_/g, " ")}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {data.severity ? (
            <span
              className={`text-xs px-2 py-0.5 rounded border ${severityBadge(data.severity)}`}
            >
              Severity: {formatLabel(data.severity)}
            </span>
          ) : null}
          {data.wellnessScore != null ? (
            <span className="text-xs px-2 py-0.5 rounded border bg-rose-50 text-rose-800">
              Score: {data.wellnessScore}/10
            </span>
          ) : data.wellnessLevel ? (
            <span className="text-xs px-2 py-0.5 rounded border bg-rose-50 text-rose-800">
              Wellness: {formatLabel(data.wellnessLevel)}
            </span>
          ) : null}
          {data.parentContacted ? (
            <span className="text-xs px-2 py-0.5 rounded border bg-amber-50 text-amber-800">
              Parent contacted: {formatLabel(data.parentContacted)}
            </span>
          ) : null}
          {data.requestAmount != null ? (
            <span className="text-xs px-2 py-0.5 rounded border bg-slate-100 text-slate-800">
              ${data.requestAmount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
            </span>
          ) : null}
          {data.requestStartDate && data.requestEndDate ? (
            <span className="text-xs px-2 py-0.5 rounded border bg-slate-100 text-slate-800">
              {data.requestStartDate} – {data.requestEndDate}
            </span>
          ) : null}
          {data.requestVendor ? (
            <span className="text-xs px-2 py-0.5 rounded border bg-slate-100 text-slate-700">
              Vendor: {data.requestVendor}
            </span>
          ) : null}
          {data.category &&
          ["pto_request", "purchase_request", "reimbursement_request"].includes(
            data.type,
          ) ? (
            <span className="text-xs px-2 py-0.5 rounded border bg-slate-100 text-slate-700">
              {formatLabel(data.category)}
            </span>
          ) : null}
          {data.coachRating != null ? (
            <span className="text-xs px-2 py-0.5 rounded border bg-indigo-50 text-indigo-800">
              Rating: {data.coachRating}/5
            </span>
          ) : null}
          {data.publicConsent ? (
            <span className="text-xs px-2 py-0.5 rounded border bg-violet-50 text-violet-800">
              Public use consent
            </span>
          ) : null}
          {data.testimonyFormat ? (
            <span className="text-xs px-2 py-0.5 rounded border bg-violet-50 text-violet-700">
              {formatLabel(data.testimonyFormat.replace(/_/g, " "))}
            </span>
          ) : null}
          {data.deliverableStatus ? (
            <span className="text-xs px-2 py-0.5 rounded border bg-blue-50 text-blue-800">
              Deliverable: {progressStatusLabel(data.deliverableStatus)}
            </span>
          ) : null}
          {data.blitzCategory ? (
            <span className="text-xs px-2 py-0.5 rounded border bg-amber-50 text-amber-900">
              {formatLabel(data.blitzCategory)}
              {data.points != null ? ` · ${data.points} pts` : ""}
            </span>
          ) : data.points != null ? (
            <span className="text-xs px-2 py-0.5 rounded border bg-amber-50 text-amber-900">
              {data.points} pts
            </span>
          ) : null}
          {data.team ? (
            <span className="text-xs px-2 py-0.5 rounded border bg-gray-100 text-gray-700">
              Team: {data.team}
            </span>
          ) : null}
          {data.blitzSource === "rollup" ? (
            <span className="text-xs px-2 py-0.5 rounded border bg-gray-100 text-gray-600">
              Global rollup
            </span>
          ) : data.blitzSource === "auto" ? (
            <span className="text-xs px-2 py-0.5 rounded border bg-emerald-50 text-emerald-800">
              Auto-awarded
            </span>
          ) : null}
          {data.teamName ? (
            <span className="text-xs px-2 py-0.5 rounded border bg-gray-100 text-gray-700">
              Team: {data.teamName}
            </span>
          ) : null}
          {data.priority &&
          data.priority.toLowerCase() !== (data.severity || "").toLowerCase() ? (
            <span className="text-xs px-2 py-0.5 rounded border bg-gray-100">
              Priority: {formatLabel(data.priority)}
            </span>
          ) : null}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={saving || !myId}
            onClick={() =>
              updateMutation.mutate({
                id: data.id,
                data: {
                  assignedTo: myId,
                  assignedToLabel: "Me",
                  status: data.status === "new" ? "triaged" : data.status,
                },
              })
            }
            className="px-3 py-2 rounded-lg bg-orange-500 text-white text-sm font-medium disabled:opacity-50"
          >
            Assign to me
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() =>
              updateMutation.mutate({
                id: data.id,
                data: { assignedTo: null, assignedToLabel: null },
              })
            }
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm"
          >
            Unassign
          </button>
        </div>

        <label className="block mt-4 text-xs font-semibold text-gray-600 uppercase">
          Assignee
        </label>
        <select
          value={data.assignedTo || ""}
          disabled={saving}
          onChange={(e) => {
            const id = e.target.value;
            const person = staff.find((s) => s.id === id);
            updateMutation.mutate({
              id: data.id,
              data: {
                assignedTo: id || null,
                assignedToLabel: person?.name || person?.email || null,
              },
            });
          }}
          className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
        >
          <option value="">Unassigned</option>
          {staff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name || s.email} ({s.bobRole})
            </option>
          ))}
        </select>

        {data.secondaryAssignees?.length ? (
          <p className="mt-2 text-xs text-rose-700">
            Also notified:{" "}
            {data.secondaryAssignees.map((a) => a.label).join(", ")}
          </p>
        ) : null}

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase">
              Status
            </label>
            <select
              value={data.status}
              disabled={saving}
              onChange={(e) =>
                updateMutation.mutate({
                  id: data.id,
                  data: {
                    status: e.target.value as BobSubmissionStatus,
                    source: "drawer",
                  },
                })
              }
              className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
            >
              {BOB_SUBMISSION_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {SUBMISSION_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase">
              Priority
            </label>
            <select
              value={data.priority || ""}
              disabled={saving}
              onChange={(e) =>
                updateMutation.mutate({
                  id: data.id,
                  data: { priority: e.target.value || null },
                })
              }
              className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
            >
              <option value="">—</option>
              {PRIORITY_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4 text-sm">
        {data.nextWeekPlan ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="text-xs font-semibold text-gray-600 uppercase mb-2">
              Next week
            </h3>
            <p className="whitespace-pre-wrap text-gray-800">{data.nextWeekPlan}</p>
          </div>
        ) : null}

        {data.proofLinks ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="text-xs font-semibold text-gray-600 uppercase mb-2">
              Proof links
            </h3>
            <p className="whitespace-pre-wrap text-gray-800 break-all">{data.proofLinks}</p>
          </div>
        ) : null}

        {bodyText ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="whitespace-pre-wrap">{bodyText}</p>
          </div>
        ) : null}

        <div>
          <h3 className="text-xs font-semibold text-gray-600 uppercase mb-2">
            Add comment
          </h3>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder="Add a comment…"
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
          />
          <button
            type="button"
            disabled={commentMutation.isPending || !comment.trim()}
            onClick={() => {
              const c = comment.trim();
              if (!c) return;
              commentMutation.mutate(
                { id: data.id, content: c },
                { onSuccess: () => setComment("") },
              );
            }}
            className="mt-2 w-full py-2 rounded-lg bg-gray-900 text-white text-sm font-medium disabled:opacity-50"
          >
            Post comment
          </button>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-gray-600 uppercase mb-2">
            Resolution
          </h3>
          <textarea
            value={resolutionNote || data.resolutionNote || ""}
            onChange={(e) => setResolutionNote(e.target.value)}
            rows={2}
            placeholder="Resolution note…"
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
          />
          <button
            type="button"
            disabled={saving || !(resolutionNote || data.resolutionNote)}
            onClick={() =>
              updateMutation.mutate({
                id: data.id,
                data: {
                  resolutionNote: resolutionNote || data.resolutionNote || "",
                },
              })
            }
            className="mt-2 text-sm text-orange-600 hover:underline disabled:opacity-50"
          >
            Save resolution
          </button>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-xs font-semibold text-gray-600 uppercase">
              Attachments
            </h3>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={attachmentMutation.isPending}
              className="text-xs text-orange-600 hover:underline"
            >
              Add file
            </button>
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file || file.size > 2 * 1024 * 1024) return;
                const content = await readFileAsBase64(file);
                attachmentMutation.mutate({
                  id: data.id,
                  file: {
                    filename: file.name,
                    mimeType: file.type || "application/octet-stream",
                    content,
                  },
                });
                e.target.value = "";
              }}
            />
          </div>
          {(data.attachments?.length ?? 0) === 0 ? (
            <p className="text-xs text-gray-400">No attachments</p>
          ) : (
            <ul className="space-y-1">
              {data.attachments?.map((a) => (
                <li
                  key={a.id}
                  className="text-xs px-2 py-1 rounded border border-gray-200 bg-gray-50 flex justify-between items-center gap-2"
                >
                  <span>
                    {a.filename}{" "}
                    <span className="text-gray-400">
                      {formatWhen(a.createdAt)}
                    </span>
                  </span>
                  <button
                    type="button"
                    disabled={downloadingId === a.id}
                    onClick={async () => {
                      setDownloadingId(a.id);
                      try {
                        await downloadBobSubmissionAttachment(
                          data.id,
                          a.id,
                        );
                      } finally {
                        setDownloadingId(null);
                      }
                    }}
                    className="text-orange-600 hover:underline shrink-0 disabled:opacity-50"
                  >
                    {downloadingId === a.id ? "…" : "Download"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h3 className="text-xs font-semibold text-gray-600 uppercase mb-2">
            Activity
          </h3>
          <div className="space-y-2">
            {events.length === 0 ? (
              <p className="text-xs text-gray-400">No activity yet.</p>
            ) : (
              events.map((e) => {
                const summary = formatEventSummary(e.type, e.content, e.meta);
                const actor = resolveActorLabel(e.actorId, staff);
                return (
                  <div
                    key={e.id}
                    className={`p-3 border rounded-lg ${
                      e.type === "comment"
                        ? "border-blue-100 bg-blue-50/30"
                        : "border-gray-200"
                    }`}
                  >
                    <div className="flex justify-between gap-2">
                      <span className="text-[10px] font-semibold uppercase text-gray-500">
                        {eventTypeLabel(e.type)}
                        <span className="font-normal normal-case text-gray-400">
                          {" "}
                          · {actor}
                        </span>
                      </span>
                      <span className="text-xs text-gray-400 shrink-0">
                        {formatWhen(e.createdAt)}
                      </span>
                    </div>
                    {summary ? (
                      <p className="mt-1 whitespace-pre-wrap text-gray-800">
                        {summary}
                      </p>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {data.statusHistory?.length ? (
          <div>
            <h3 className="text-xs font-semibold text-gray-600 uppercase mb-2">
              Status audit
            </h3>
            <ul className="text-xs space-y-1 text-gray-600">
              {[...(data.statusHistory || [])].reverse().map((h, i) => (
                <li key={i}>
                  {h.from ?? "—"} → {h.to} · {formatWhen(String(h.at))}
                  {h.source ? ` (${h.source})` : ""}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
