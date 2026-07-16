'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  getAttendanceCorrectionOptions,
  getAttendanceCorrectionStudents,
  submitAttendanceCorrection,
  type AttendanceCorrectionDateOption,
  type AttendanceCorrectionRequestType,
  type AttendanceCorrectionStudentOption,
} from '@/platform/api/bob/attendanceCorrection';
import { useBobStudentDetail } from '@/platform/query/hooks/useBobStudents';
import { useBobMe } from '@/platform/query/hooks/useBobMe';
import { useBobAccess } from '@/platform/rbac/useBobAccess';
import { parseApiError } from '@/platform/api/errors';
import { formatAttendanceTime } from './model/formatAttendanceTime';
import { useDebouncedValue } from './hooks/useDebouncedValue';
import { PageHeader } from '@/design-system/patterns/PageHeader';
import {
  listProgramDates,
  PROGRAM_END_DATE,
  PROGRAM_START_DATE,
} from '@/lib/bobProgramCalendar';
import { decodeBobReturnTo } from '@/lib/bobReturnUrl';
import { BOB_ATTENDANCE_CORRECTION_AIRTABLE_FORM } from '@/features/bob/submit/formsConfig';
import { Skeleton } from '@/components/Skeleton';
import { studentDisplayName } from '@/features/bob/roster/recordDisplay';
import type { BobStudent } from '@/platform/api/bob/students';

const REQUEST_TYPES: Array<{
  id: AttendanceCorrectionRequestType;
  label: string;
  description: string;
  pillClass: string;
}> = [
  {
    id: 'absence',
    label: 'Report absence',
    description:
      'Request approval for a planned upcoming absence or report a past absence.',
    pillClass: 'bg-sky-100 text-sky-900 border-sky-200',
  },
  {
    id: 'time_correction',
    label: 'Sign-in / sign-out correction',
    description: 'Fix sign-in or sign-out times for a specific program day.',
    pillClass: 'bg-blue-100 text-blue-900 border-blue-200',
  },
  {
    id: 'special',
    label: 'Special circumstance',
    description: 'Explain a unique situation affecting attendance on a specific day.',
    pillClass: 'bg-teal-100 text-teal-900 border-teal-200',
  },
];

function correctionStudentLabel(s: {
  firstName?: string | null;
  lastName?: string | null;
  preferredName?: string | null;
  id?: string;
}) {
  return (
    studentDisplayName({
      id: s.id || '',
      firstName: s.firstName || '',
      lastName: s.lastName || '',
      preferredName: s.preferredName || null,
      email: null,
      phone: null,
      status: 'active',
      interviewStage: 'placed',
      podId: null,
      track: null,
      createdAt: '',
      updatedAt: '',
    } as BobStudent) ||
    s.id ||
    ''
  );
}

