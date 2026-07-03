"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { BobStudent } from "@/platform/api/bob/students";
import type { BobDeliverable } from "@/platform/api/bob/milestones";
import { submitBobOneStop, type BobOneStopPayload } from "@/platform/api/bob/submit";
import { useAuth } from "@/context/AuthContext";
import { useBobMe } from "@/platform/query/hooks/useBobMe";
import { useBobStudentsList } from "@/platform/query/hooks/useBobStudents";
import {
  BOB_MILESTONES_ORG_ID,
  useBobMilestonesList,
} from "@/platform/query/hooks/useBobMilestones";
import { useBobProjectTeamsList } from "@/platform/query/hooks/useBobProjectTeams";
import { useBobAccess } from "@/platform/rbac/useBobAccess";
import {
  filterDeliverablesForStudent,
  projectTeamsForStudent,
} from "@/features/bob/milestones/deliverableStudentScope";
import { studentLabel } from "@/features/bob/submit/StudentMultiSelect";
import { readFileAsBase64 } from "@/features/bob/submit/fileUtils";
import { PROGRESS_DELIVERABLE_STATUS_OPTIONS } from "@/features/bob/progress/progressConstants";

function deliverableOptionLabel(d: BobDeliverable) {
  const num = d.deliverableNumber ? `${d.deliverableNumber}: ` : "";
  return `${num}${d.deliverableName}`;
}

