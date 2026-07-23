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
  expectedHoursForDate,
  isProgramDay,
  PROGRAM_END_DATE,
  PROGRAM_START_DATE,
} from "@/lib/bobProgramCalendar";
import {
  useBobAttendanceRecord,
  useSaveBobAttendanceRecord,
} from "@/platform/query/hooks/useBobAttendance";
import {
  staffCorrectionIso,
  toTimeInputValue,
  combineDateAndTime,
} from "../model/attendanceRecordTime";
import {
  computeEffectiveHoursPresent,
  computeHoursPresentFromPunchSlots,
  computeSessionHours,
  deriveAttendanceStatusLabel,
  effectiveStaffTime,
  formatHoursValue,
  hasStaffMorningInCorrection,
  isScheduledPlaceholderTime,
  staffAfternoonInInput,
  staffAfternoonOutInput,
  staffMorningInInput,
  staffMorningOutInput,
  syncedPunchLabel,
} from "../model/staffRecordDerived";
import { resolveDayHoursNumeric } from "../model/dayHours";
import { formatAttendanceTime } from "../model/formatAttendanceTime";
import { resolveAttendanceStaffNote } from "../model/attendanceStaffNotes";
import { parseApiError } from "@/platform/api/errors";

function formatFinalTimeLabel(date: string, hhmm: string): string {
  if (!hhmm?.trim()) return "—";
  return formatAttendanceTime(combineDateAndTime(date, hhmm)) || hhmm;
}

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
  syncedHint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  syncedHint?: string;
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
      {syncedHint ? (
        <p className="text-[10px] text-gray-500 mt-0.5">
          Student: {syncedHint}
        </p>
      ) : null}
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
    setMorningIn(staffMorningInInput(r));
    setMorningOut(staffMorningOutInput(r));
    setAfternoonIn(staffAfternoonInInput(r));
    setAfternoonOut(staffAfternoonOutInput(r, day));
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

  const effectiveMorningIn = effectiveStaffTime(morningIn, day, "am_in");
  const effectiveMorningOut = effectiveStaffTime(morningOut, day, "am_out");
  const effectiveAfternoonIn = effectiveStaffTime(afternoonIn, day, "pm_in");
  const effectiveAfternoonOut = effectiveStaffTime(afternoonOut, day, "pm_out");

  const morningHours = useMemo(() => {
    if (status === "excused" || status === "absent") return 0;
    return computeSessionHours(
      day.date,
      effectiveMorningIn,
      effectiveMorningOut,
    );
  }, [day.date, status, effectiveMorningIn, effectiveMorningOut]);
  const afternoonHours = useMemo(() => {
    if (status === "excused" || status === "absent") return 0;
    return computeSessionHours(
      day.date,
      effectiveAfternoonIn,
      effectiveAfternoonOut,
    );
  }, [day.date, status, effectiveAfternoonIn, effectiveAfternoonOut]);
  const hoursPresent = useMemo(() => {
    if (status === "excused" || status === "absent") return 0;
    const punchHours = computeHoursPresentFromPunchSlots(day.date, day.punches);
    const morningInForCalc =
      source?.signInTime && isScheduledPlaceholderTime(source.signInTime)
        ? ""
        : morningIn;
    const fromEffective = computeEffectiveHoursPresent(day, {
      morningIn: morningInForCalc,
      morningOut,
      afternoonIn,
      afternoonOut,
    });
    if (fromEffective > 0) return fromEffective;
    if (punchHours > 0) return punchHours;
    return resolveDayHoursNumeric(day);
  }, [
    day,
    status,
    morningIn,
    morningOut,
    afternoonIn,
    afternoonOut,
    source?.signInTime,
  ]);
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
    payload.hoursPresent =
      status === "excused" || status === "absent"
        ? "0"
        : formatHoursValue(hoursPresent);

    if (notes.trim()) payload.notes = notes.trim();
    else if (source?.notes) payload.notes = null;

    const morningInIso = staffCorrectionIso(
      day.date,
      morningIn,
      hasStaffMorningInCorrection(source) ? source?.signInTime : null,
    );
    if (morningInIso !== undefined) {
      payload.signInTime = morningInIso;
      if (morningInIso) {
        payload.manualOverride = new Date().toISOString();
      }
    }

    const morningOutIso = staffCorrectionIso(
      day.date,
      morningOut,
      source?.staffCorrectionSignOut,
    );
    if (morningOutIso !== undefined) {
      payload.staffCorrectionSignOut = morningOutIso;
    }

    const afternoonInIso = staffCorrectionIso(
      day.date,
      afternoonIn,
      source?.staffCorrectionSignIn,
    );
    if (afternoonInIso !== undefined) {
      payload.staffCorrectionSignIn = afternoonInIso;
    }

    const afternoonOutIso = staffCorrectionIso(
      day.date,
      afternoonOut,
      source?.signOutTime || source?.adjustedSignOut,
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
  const outsideProgram = !isProgramDay(day.date);

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          How times are shown
        </p>
        <p className="text-xs text-gray-600 mt-0.5">
          The hub keeps three layers separate: <strong>Youth sign-in</strong>{" "}
          (kiosk punches), <strong>Staff corrections</strong> (times you enter
          here), and <strong>Final record</strong> (youth + staff merged for
          payroll). Enter only the punches you need to fix — leave others blank
          to keep the student&apos;s data. Schedule autofills (12:30 / 6:30 PM)
          are ignored and never shown as staff corrections.
        </p>
      </div>

      {outsideProgram ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2">
          <p className="text-xs font-medium text-amber-900">
            {day.date} is outside the program calendar ({PROGRAM_START_DATE} –{" "}
            {PROGRAM_END_DATE}, weekdays only). Saves may succeed, but this day
            will not appear on the main attendance hub. Use a program weekday
            (e.g. July 29 showcase) if you meant a summer program day.
          </p>
        </div>
      ) : null}

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
            status === "excused" || status === "absent"
              ? "Excused/absent days do not count toward hours"
              : expectedHours > 0
                ? `Auto-calculated · ${expectedHours}h expected today`
                : "Auto-calculated"
          }
        />
      </div>

      <div className="rounded-lg border border-gray-200 p-3 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Youth sign-in (kiosk)
        </p>
        <PunchGrid day={day} />
      </div>

      <div className="rounded-lg border border-orange-200 bg-orange-50/40 p-3 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-orange-800">
          Staff corrections (edit)
        </p>
        <div className="grid grid-cols-2 gap-3">
          <TimeField
            label="Morning sign in"
            value={morningIn}
            onChange={setMorningIn}
            syncedHint={syncedPunchLabel(day, "am_in")}
          />
          <TimeField
            label="Morning sign out"
            value={morningOut}
            onChange={setMorningOut}
            syncedHint={syncedPunchLabel(day, "am_out")}
          />
          <TimeField
            label="Afternoon sign in"
            value={afternoonIn}
            onChange={setAfternoonIn}
            syncedHint={syncedPunchLabel(day, "pm_in")}
          />
          <TimeField
            label="Afternoon sign out"
            value={afternoonOut}
            onChange={setAfternoonOut}
            syncedHint={syncedPunchLabel(day, "pm_out")}
          />
        </div>
        <div className="grid grid-cols-2 gap-3 pt-1 border-t border-orange-100">
          <ReadOnlyField
            label="Morning session"
            value={`${morningHours}h`}
            hint="Staff correction + student sign-in"
          />
          <ReadOnlyField
            label="Afternoon session"
            value={`${afternoonHours}h`}
            hint="Staff correction + student sign-in"
          />
        </div>
      </div>

      <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-3 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
          Final attendance record
        </p>
        <p className="text-xs text-emerald-900/80">
          Student sign-in times plus any staff corrections. These are the final
          times used to calculate attendance hours.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <ReadOnlyField
            label="Morning sign in"
            value={formatFinalTimeLabel(day.date, effectiveMorningIn)}
            hint="Student + staff correction"
          />
          <ReadOnlyField
            label="Morning sign out"
            value={formatFinalTimeLabel(day.date, effectiveMorningOut)}
            hint="Student + staff correction"
          />
          <ReadOnlyField
            label="Afternoon sign in"
            value={formatFinalTimeLabel(day.date, effectiveAfternoonIn)}
            hint="Student + staff correction"
          />
          <ReadOnlyField
            label="Afternoon sign out"
            value={formatFinalTimeLabel(day.date, effectiveAfternoonOut)}
            hint="Student + staff correction"
          />
        </div>
        <div className="grid grid-cols-3 gap-3 pt-1 border-t border-emerald-100">
          <ReadOnlyField
            label="Morning session"
            value={`${morningHours}h`}
            hint="Final hours"
          />
          <ReadOnlyField
            label="Afternoon session"
            value={`${afternoonHours}h`}
            hint="Final hours"
          />
          <ReadOnlyField
            label="Total hours"
            value={`${hoursPresent}h`}
            hint="Final daily total"
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