function toTimeInputValue(iso?: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

function formatProgramDateLabel(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function AttendanceCorrectionPage() {
  const searchParams = useSearchParams();
  const meQuery = useBobMe();
  const { access } = useBobAccess();
  const demoScope = meQuery.data?.demoScope;
  const linkedStudentId = meQuery.data?.linkedStudent?.id ?? null;
  const urlStudentId = searchParams?.get('studentId') || '';
  const returnHref =
    decodeBobReturnTo(searchParams?.get('returnTo')) || '/app/bob/submit';
  const lockedStudentId = demoScope?.studentId
    ? String(demoScope.studentId)
    : access.role === 'student' && linkedStudentId
      ? linkedStudentId
      : urlStudentId;

  const [requestType, setRequestType] =
    useState<AttendanceCorrectionRequestType>('absence');
  const [studentId, setStudentId] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [studentDropdownOpen, setStudentDropdownOpen] = useState(false);
  const studentDropdownRef = useRef<HTMLDivElement>(null);

  const [dateOptions, setDateOptions] = useState<AttendanceCorrectionDateOption[]>([]);
  const [datesLoading, setDatesLoading] = useState(false);
  const [selectedDateId, setSelectedDateId] = useState('');
  const [absenceDate, setAbsenceDate] = useState('');
  const [correctionDay, setCorrectionDay] = useState('');
  const [specialDate, setSpecialDate] = useState('');

  const [absenceReason, setAbsenceReason] = useState('');
  const [correctionDetail, setCorrectionDetail] = useState('');
  const [specialCircumstance, setSpecialCircumstance] = useState('');
  const [correctedSignInTime, setCorrectedSignInTime] = useState('');
  const [correctedSignOutTime, setCorrectedSignOutTime] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [studentOptions, setStudentOptions] = useState<
    AttendanceCorrectionStudentOption[]
  >([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentsHint, setStudentsHint] = useState<string | null>(null);
  const debouncedStudentSearch = useDebouncedValue(studentSearch, 250);

  const isStudentLocked = Boolean(
    demoScope?.studentId || (access.role === 'student' && linkedStudentId),
  );
  const isStudentView = access.role === 'student' || isStudentLocked;
  const prefilledStudentQuery = useBobStudentDetail(
    !isStudentLocked && studentId && /^[a-f\d]{24}$/i.test(studentId)
      ? studentId
      : null,
  );

  const selectedStudent = useMemo(() => {
    if (!studentId) return null;
    const fromOptions = studentOptions.find((s) => s.id === studentId);
    if (fromOptions) return fromOptions;
    const fromDetail = prefilledStudentQuery.data;
    if (fromDetail && fromDetail.id === studentId) {
      return {
        id: fromDetail.id,
        firstName: fromDetail.firstName,
        lastName: fromDetail.lastName,
        preferredName: fromDetail.preferredName ?? null,
        email: fromDetail.email,
        school: fromDetail.school ?? null,
        airtableRecordId: null,
        attendanceDays: 0,
        latestAttendanceDate: null,
      } satisfies AttendanceCorrectionStudentOption;
    }
    return null;
  }, [studentId, studentOptions, prefilledStudentQuery.data]);

  const selectedDate = useMemo(
    () => dateOptions.find((d) => d.attendanceId === selectedDateId) ?? null,
    [dateOptions, selectedDateId],
  );

  // Include upcoming program days so youth can plan future absences
  const programDateOptions = useMemo(
    () =>
      listProgramDates({
        startDate: PROGRAM_START_DATE,
        endDate: PROGRAM_END_DATE,
        throughToday: false,
      }),
    [],
  );

  const lockedStudentName =
    meQuery.data?.linkedStudent?.name ||
    demoScope?.studentName ||
    (selectedStudent ? correctionStudentLabel(selectedStudent) : null);

  useEffect(() => {
    if (lockedStudentId) setStudentId(lockedStudentId);
  }, [lockedStudentId]);

  useEffect(() => {
    if (isStudentLocked) return;
    let cancelled = false;
    setStudentsLoading(true);
    void getAttendanceCorrectionStudents({
      search: debouncedStudentSearch.trim() || undefined,
      limit: 40,
    })
      .then((data) => {
        if (cancelled) return;
        setStudentOptions(data.students);
        setStudentsHint(data.hint ?? null);
      })
      .catch((e) => {
        if (cancelled) return;
        setStudentOptions([]);
        setStudentsHint(parseApiError(e));
      })
      .finally(() => {
        if (!cancelled) setStudentsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedStudentSearch, isStudentLocked]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        studentDropdownRef.current &&
        !studentDropdownRef.current.contains(e.target as Node)
      ) {
        setStudentDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const prefillDate = searchParams?.get('date');
    const prefillType = searchParams?.get('type');
    if (
      prefillType === 'absence' ||
      prefillType === 'time_correction' ||
      prefillType === 'special'
    ) {
      setRequestType(prefillType);
    }
    if (!prefillDate) return;
    if (prefillType === 'time_correction' || (!prefillType && requestType === 'time_correction')) {
      setCorrectionDay(prefillDate);
      if (dateOptions.length) {
        const match = dateOptions.find((d) => d.date === prefillDate);
        if (match) setSelectedDateId(match.attendanceId);
      }
      return;
    }
    if (prefillType === 'special') {
      setSpecialDate(prefillDate);
      return;
    }
    setAbsenceDate(prefillDate);
  }, [searchParams, dateOptions, requestType]);

  // Keep attendance record link in sync when youth picks a correction day
  useEffect(() => {
    if (requestType !== 'time_correction' || !correctionDay) return;
    const match = dateOptions.find((d) => d.date === correctionDay);
    setSelectedDateId(match?.attendanceId || '');
    if (!match) {
      setCorrectedSignInTime('');
      setCorrectedSignOutTime('');
    }
  }, [correctionDay, dateOptions, requestType]);

  const loadDates = useCallback(async (id: string) => {
    if (!id || !/^[a-f\d]{24}$/i.test(id)) {
      setDateOptions([]);
      return;
    }
    setDatesLoading(true);
    setError(null);
    try {
      const data = await getAttendanceCorrectionOptions(id);
      setDateOptions(data.dates);
      if (data.dates.length === 1) {
        setSelectedDateId(data.dates[0].attendanceId);
      }
    } catch (e) {
      setDateOptions([]);
      setError(parseApiError(e));
    } finally {
      setDatesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!studentId || !/^[a-f\d]{24}$/i.test(studentId)) return;
    void loadDates(studentId);
  }, [studentId, loadDates]);

  useEffect(() => {
    if (!selectedDate) return;
    if (!correctedSignInTime && selectedDate.signInTime) {
      setCorrectedSignInTime(toTimeInputValue(selectedDate.signInTime));
    }
    if (!correctedSignOutTime && selectedDate.signOutTime) {
      setCorrectedSignOutTime(toTimeInputValue(selectedDate.signOutTime));
    }
  }, [selectedDate, correctedSignInTime, correctedSignOutTime]);

  function selectStudent(s: AttendanceCorrectionStudentOption | null) {
    setStudentId(s?.id ?? '');
    setSelectedDateId('');
    setCorrectionDay('');
    setSpecialDate('');
    setDateOptions([]);
    setStudentSearch('');
    setStudentDropdownOpen(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!studentId) {
      setError(isStudentView ? 'Your student account is not linked yet. Ask staff for help.' : 'Select a student to continue.');
      return;
    }
    if (!requestType) {
      setError('Select a request type.');
      return;
    }

    const matchedAbsenceOption =
      requestType === 'absence'
        ? dateOptions.find((d) => d.date === absenceDate) ?? null
        : null;
    const matchedCorrectionOption =
      requestType === 'time_correction'
        ? dateOptions.find((d) => d.date === correctionDay) ?? selectedDate
        : null;
    const matchedSpecialOption =
      requestType === 'special'
        ? dateOptions.find((d) => d.date === specialDate) ?? null
        : null;

    const dayForRequest =
      requestType === 'absence'
        ? absenceDate
        : requestType === 'time_correction'
          ? correctionDay
          : specialDate;

    if (
      (requestType === 'absence' ||
        requestType === 'time_correction' ||
        requestType === 'special') &&
      !dayForRequest
    ) {
      setError('Select the specific program day for this request.');
      return;
    }

    setSubmitting(true);
    try {
      await submitAttendanceCorrection({
        studentId,
        requestType,
        attendanceId:
          requestType === 'time_correction'
            ? matchedCorrectionOption?.attendanceId
            : requestType === 'absence'
              ? matchedAbsenceOption?.attendanceId
              : matchedSpecialOption?.attendanceId,
        attendanceAirtableRecordId:
          requestType === 'time_correction'
            ? matchedCorrectionOption?.airtableRecordId
            : requestType === 'absence'
              ? matchedAbsenceOption?.airtableRecordId
              : matchedSpecialOption?.airtableRecordId,
        attendanceDate: dayForRequest,
        absenceReason: absenceReason || undefined,
        correctionDetail: correctionDetail || undefined,
        specialCircumstance: specialCircumstance || undefined,
        correctedSignInDate:
          requestType === 'time_correction' ? dayForRequest : undefined,
        correctedSignInTime: correctedSignInTime || undefined,
        correctedSignOutDate:
          requestType === 'time_correction' ? dayForRequest : undefined,
        correctedSignOutTime: correctedSignOutTime || undefined,
      });
      setSubmitted(true);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (meQuery.isLoading && !meQuery.data) {
    return (
      <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-4" aria-busy="true">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto p-4 sm:p-6">
        <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
          <p className="text-lg font-semibold text-green-900">Request submitted</p>
          <p className="text-sm text-green-800 mt-2">
            Your absence or correction request was sent for staff review. You will
            hear back once it is processed in Airtable.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setSubmitted(false);
                setAbsenceReason('');
                setCorrectionDetail('');
                setSpecialCircumstance('');
                setCorrectedSignInTime('');
                setCorrectedSignOutTime('');
                setSelectedDateId('');
                setAbsenceDate('');
                setCorrectionDay('');
                setSpecialDate('');
              }}
              className="px-4 py-2 rounded-lg bg-white border border-green-300 text-sm font-medium text-green-900 hover:bg-green-100"
            >
              Submit another
            </button>
            <Link
              href={returnHref}
              className="px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600"
            >
              Back to forms
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const showTimeCorrectionDates = requestType === 'time_correction';
  const showAbsenceDate = requestType === 'absence';
  const showSpecialDate = requestType === 'special';
  const canSubmit =
    (showAbsenceDate && Boolean(absenceDate)) ||
    (showTimeCorrectionDates && Boolean(correctionDay)) ||
    (showSpecialDate && Boolean(specialDate));

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6">
      <Link
        href={returnHref}
        className="text-sm text-orange-600 hover:underline"
      >
        ← Back to forms
      </Link>

      <div className="mt-4">
      <PageHeader
        eyebrow="School-Year Programs"
        title="Absence & Sign In/Out Correction"
        description={
          isStudentView
            ? 'Report absences you know are coming, or correct sign-in and sign-out times for days you already attended.'
            : 'Submit student absence requests or sign-in/out time corrections for staff review.'
        }
      />
      </div>

      {!isStudentView ? (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <p className="font-medium">Deadline reminder</p>
          <p className="mt-1 text-amber-900/90">
            Time corrections are due the Monday before each pay day. Review daily
            attendance before submitting.
          </p>
        </div>
      ) : (
        <div className="mb-6 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-950">
          <p className="font-medium">How this works</p>
          <p className="mt-1 text-sky-900/90">
            Use <strong>Report absence</strong> for upcoming or past absences.
            Use <strong>Sign-in / sign-out correction</strong> when you attended
            but your punch times look wrong. Prefer this Dent form; the official
            Airtable form is still available if needed.
          </p>
          <a
            href={BOB_ATTENDANCE_CORRECTION_AIRTABLE_FORM}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex text-sm font-medium text-sky-800 underline hover:text-sky-950"
          >
            Open Airtable Absence &amp; Sign In/Out Correction form ↗
          </a>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        ) : null}

        <div ref={studentDropdownRef}>
          <label className="block text-sm font-medium text-gray-900 mb-1">
            Student {isStudentView ? '' : 'name '}
            <span className="text-red-500">*</span>
          </label>
          {isStudentLocked ? (
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-900">
              {lockedStudentName || 'Your account'}
              {!/^[a-f\d]{24}$/i.test(studentId) ? (
                <p className="mt-1 text-xs font-normal text-amber-700">
                  Your login is not linked to a roster student yet. Ask staff to
                  provision your student account.
                </p>
              ) : null}
            </div>
          ) : (
            <>
              <p className="text-xs text-gray-500 mb-2">
                Only students with imported attendance appear here. Try searching
                &quot;Arondae&quot;, &quot;London&quot;, or &quot;Jada&quot;.
              </p>
              <button
                type="button"
                onClick={() => setStudentDropdownOpen((o) => !o)}
                className="w-full text-left px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white hover:border-orange-300 focus:ring-2 focus:ring-orange-500"
              >
                {selectedStudent
                  ? correctionStudentLabel(selectedStudent)
                  : 'Search student with attendance…'}
              </button>
              {studentDropdownOpen ? (
                <div className="relative z-20">
                  <div className="absolute mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg max-h-72 overflow-hidden">
                    <input
                      type="search"
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      placeholder="Type first or last name…"
                      className="w-full px-3 py-2 border-b border-gray-100 text-sm focus:outline-none"
                      autoFocus
                    />
                    <ul className="max-h-60 overflow-y-auto">
                      {studentsLoading ? (
                        <li className="px-3 py-4 text-sm text-gray-500 text-center">
                          Loading students…
                        </li>
                      ) : null}
                      {!studentsLoading &&
                        studentOptions.map((s) => (
                          <li key={s.id}>
                            <button
                              type="button"
                              onClick={() => selectStudent(s)}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-orange-50"
                            >
                              <span className="font-medium text-gray-900">
                                {correctionStudentLabel(s)}
                              </span>
                              <span className="block text-xs text-gray-500 mt-0.5">
                                {s.attendanceDays} attendance day
                                {s.attendanceDays === 1 ? '' : 's'}
                                {s.latestAttendanceDate
                                  ? ` · latest ${s.latestAttendanceDate}`
                                  : ''}
                                {s.school ? ` · ${s.school}` : ''}
                              </span>
                            </button>
                          </li>
                        ))}
                      {!studentsLoading && studentOptions.length === 0 ? (
                        <li className="px-3 py-4 text-sm text-gray-500 text-center">
                          {studentsHint ||
                            'No students with attendance match your search.'}
                        </li>
                      ) : null}
                    </ul>
                  </div>
                </div>
              ) : null}
              {studentsHint && !studentDropdownOpen ? (
                <p className="mt-2 text-xs text-amber-700">{studentsHint}</p>
              ) : null}
            </>
          )}
        </div>

        <fieldset>
          <legend className="block text-sm font-medium text-gray-900 mb-2">
            Request type <span className="text-red-500">*</span>
          </legend>
          <div className="space-y-2">
            {REQUEST_TYPES.map((t) => {
              const active = requestType === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setRequestType(t.id);
                    setError(null);
                    if (t.id === 'absence' && selectedDate?.date) {
                      setAbsenceDate(selectedDate.date);
                    }
                    if (t.id === 'time_correction' && (absenceDate || specialDate)) {
                      setCorrectionDay(absenceDate || specialDate);
                    }
                    if (t.id === 'special' && (absenceDate || correctionDay)) {
                      setSpecialDate(absenceDate || correctionDay);
                    }
                  }}
                  className={`w-full text-left rounded-xl border px-4 py-3 transition-all ${
                    active
                      ? `${t.pillClass} ring-2 ring-orange-400 ring-offset-1`
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold border ${t.pillClass}`}
                  >
                    {t.label}
                  </span>
                  <p className="text-sm text-gray-600 mt-1">{t.description}</p>
                </button>
              );
            })}
          </div>
        </fieldset>

        {showAbsenceDate ? (
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Absence date <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Pick any program day — including upcoming dates for planned absences.
            </p>
            <select
              value={absenceDate}
              onChange={(e) => setAbsenceDate(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">Select a program day…</option>
              {programDateOptions.map((date) => (
                <option key={date} value={date}>
                  {formatProgramDateLabel(date)} ({date})
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {showTimeCorrectionDates ? (
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Day to correct <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Pick the specific program day first — then enter the corrected
              times for that day.
            </p>
            <select
              value={correctionDay}
              onChange={(e) => {
                setCorrectionDay(e.target.value);
                setCorrectedSignInTime('');
                setCorrectedSignOutTime('');
              }}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">Select a program day…</option>
              {programDateOptions.map((date) => {
                const match = dateOptions.find((d) => d.date === date);
                return (
                  <option key={date} value={date}>
                    {formatProgramDateLabel(date)} ({date})
                    {match ? ' · attendance on file' : ''}
                  </option>
                );
              })}
            </select>
            {datesLoading ? (
              <p className="text-sm text-gray-500 mt-2">Loading recorded punches…</p>
            ) : null}
            {selectedDate ? (
              <div className="mt-3 rounded-lg bg-gray-50 border border-gray-100 p-3 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Current in / out for {formatProgramDateLabel(selectedDate.date)}
                </p>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-gray-500">Morning In</p>
                    <p className="font-medium text-gray-900">
                      {formatAttendanceTime(selectedDate.morningIn || selectedDate.signInTime) || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Morning Out</p>
                    <p className="font-medium text-gray-900">
                      {formatAttendanceTime(selectedDate.morningOut) || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Afternoon In</p>
                    <p className="font-medium text-gray-900">
                      {formatAttendanceTime(selectedDate.afternoonIn) || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Afternoon Out</p>
                    <p className="font-medium text-gray-900">
                      {formatAttendanceTime(
                        selectedDate.afternoonOut ||
                          (selectedDate.morningOut ? null : selectedDate.signOutTime),
                      ) || '—'}
                    </p>
                  </div>
                </div>
              </div>
            ) : correctionDay ? (
              <p className="mt-2 text-xs text-amber-700 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                No punches on file yet for this day. You can still request corrected
                times — staff will review for{' '}
                <strong>{formatProgramDateLabel(correctionDay)}</strong>.
              </p>
            ) : null}
          </div>
        ) : null}

        {requestType === 'time_correction' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Corrected sign in <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={correctedSignInTime}
                onChange={(e) => setCorrectedSignInTime(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              {correctionDay ? (
                <p className="text-xs text-gray-500 mt-1">
                  Day: {formatProgramDateLabel(correctionDay)} ({correctionDay})
                </p>
              ) : null}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Corrected sign out <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={correctedSignOutTime}
                onChange={(e) => setCorrectedSignOutTime(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              {correctionDay ? (
                <p className="text-xs text-gray-500 mt-1">
                  Day: {formatProgramDateLabel(correctionDay)} ({correctionDay})
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        {showSpecialDate ? (
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Day affected <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Select the specific program day this circumstance applies to.
            </p>
            <select
              value={specialDate}
              onChange={(e) => setSpecialDate(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">Select a program day…</option>
              {programDateOptions.map((date) => (
                <option key={date} value={date}>
                  {formatProgramDateLabel(date)} ({date})
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {requestType === 'absence' ? (
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Why will you be absent? <span className="text-red-500">*</span>
            </label>
            <textarea
              value={absenceReason}
              onChange={(e) => setAbsenceReason(e.target.value)}
              required
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="Share the reason and any details staff should know."
            />
          </div>
        ) : null}

        {requestType === 'time_correction' ? (
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Correction reason / detail
            </label>
            <textarea
              value={correctionDetail}
              onChange={(e) => setCorrectionDetail(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="Explain what was wrong and why the corrected times are accurate."
            />
          </div>
        ) : null}

        {requestType === 'special' ? (
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Special circumstance <span className="text-red-500">*</span>
            </label>
            <textarea
              value={specialCircumstance}
              onChange={(e) => setSpecialCircumstance(e.target.value)}
              required
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="Describe the situation and any dates affected."
            />
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100">
          <button
            type="submit"
            disabled={submitting || !canSubmit}
            className="px-5 py-2.5 rounded-lg bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 disabled:opacity-50"
          >
            {submitting ? 'Submitting…' : 'Submit request'}
          </button>
          <Link
            href={returnHref}
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
