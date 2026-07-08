"use client";

import { useMemo } from "react";
import type { BobRosterSchemaField, BobStudent } from "@/platform/api/bob/students";
import { TruncatedWithTooltip } from "@/components/TruncatedWithTooltip";
import { extractAirtableAttachments } from "@/lib/bobAirtableDisplay";
import { initialsOf, studentDisplayName } from "@/features/bob/roster/recordDisplay";
import { extractAirtableRecordIds } from "@/lib/bobAirtableDisplay";
import { OnboardingStatusChips } from "@/features/bob/onboarding/OnboardingStatusChips";
import { resolveStudentTrackLabel } from "@/lib/bobRosterTrackOptions";

function isAirtableRecordId(v: string) {
  return /^rec[a-zA-Z0-9]{8,}$/.test(v);
}

function pickBooleanField(fields: Record<string, unknown>, pattern: RegExp): boolean {
  for (const [k, v] of Object.entries(fields)) {
    if (!pattern.test(k)) continue;
    if (typeof v === "boolean") return v;
    const s = String(v ?? "").trim().toLowerCase();
    if (["yes", "true", "y", "1"].includes(s)) return true;
    if (["no", "false", "n", "0"].includes(s)) return false;
  }
  return false;
}

function percentFromAttendance(s: BobStudent): number | null {
  const a = s.attendanceStats;
  if (!a) return null;
  if (typeof a.hoursPct === "number") return a.hoursPct;
  const present = a.present ?? 0;
  const absent = a.absent ?? 0;
  const total = present + absent;
  if (!total) return null;
  return Math.round((present / total) * 100);
}

function formatDeliverables(s: BobStudent): string | null {
  const m = s.milestoneStats;
  if (!m) return null;
  if (typeof m.pctDueSubmitted === "number" && m.total) {
    return `${m.pctDueSubmitted}% due`;
  }
  const submitted = m.submitted ?? 0;
  const total = m.total ?? 0;
  if (!total) return `${submitted} submitted`;
  return `${submitted}/${total}`;
}

function Chip({ label, className }: { label: string; className: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}>
      {label}
    </span>
  );
}

