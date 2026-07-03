"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { BobStudent } from "@/platform/api/bob/students";
import { submitBobOneStop, type BobOneStopPayload } from "@/platform/api/bob/submit";
import { useAuth } from "@/context/AuthContext";
import { useBobMe } from "@/platform/query/hooks/useBobMe";
import { useBobStudentsList } from "@/platform/query/hooks/useBobStudents";
import { useBobStaffList } from "@/platform/query/hooks/useBobStaff";
import { useBobAccess } from "@/platform/rbac/useBobAccess";
import { studentLabel } from "@/features/bob/submit/StudentMultiSelect";
import { staffDisplayName } from "@/features/bob/pods/staffDisplay";
import { readFileAsBase64 } from "@/features/bob/submit/fileUtils";
import { PageHeader } from "@/design-system/patterns/PageHeader";

type TestimonyFormat = "written" | "video_link";
type TestimonySubject = "student" | "staff";

export function DentTestimonyPage() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { data: me } = useBobMe();
  const access = useBobAccess();
  const isStudent = access.role === "student";
  const prefilledStudentId = searchParams?.get("studentId") || "";

  const linkedStudentId = me?.linkedStudent?.id ?? null;
  const effectiveStudentId = isStudent
    ? linkedStudentId
    : prefilledStudentId || null;

  const [format, setFormat] = useState<TestimonyFormat>("written");
  const [subjectType, setSubjectType] = useState<TestimonySubject>(
    isStudent ? "student" : "student",
  );
  const [form, setForm] = useState<Record<string, string>>({});
  const [consent, setConsent] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    effectiveStudentId || "",
  );
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [studentDropdownOpen, setStudentDropdownOpen] = useState(false);
  const studentDropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const studentsQuery = useBobStudentsList(
    { limit: 500, includeStats: false },
    { enabled: !isStudent },
  );
  const students = studentsQuery.data?.students ?? [];
  const { data: staffData } = useBobStaffList();
  const staffList = staffData?.staff ?? [];

  const selectedStaff = useMemo(
    () => staffList.find((s) => s.id === selectedStaffId) ?? null,
    [staffList, selectedStaffId],
  );

  const selectedStudent = useMemo(() => {
    if (isStudent && me?.linkedStudent) {
      return {
        id: me.linkedStudent.id,
        firstName: me.linkedStudent.name?.split(" ")[0] ?? "",
        lastName: me.linkedStudent.name?.split(" ").slice(1).join(" ") ?? "",
      } as BobStudent;
    }
    return students.find((s) => s.id === selectedStudentId) ?? null;
  }, [isStudent, me?.linkedStudent, students, selectedStudentId]);

  const filteredStudents = useMemo(() => {
    if (!studentSearch.trim()) return students.slice(0, 50);
    const q = studentSearch.trim().toLowerCase();
    return students
      .filter(
        (s) =>
          (s.firstName || "").toLowerCase().includes(q) ||
          (s.lastName || "").toLowerCase().includes(q) ||
          (s.email || "").toLowerCase().includes(q),
      )
      .slice(0, 50);
  }, [students, studentSearch]);

  const submitterName = user?.name?.trim() || user?.email?.trim() || "You";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (subjectType === "staff") {
      if (!selectedStaffId) {
        setError("Please select a staff member.");
        return;
      }
    } else {
      const studentId = isStudent ? linkedStudentId : selectedStudentId;
      if (!studentId) {
        setError("Please select a student.");
        return;
      }
    }
    if (!consent) {
      setError("Please confirm consent for public use.");
      return;
    }
    if (format === "written" && !form.reflection?.trim()) {
      setError("Please write your testimony.");
      return;
    }
    if (format === "video_link" && !form.proofLinks?.trim()) {
      setError("Please add a video link.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const studentId = isStudent ? linkedStudentId : selectedStudentId;
      const payload: BobOneStopPayload = {
        testimonySubject: subjectType,
        testimonyFormat: format,
        publicConsent: consent,
        reflection: format === "written" ? form.reflection : undefined,
        description: format === "written" ? form.reflection : form.description,
        proofLinks: format === "video_link" ? form.proofLinks : undefined,
        notes: form.notes,
      };
      if (subjectType === "staff") {
        payload.staffMemberId = selectedStaffId;
        payload.staffMemberName = selectedStaff?.name || selectedStaff?.email || "";
      } else {
        payload.studentId = studentId || "";
        payload.student = selectedStudent ? studentLabel(selectedStudent) : "";
      }
      if (pendingFiles.length > 0) {
        payload.attachments = await Promise.all(
          pendingFiles.map(async (file) => ({
            filename: file.name,
            mimeType: file.type || "application/octet-stream",
            content: await readFileAsBase64(file),
          })),
        );
      }
      await submitBobOneStop("dent_testimony", payload);
      setSubmitted(true);
      setForm({});
      setPendingFiles([]);
      setConsent(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submit failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto py-12 px-6 text-center">
        <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-4">
          ✓
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Thank you</h1>
        <p className="text-gray-600 mb-6">
          Your Dent testimony has been submitted to your program team.
        </p>
        <Link href="/app/bob/home" className="text-orange-600 hover:underline font-medium">
          Back to home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <PageHeader
        eyebrow="Bet on Baltimore"
        title="Dent Testimony"
        description="Share a student or staff story in writing or via video link. Your program team will review it."
      />

      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4"
      >
        {error ? (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        ) : null}

        {!isStudent ? (
          <div>
            <span className="block text-sm font-medium text-gray-700 mb-2">
              Who is this testimony for?
            </span>
            <div className="flex flex-wrap gap-3">
              {(
                [
                  { id: "student", label: "Student" },
                  { id: "staff", label: "Staff member" },
                ] as const
              ).map((opt) => (
                <label
                  key={opt.id}
                  className="inline-flex items-center gap-2 text-sm text-gray-700"
                >
                  <input
                    type="radio"
                    name="testimonySubject"
                    checked={subjectType === opt.id}
                    onChange={() => {
                      setSubjectType(opt.id);
                      setError(null);
                    }}
                    className="text-orange-500 focus:ring-orange-500"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>
        ) : null}

        {subjectType === "staff" && !isStudent ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Staff member
            </label>
            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
              required
            >
              <option value="">Select staff member</option>
              {[...staffList]
                .sort((a, b) =>
                  staffDisplayName(a).localeCompare(staffDisplayName(b)),
                )
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {staffDisplayName(s)}
                  </option>
                ))}
            </select>
          </div>
        ) : !isStudent ? (
          <div ref={studentDropdownRef} className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Student
            </label>
            <input
              type="text"
              value={
                selectedStudent && !studentDropdownOpen
                  ? studentLabel(selectedStudent)
                  : studentSearch
              }
              onChange={(e) => {
                setStudentSearch(e.target.value);
                setStudentDropdownOpen(true);
                setSelectedStudentId("");
              }}
              onFocus={() => setStudentDropdownOpen(true)}
              placeholder="Search students…"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
            />
            {studentDropdownOpen && filteredStudents.length > 0 ? (
              <ul className="absolute z-10 mt-1 w-full max-h-48 overflow-auto bg-white border border-gray-200 rounded-lg shadow-lg py-1">
                {filteredStudents.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStudentId(s.id);
                        setStudentSearch("");
                        setStudentDropdownOpen(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-orange-50"
                    >
                      {studentLabel(s)}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Student
            </label>
            <div className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-700">
              {selectedStudent ? studentLabel(selectedStudent) : submitterName}
            </div>
          </div>
        )}

        <div>
          <span className="block text-sm font-medium text-gray-700 mb-2">
            Format
          </span>
          <div className="flex flex-wrap gap-3">
            {(
              [
                { id: "written", label: "Written story" },
                { id: "video_link", label: "Video link" },
              ] as const
            ).map((opt) => (
              <label
                key={opt.id}
                className="inline-flex items-center gap-2 text-sm text-gray-700"
              >
                <input
                  type="radio"
                  name="testimonyFormat"
                  checked={format === opt.id}
                  onChange={() => setFormat(opt.id)}
                  className="text-orange-500 focus:ring-orange-500"
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        {format === "written" ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your testimony
            </label>
            <textarea
              value={form.reflection ?? ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, reflection: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
              rows={8}
              required
              placeholder="What has Dent / Bet on Baltimore meant to you?"
            />
          </div>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Video link
              </label>
              <input
                type="url"
                value={form.proofLinks ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, proofLinks: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
                placeholder="YouTube, Google Drive, Loom, etc."
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Upload your video to Drive or Loom first, then paste the share link here.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Short caption (optional)
              </label>
              <input
                type="text"
                value={form.description ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
                placeholder="One-line summary of your story"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Small video file (optional)
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*,image/*"
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  if (files.length) setPendingFiles(files.slice(0, 1));
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
              >
                Attach clip (max 2MB)
              </button>
              {pendingFiles[0] ? (
                <p className="mt-1 text-xs text-gray-600">{pendingFiles[0].name}</p>
              ) : null}
            </div>
          </>
        )}

        <label className="flex items-start gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
            required
          />
          <span>
            I consent to Dent Education using this testimony publicly (website,
            social media, fundraising, and program materials).
          </span>
        </label>

        <div className="pt-2 flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 text-sm font-medium"
          >
            {submitting ? "Submitting…" : "Submit testimony"}
          </button>
          <Link
            href="/app/bob/home"
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium text-center"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
