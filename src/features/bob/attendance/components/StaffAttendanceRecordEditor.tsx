"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  BobAttendanceStatus,
  CreateBobAttendanceInput,
} from "@/platform/api/bob/attendance";
import {
  BOB_ATTENDANCE_DEFAULT_PAID_AMOUNT,
  BOB_ATTENDANCE_STATUSES,
} from "@/platform/api/bob/attendance";
import type { StudentDayAttendance } from "../types";
import {
  useBobAttendanceRecord,
  useSaveBobAttendanceRecord,
} from "@/platform/query/hooks/useBobAttendance";
import {
  clearableIso,
  toTimeInputValue,
} from "../model/attendanceRecordTime";
import {
  computeHoursPresentFromStaffTimes,
  computeSessionHours,
  deriveAttendanceStatusLabel,
  formatHoursValue,
  syncedPunchLabel,
} from "../model/staffRecordDerived";
import { expectedHoursForDate } from "@/lib/bobProgramCalendar";
import { resolveAttendanceStaffNote } from "../model/attendanceStaffNotes";
import { parseApiError } from "@/platform/api/errors";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-medium text-gray-600 mb-1">
      {children}
    </label>
  );
}

function TimeField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-9 px-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
      />
    </div>
  );
}

function ReadOnlyField({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="h-9 px-2 flex items-center rounded-md border border-gray-200 bg-gray-50 text-sm text-gray-800 tabular-nums">
        {value}
      </div>
      {hint ? <p className="text-[10px] text-gray-500 mt-0.5">{hint}</p> : null}
    </div>
  );
}

function PunchGrid({ day }: { day: StudentDayAttendance }) {
  const rows = [
    { label: "Morning sign in", value: syncedPunchLabel(day, "am_in") },
    { label: "Morning sign out", value: syncedPunchLabel(day, "am_out") },
    { label: "Afternoon sign in", value: syncedPunchLabel(day, "pm_in") },
    { label: "Afternoon sign out", value: syncedPunchLabel(day, "pm_out") },
  ];
  return (
    <div className="grid grid-cols-2 gap-3">
      {rows.map((row) => (
        <ReadOnlyField
          key={row.label}
          label={row.label}
          value={row.value}
          hint="From youth sign-in / Airtable"
        />
      ))}
    </div>
  );
}