export function ProgressUpdatePage() {
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

  const [form, setForm] = useState<Record<string, string>>({});
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    effectiveStudentId || "",
  );
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

  const milestonesQuery = useBobMilestonesList({ orgId: BOB_MILESTONES_ORG_ID });
  const teamsQuery = useBobProjectTeamsList({});

  const deliverables = useMemo(() => {
    if (!selectedStudent) return [];
    return filterDeliverablesForStudent(
      milestonesQuery.data?.data ?? [],
      selectedStudent,
      teamsQuery.data?.data ?? [],
    );
  }, [selectedStudent, milestonesQuery.data?.data, teamsQuery.data?.data]);

  const projectTeams = useMemo(() => {
    if (!selectedStudent) return [];
    return projectTeamsForStudent(selectedStudent, teamsQuery.data?.data ?? []);
  }, [selectedStudent, teamsQuery.data?.data]);

  useEffect(() => {
    if (!effectiveStudentId || selectedStudentId) return;
    setSelectedStudentId(effectiveStudentId);
  }, [effectiveStudentId, selectedStudentId]);

  useEffect(() => {
    if (projectTeams.length === 1 && !form.projectTeamId) {
      const team = projectTeams[0];
      setForm((f) => ({
        ...f,
        projectTeamId: team.id,
        teamName: team.name,
      }));
    }
  }, [projectTeams, form.projectTeamId]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        studentDropdownRef.current &&
        !studentDropdownRef.current.contains(e.target as Node)
      ) {
        setStudentDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredStudents = useMemo(() => {
    if (!studentSearch.trim()) return students.slice(0, 50);
    const q = studentSearch.trim().toLowerCase();
    return students
      .filter(
        (s) =>
          (s.firstName || "").toLowerCase().includes(q) ||
          (s.lastName || "").toLowerCase().includes(q) ||
          (s.email || "").toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q),
      )
      .slice(0, 50);
  }, [students, studentSearch]);

  const submitterName = user?.name?.trim() || user?.email?.trim() || "You";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const studentId = isStudent ? linkedStudentId : selectedStudentId;
    if (!studentId) {
      setError("Please select a student.");
      return;
    }
    if (!form.projectTeamId || !form.teamName) {
      setError("Please select your project team.");
      return;
    }
    if (!form.deliverableId) {
      setError("Please select a deliverable.");
      return;
    }
    if (!form.deliverableStatus) {
      setError("Please select a deliverable status.");
      return;
    }
    if (!form.reflection?.trim()) {
      setError("Please add a reflection.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const deliverable = deliverables.find((d) => d.id === form.deliverableId);
      const payload: BobOneStopPayload = {
        studentId,
        student: selectedStudent ? studentLabel(selectedStudent) : "",
        teamName: form.teamName,
        projectTeamId: form.projectTeamId,
        deliverableId: form.deliverableId,
        deliverableLabel: deliverable
          ? deliverableOptionLabel(deliverable)
          : form.deliverableLabel,
        deliverableStatus: form.deliverableStatus,
        proofLinks: form.proofLinks,
        reflection: form.reflection,
        nextWeekPlan: form.nextWeekPlan,
        description: form.reflection,
      };
      if (pendingFiles.length > 0) {
        payload.attachments = await Promise.all(
          pendingFiles.map(async (file) => ({
            filename: file.name,
            mimeType: file.type || "application/octet-stream",
            content: await readFileAsBase64(file),
          })),
        );
      }
      await submitBobOneStop("progress_update", payload);
      setSubmitted(true);
      setForm({});
      setPendingFiles([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submit failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-4">
            ✓
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Submitted</h1>
          <p className="text-gray-600 mb-6">
            Your weekly progress update has been received.
          </p>
          <div className="flex flex-col gap-2 items-center">
            <Link
              href="/app/bob/deliverables"
              className="text-orange-600 hover:underline font-medium"
            >
              Back to deliverables
            </Link>
            <button
              type="button"
              onClick={() => setSubmitted(false)}
              className="text-gray-600 hover:underline font-medium"
            >
              Submit another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6">
        <Link
          href="/app/bob/deliverables"
          className="text-sm text-orange-600 hover:underline"
        >
          ← Deliverables
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">
          Weekly Progress Update
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Share what your team worked on this week, upload proof, and plan for
          next week.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4"
      >
        {error ? (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        ) : null}

        {!isStudent ? (
          <div className="relative" ref={studentDropdownRef}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Student
            </label>
            <input
              type="text"
              value={
                studentDropdownOpen
                  ? studentSearch
                  : selectedStudent
                    ? studentLabel(selectedStudent)
                    : ""
              }
              onChange={(e) => {
                setStudentSearch(e.target.value);
                setStudentDropdownOpen(true);
              }}
              onFocus={() => setStudentDropdownOpen(true)}
              placeholder="Search students…"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              required={!selectedStudentId}
            />
            {studentDropdownOpen ? (
              <ul className="absolute z-10 mt-1 w-full max-h-48 overflow-auto bg-white border border-gray-200 rounded-lg shadow-lg py-1">
                {filteredStudents.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStudentId(s.id);
                        setStudentSearch("");
                        setStudentDropdownOpen(false);
                        setForm((f) => ({
                          ...f,
                          deliverableId: "",
                          teamName: "",
                        }));
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
            <div className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-800">
              {me?.linkedStudent?.name || "Your profile"}
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Submitted by
          </label>
          <div className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-700">
            {submitterName}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Project team
          </label>
          {projectTeams.length > 0 ? (
            <select
              value={form.projectTeamId ?? ""}
              onChange={(e) => {
                const id = e.target.value;
                const team = projectTeams.find((t) => t.id === id);
                setForm((f) => ({
                  ...f,
                  projectTeamId: id,
                  teamName: team?.name || "",
                  deliverableId: "",
                  deliverableLabel: "",
                }));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              required
            >
              <option value="">Select project team</option>
              {projectTeams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          ) : (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              No project team found for this student.{" "}
              <Link
                href="https://airtable.com/appKnMenSN4RSG1ZV/paglydsT6YY4EKMiO/form"
                className="font-medium text-orange-700 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Submit your project team first
              </Link>
              , then return here.
            </div>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Weekly progress is submitted individually; deliverables are reviewed at the team level.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Deliverable worked on
          </label>
          <select
            value={form.deliverableId ?? ""}
            onChange={(e) => {
              const id = e.target.value;
              const d = deliverables.find((x) => x.id === id);
              setForm((f) => ({
                ...f,
                deliverableId: id,
                deliverableLabel: d ? deliverableOptionLabel(d) : "",
              }));
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            required
            disabled={!selectedStudent || milestonesQuery.isLoading}
          >
            <option value="">
              {milestonesQuery.isLoading
                ? "Loading deliverables…"
                : deliverables.length
                  ? "Select deliverable"
                  : "No deliverables linked to this student"}
            </option>
            {deliverables.map((d) => (
              <option key={d.id} value={d.id}>
                {deliverableOptionLabel(d)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Deliverable status
          </label>
          <select
            value={form.deliverableStatus ?? ""}
            onChange={(e) =>
              setForm((f) => ({ ...f, deliverableStatus: e.target.value }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            required
          >
            <option value="">Select status</option>
            {PROGRESS_DELIVERABLE_STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Proof links
          </label>
          <textarea
            value={form.proofLinks ?? ""}
            onChange={(e) =>
              setForm((f) => ({ ...f, proofLinks: e.target.value }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            rows={2}
            placeholder="Paste links to docs, demos, or photos (one per line)"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Photos & documents
          </label>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx"
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              if (files.length) setPendingFiles((prev) => [...prev, ...files]);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
          >
            Add files
          </button>
          {pendingFiles.length > 0 ? (
            <ul className="mt-2 space-y-1">
              {pendingFiles.map((file, idx) => (
                <li
                  key={`${file.name}-${idx}`}
                  className="flex items-center justify-between text-sm text-gray-600"
                >
                  <span className="truncate">{file.name}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setPendingFiles((prev) => prev.filter((_, i) => i !== idx))
                    }
                    className="text-gray-400 hover:text-gray-600 ml-2"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-xs text-gray-500">Max 2MB per file.</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Reflection & learnings
          </label>
          <textarea
            value={form.reflection ?? ""}
            onChange={(e) =>
              setForm((f) => ({ ...f, reflection: e.target.value }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            rows={4}
            required
            placeholder="What did you learn? What feedback do you have?"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Focus for next week
          </label>
          <textarea
            value={form.nextWeekPlan ?? ""}
            onChange={(e) =>
              setForm((f) => ({ ...f, nextWeekPlan: e.target.value }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            rows={3}
            placeholder="What will you work on next week?"
          />
        </div>

        <div className="pt-2 flex gap-3">
          <button
            type="submit"
            disabled={submitting || (isStudent && !linkedStudentId)}
            className="flex-1 px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 text-sm font-medium"
          >
            {submitting ? "Submitting…" : "Submit progress update"}
          </button>
          <Link
            href="/app/bob/deliverables"
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium text-center"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
