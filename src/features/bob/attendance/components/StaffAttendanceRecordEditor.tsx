"use client";

import { useEffect, useState } from "react";
import type { BobAttendanceStatus, CreateBobAttendanceInput } from "@/platform/api/bob/attendance";
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
  const [attendanceStatus, setAttendanceStatus] = useState("");
  const [excusedAbsence, setExcusedAbsence] = useState(false);
  const [hoursPresent, setHoursPresent] = useState("");
  const [signIn, setSignIn] = useState("");
  const [signOut, setSignOut] = useState("");
  const [staffIn, setStaffIn] = useState("");
  const [staffOut, setStaffOut] = useState("");
  const [manualStart, setManualStart] = useState("");
  const [manualEnd, setManualEnd] = useState("");
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
    setAttendanceStatus(r?.attendanceStatus || r?.attendanceStatusHours || "");
    setExcusedAbsence(Boolean(r?.excusedAbsence));
    setHoursPresent(
      r?.hoursPresent != null
        ? String(r.hoursPresent)
        : day.totalHoursLabel?.replace(/[^\d.]/g, "") || "",
    );
    setSignIn(toTimeInputValue(r?.signInTime || r?.adjustedSignIn));
    setSignOut(toTimeInputValue(r?.signOutTime || r?.adjustedSignOut));
    setStaffIn(
      toTimeInputValue(r?.staffCorrectionSignIn || day.staffCorrectionSignIn),
    );
    setStaffOut(
      toTimeInputValue(r?.staffCorrectionSignOut || day.staffCorrectionSignOut),
    );
    setManualStart(toTimeInputValue(r?.manualStartTime));
    setManualEnd(toTimeInputValue(r?.manualEndTime));
    setNotes(r?.notes || day.notes || "");
    setPaid(Boolean(r?.paid));
    setPaidAmount(
      r?.paidAmount != null ? String(r.paidAmount) : "",
    );
    setYouthWorksBatch(r?.youthWorksBatch || "");
    setSaved(false);
    setSyncMessage(null);
  }, [recordQuery.dataUpdatedAt, recordId, day]);

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
    if (attendanceStatus.trim()) payload.attendanceStatus = attendanceStatus.trim();
    else if (source?.attendanceStatus) payload.attendanceStatus = null;
    payload.excusedAbsence = excusedAbsence;
    if (hoursPresent.trim()) payload.hoursPresent = hoursPresent.trim();
    else if (source?.hoursPresent) payload.hoursPresent = null;
    if (notes.trim()) payload.notes = notes.trim();
    else if (source?.notes) payload.notes = null;

    const signInIso = clearableIso(day.date, signIn, source?.signInTime);
    if (signInIso !== undefined) payload.signInTime = signInIso;
    const signOutIso = clearableIso(day.date, signOut, source?.signOutTime);
    if (signOutIso !== undefined) payload.signOutTime = signOutIso;
    const staffInIso = clearableIso(
      day.date,
      staffIn,
      source?.staffCorrectionSignIn,
    );
    if (staffInIso !== undefined) payload.staffCorrectionSignIn = staffInIso;
    const staffOutIso = clearableIso(
      day.date,
      staffOut,
      source?.staffCorrectionSignOut,
    );
    if (staffOutIso !== undefined) payload.staffCorrectionSignOut = staffOutIso;
    const manualStartIso = clearableIso(
      day.date,
      manualStart,
      source?.manualStartTime,
    );
    if (manualStartIso !== undefined) payload.manualStartTime = manualStartIso;
    const manualEndIso = clearableIso(day.date, manualEnd, source?.manualEndTime);
    if (manualEndIso !== undefined) payload.manualEndTime = manualEndIso;

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
          Attendance record
        </p>
        <p className="text-xs text-gray-600 mt-0.5">
          Edit like Airtable — youth submit corrections via One Stop; staff
          resolve here after triage.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading record…</p>
      ) : null}

      <div className="grid grid-cols-2 gap-3">
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
        </div>
        <div className="flex items-end pb-1">
          <label className="inline-flex items-center gap-2 text-sm text-gray-800">
            <input
              type="checkbox"
              checked={excusedAbsence}
              onChange={(e) => setExcusedAbsence(e.target.checked)}
              className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
            />
            Excused absence
          </label>
        </div>
      </div>

      <div>
        <FieldLabel>Attendance status</FieldLabel>
        <input
          type="text"
          value={attendanceStatus}
          onChange={(e) => setAttendanceStatus(e.target.value)}
          placeholder="e.g. Present, Missing punch"
          className="w-full h-9 px-2 border border-gray-300 rounded-md text-sm"
        />
      </div>

      <div>
        <FieldLabel>Hours present</FieldLabel>
        <input
          type="text"
          value={hoursPresent}
          onChange={(e) => setHoursPresent(e.target.value)}
          placeholder="e.g. 6.5"
          className="w-full h-9 px-2 border border-gray-300 rounded-md text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <TimeField label="Sign in" value={signIn} onChange={setSignIn} />
        <TimeField label="Sign out" value={signOut} onChange={setSignOut} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <TimeField
          label="Staff correction sign in"
          value={staffIn}
          onChange={setStaffIn}
        />
        <TimeField
          label="Staff correction sign out"
          value={staffOut}
          onChange={setStaffOut}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <TimeField
          label="Manual start"
          value={manualStart}
          onChange={setManualStart}
        />
        <TimeField label="Manual end" value={manualEnd} onChange={setManualEnd} />
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
        {saveMutation.isPending ? "Saving…" : "Save attendance record"}
      </button>
    </form>
  );
}