export function StaffAttendanceRecordEditor({
  day,
  onSaved,
}: {
  day: StudentDayAttendance;
  onSaved?: () => void;
}) {
  const recordId = day.dailyRecordId ?? null;
  const recordQuery = useBobAttendanceRecord(recordId);
  const saveMutation = useSaveBobAttendanceRecord();

  const record = recordQuery.data;
  const source = record ?? null;

  const [status, setStatus] = useState<BobAttendanceStatus | "">("");
  const [morningIn, setMorningIn] = useState("");
  const [morningOut, setMorningOut] = useState("");
  const [afternoonIn, setAfternoonIn] = useState("");
  const [afternoonOut, setAfternoonOut] = useState("");
  const [notes, setNotes] = useState("");
  const [paid, setPaid] = useState(false);
  const [paidAmount, setPaidAmount] = useState("");
  const [youthWorksBatch, setYouthWorksBatch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  useEffect(() => {
    const r = source;
    setStatus((r?.status as BobAttendanceStatus) || day.dailyStatus || "");
    setMorningIn(
      toTimeInputValue(
        r?.signInTime || r?.adjustedSignIn || day.punches.am_in.timeLabel,
      ),
    );
    setMorningOut(
      toTimeInputValue(
        r?.staffCorrectionSignOut ||
          r?.manualEndTime ||
          day.punches.am_out.timeLabel,
      ),
    );
    setAfternoonIn(
      toTimeInputValue(
        r?.staffCorrectionSignIn ||
          r?.manualStartTime ||
          day.punches.pm_in.timeLabel,
      ),
    );
    setAfternoonOut(
      toTimeInputValue(
        r?.signOutTime || r?.adjustedSignOut || day.punches.pm_out.timeLabel,
      ),
    );
    setNotes(r?.notes || resolveAttendanceStaffNote(day) || "");
    setPaid(Boolean(r?.paid));
    setPaidAmount(r?.paidAmount != null ? String(r.paidAmount) : "");
    setYouthWorksBatch(r?.youthWorksBatch || "");
    setSaved(false);
    setSyncMessage(null);
  }, [recordQuery.dataUpdatedAt, recordId, day]);

  const attendanceStatusLabel = useMemo(
    () => deriveAttendanceStatusLabel(status, day),
    [status, day],
  );

  const morningHours = useMemo(
    () => computeSessionHours(day.date, morningIn, morningOut),
    [day.date, morningIn, morningOut],
  );
  const afternoonHours = useMemo(
    () => computeSessionHours(day.date, afternoonIn, afternoonOut),
    [day.date, afternoonIn, afternoonOut],
  );
  const hoursPresent = useMemo(
    () =>
      computeHoursPresentFromStaffTimes(
        day.date,
        morningIn,
        morningOut,
        afternoonIn,
        afternoonOut,
      ),
    [day.date, morningIn, morningOut, afternoonIn, afternoonOut],
  );
  const expectedHours = expectedHoursForDate(day.date);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setSyncMessage(null);

    const payload: CreateBobAttendanceInput = {
      studentId: day.studentId,
      podId: day.podId,
      date: day.date,
    };

    if (status) payload.status = status;
    payload.excusedAbsence = status === "excused";
    payload.attendanceStatus = attendanceStatusLabel;
    payload.hoursPresent = formatHoursValue(hoursPresent);

    if (notes.trim()) payload.notes = notes.trim();
    else if (source?.notes) payload.notes = null;

    const morningInIso = clearableIso(day.date, morningIn, source?.signInTime);
    if (morningInIso !== undefined) payload.signInTime = morningInIso;

    const morningOutIso = clearableIso(
      day.date,
      morningOut,
      source?.staffCorrectionSignOut,
    );
    if (morningOutIso !== undefined) {
      payload.staffCorrectionSignOut = morningOutIso;
    }

    const afternoonInIso = clearableIso(
      day.date,
      afternoonIn,
      source?.staffCorrectionSignIn,
    );
    if (afternoonInIso !== undefined) {
      payload.staffCorrectionSignIn = afternoonInIso;
    }

    const afternoonOutIso = clearableIso(
      day.date,
      afternoonOut,
      source?.signOutTime,
    );
    if (afternoonOutIso !== undefined) payload.signOutTime = afternoonOutIso;

    if (source?.manualStartTime) payload.manualStartTime = null;
    if (source?.manualEndTime) payload.manualEndTime = null;

    payload.paid = paid;
    if (paidAmount.trim()) {
      const amount = Number(paidAmount.replace(/[$,\s]/g, ""));
      payload.paidAmount = Number.isFinite(amount) ? amount : null;
    } else if (paid && !source?.paidAmount) {
      payload.paidAmount = BOB_ATTENDANCE_DEFAULT_PAID_AMOUNT;
    } else if (source?.paidAmount != null) {
      payload.paidAmount = null;
    }
    if (youthWorksBatch.trim()) payload.youthWorksBatch = youthWorksBatch.trim();
    else if (source?.youthWorksBatch) payload.youthWorksBatch = null;

    try {
      const result = await saveMutation.mutateAsync({
        id: recordId,
        data: payload,
      });
      setSaved(true);
      setSyncMessage(
        result.airtableSync?.message ||
          (result.airtableSync?.synced
            ? "Saved in Dent and synced to Airtable."
            : "Saved in Dent."),
      );
      onSaved?.();
    } catch (err) {
      setError(parseApiError(err));
    }
  }

  const loading = Boolean(recordId) && recordQuery.isLoading;

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Staff corrections
        </p>
        <p className="text-xs text-gray-600 mt-0.5">
          Youth sign-in times are shown below for reference. Edit staff
          correction times — morning and afternoon hours calculate automatically.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading record…</p>
      ) : null}

      <div>
        <FieldLabel>Status</FieldLabel>
        <select
          value={status}
          onChange={(e) =>
            setStatus(e.target.value as BobAttendanceStatus | "")
          }
          className="w-full h-9 px-2 border border-gray-300 rounded-md text-sm bg-white"
        >
          <option value="">—</option>
          {BOB_ATTENDANCE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
        <p className="text-[10px] text-gray-500 mt-1">
          Use Excused or Absent here instead of a separate excused toggle.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <ReadOnlyField
          label="Attendance status"
          value={attendanceStatusLabel}
          hint="Derived from status"
        />
        <ReadOnlyField
          label="Hours present"
          value={`${hoursPresent}h`}
          hint={
            expectedHours > 0
              ? `Auto-calculated · ${expectedHours}h expected today`
              : "Auto-calculated"
          }
        />
      </div>

      <div className="rounded-lg border border-gray-200 p-3 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Synced sign-in / sign-out
        </p>
        <PunchGrid day={day} />
      </div>

      <div className="rounded-lg border border-orange-200 bg-orange-50/40 p-3 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-orange-800">
          Staff corrections
        </p>
        <div className="grid grid-cols-2 gap-3">
          <TimeField
            label="Morning sign in"
            value={morningIn}
            onChange={setMorningIn}
          />
          <TimeField
            label="Morning sign out"
            value={morningOut}
            onChange={setMorningOut}
          />
          <TimeField
            label="Afternoon sign in"
            value={afternoonIn}
            onChange={setAfternoonIn}
          />
          <TimeField
            label="Afternoon sign out"
            value={afternoonOut}
            onChange={setAfternoonOut}
          />
        </div>
        <div className="grid grid-cols-2 gap-3 pt-1 border-t border-orange-100">
          <ReadOnlyField
            label="Morning session"
            value={`${morningHours}h`}
            hint="From staff correction times"
          />
          <ReadOnlyField
            label="Afternoon session"
            value={`${afternoonHours}h`}
            hint="From staff correction times"
          />
        </div>
      </div>

      <div>
        <FieldLabel>Notes</FieldLabel>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm"
          placeholder="Staff notes or triage context"
        />
      </div>

      <details className="rounded-lg border border-dashed border-gray-200 bg-white">
        <summary className="cursor-pointer px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
          YouthWorks payroll
        </summary>
        <div className="space-y-3 border-t border-gray-100 px-3 py-3">
          <p className="text-xs text-gray-500">
            Longer-term pay tracking. Syncs to Airtable when Paid / Amount /
            YouthWorks Batch columns exist on the attendance table.
          </p>
          <label className="inline-flex items-center gap-2 text-sm text-gray-800">
            <input
              type="checkbox"
              checked={paid}
              onChange={(e) => {
                setPaid(e.target.checked);
                if (e.target.checked && !paidAmount.trim()) {
                  setPaidAmount(String(BOB_ATTENDANCE_DEFAULT_PAID_AMOUNT));
                }
              }}
              className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
            />
            Paid?
          </label>
          <div>
            <FieldLabel>Amount</FieldLabel>
            <input
              type="text"
              inputMode="decimal"
              value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
              placeholder={`e.g. ${BOB_ATTENDANCE_DEFAULT_PAID_AMOUNT}`}
              disabled={!paid}
              className="w-full h-9 px-2 border border-gray-300 rounded-md text-sm disabled:bg-gray-50 disabled:text-gray-400"
            />
          </div>
          <div>
            <FieldLabel>YouthWorks batch</FieldLabel>
            <input
              type="text"
              value={youthWorksBatch}
              onChange={(e) => setYouthWorksBatch(e.target.value)}
              placeholder="e.g. XYZ"
              className="w-full h-9 px-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
        </div>
      </details>

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      {saved ? (
        <p
          className={`text-sm ${syncMessage?.includes("import-only") || syncMessage?.includes("No linked") ? "text-amber-800" : "text-emerald-700"}`}
          role="status"
        >
          {syncMessage || "Saved in Dent."}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={saveMutation.isPending || loading}
        className="w-full h-10 rounded-lg bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 disabled:opacity-50"
      >
        {saveMutation.isPending ? "Saving…" : "Save staff corrections"}
      </button>
    </form>
  );
}