export function RosterGridView({
  students,
  headshot,
  columns,
  labelsForField,
  onOpenStudent,
  simplifiedView = false,
  ownStudentId = null,
}: {
  students: BobStudent[];
  headshot: BobRosterSchemaField | null;
  columns: BobRosterSchemaField[];
  labelsForField: (fieldName: string) => Record<string, string>;
  onOpenStudent: (id: string) => void;
  /** Youth roster — name, track, and team only (no peer stats). */
  simplifiedView?: boolean;
  /** In simplified view, only this student opens the detail drawer (own profile). */
  ownStudentId?: string | null;
}) {
  const fieldNames = useMemo(() => columns.map((c) => c.name), [columns]);

  function displayFromField(
    fields: Record<string, unknown>,
    fallback: string,
    patterns: RegExp[],
  ): string {
    const name =
      fieldNames.find((n) => patterns.some((p) => p.test(n))) ||
      Object.keys(fields).find((n) => patterns.some((p) => p.test(n))) ||
      "";
    if (name) {
      const labelMap = labelsForField(name);
      const ids = extractAirtableRecordIds(fields[name]);
      const firstLabel =
        ids.map((id) => labelMap[id]).find((lab) => typeof lab === "string" && lab.trim())
          ?.trim() || "";
      if (firstLabel && !isAirtableRecordId(firstLabel)) return firstLabel;

      const raw = fields[name];
      if (typeof raw === "string") {
        const s = raw.trim();
        if (s && !isAirtableRecordId(s)) return s;
      }
    }
    if (fallback && !isAirtableRecordId(fallback)) return fallback;
    return "";
  }

  const cards = useMemo(() => {
    return students.map((s) => {
      const fields = (s.airtableFields || {}) as Record<string, unknown>;
      const name = studentDisplayName(s);
      const school = displayFromField(fields, s.school ?? "", [/^school$/i, /site/i, /organization/i]);
      const track = resolveStudentTrackLabel(s);
      const blitzTeam = s.blitzSquad || s.blitzColor || "";
      const pod = displayFromField(fields, "", [/pod/i]);
      const coach = displayFromField(fields, s.coach ?? "", [/^coach$/i, /case\s*manager/i]);
      const atRisk = pickBooleanField(fields, /at\s*risk/i);

      const attachments = headshot ? extractAirtableAttachments(fields[headshot.name]) : [];
      const photoUrl = attachments?.[0]?.url || "";

      const attendancePct = percentFromAttendance(s);
      const milestone = formatDeliverables(s);
      return {
        id: s.id,
        name,
        track: track === "Unassigned" ? "" : track,
        blitzTeam,
        pod,
        coach,
        school,
        atRisk,
        photoUrl,
        initials: initialsOf(name),
        attendancePct,
        milestone,
        onboardingStatus: s.onboardingStatus,
      };
    });
  }, [students, headshot, fieldNames, labelsForField]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((c) => {
        const isOwnProfile =
          simplifiedView && ownStudentId && c.id === ownStudentId;
        const canOpen = !simplifiedView || Boolean(isOwnProfile);
        const cardClass =
          "text-left rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden " +
          (canOpen
            ? "hover:shadow-md transition-shadow cursor-pointer"
            : "cursor-default");

        const inner = (
          <div className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative h-12 w-12 shrink-0 rounded-full bg-gray-100 overflow-hidden ring-2 ring-gray-100">
                  {c.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.photoUrl}
                      alt=""
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-xs font-bold text-gray-500">
                      {c.initials}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <TruncatedWithTooltip
                    text={c.name}
                    className="text-sm font-semibold text-gray-900"
                    maxWidthClass="max-w-[220px]"
                  />
                  {c.school ? (
                    <TruncatedWithTooltip
                      text={c.school}
                      className="text-xs text-gray-500"
                      maxWidthClass="max-w-[220px]"
                    />
                  ) : null}
                </div>
              </div>

              <div className="shrink-0">
                {c.atRisk ? (
                  <Chip label="At Risk" className="bg-red-50 text-red-700 border border-red-200" />
                ) : null}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {c.track ? (
                <Chip label={c.track} className="bg-indigo-50 text-indigo-700 border border-indigo-200" />
              ) : null}
              {c.blitzTeam ? (
                <Chip
                  label={c.blitzTeam}
                  className="bg-violet-50 text-violet-800 border border-violet-200"
                />
              ) : null}
              {c.pod ? (
                <Chip label={c.pod} className="bg-gray-50 text-gray-700 border border-gray-200" />
              ) : null}
            </div>

            {!simplifiedView ? (
              <>
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <OnboardingStatusChips status={c.onboardingStatus} compact />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 text-xs text-gray-600">
                  <div className="min-w-0">
                    <div className="text-[11px] text-gray-400">Track</div>
                    <div className="truncate font-medium text-gray-800">{c.track || "—"}</div>
                  </div>
                  <div className="min-w-0 text-right">
                    <div className="text-[11px] text-gray-400">Blitz team</div>
                    <div className="truncate font-medium text-gray-800">
                      {c.blitzTeam || "—"}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] text-gray-400">Deliverables</div>
                    <div className="truncate font-medium text-gray-800">{c.milestone ?? "—"}</div>
                  </div>
                  <div className="min-w-0 text-right">
                    <div className="text-[11px] text-gray-400">Attendance</div>
                    <div className="font-semibold text-gray-900">
                      {c.attendancePct != null ? `${c.attendancePct}%` : "—"}
                    </div>
                  </div>
                </div>
              </>
            ) : null}

            {isOwnProfile ? (
              <p className="mt-3 text-[11px] font-medium text-orange-700">
                View my profile →
              </p>
            ) : null}
          </div>
        );

        if (!canOpen) {
          return (
            <div key={c.id} className={cardClass} aria-label={c.name}>
              {inner}
            </div>
          );
        }

        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onOpenStudent(c.id)}
            className={cardClass}
          >
            {inner}
          </button>
        );
      })}
    </div>
  );
}

