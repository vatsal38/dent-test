"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { parseApiError } from "@/platform/api/errors";
import { addBobStudentCoachNote } from "@/platform/api/bob/students";
import { useStudentDrawerContext } from "../../context/StudentDrawerContext";
import { CoachNoteCard } from "../../widgets/CoachNoteCard";
import { extractCoachNotes } from "../../lib/profileSignals";
import { useStudentSubmissions } from "../../hooks/useStudentTabQueries";
import { SUBMISSION_TYPE_LABELS } from "@/features/bob/submissions/display";
import { useBobAccess } from "@/platform/rbac/useBobAccess";

export function NotesTab() {
  const { student, tab, refetch } = useStudentDrawerContext();
  const { can } = useBobAccess();
  const { user } = useAuth();
  const { data: submissions = [] } = useStudentSubmissions(
    student?.id ?? null,
    tab,
  );
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  if (!student) return null;

  const coachNotes = extractCoachNotes(student);
  const submissionNotes = submissions
    .filter((s) => s.notes || s.description || s.concernSummary)
    .map((s) => ({
      id: s.id,
      author: SUBMISSION_TYPE_LABELS[s.type],
      body: s.notes || s.description || s.concernSummary || "",
      at: new Date(s.createdAt).toLocaleDateString(),
    }));

  const canViewStaffNotes = can("notes.viewStaff");
  const all = canViewStaffNotes
    ? [...coachNotes, ...submissionNotes]
    : submissionNotes.filter((s) => s.author !== "Incident");
  const authorLabel = user?.name || user?.email || "Coach";
  const canAddNote = can("roster.edit") && canViewStaffNotes;

  async function handleAddNote() {
    const body = draft.trim();
    if (!body || !student) return;
    setSaving(true);
    setSaveError(null);
    try {
      await addBobStudentCoachNote(student.id, body, authorLabel);
      setDraft("");
      refetch();
    } catch (err) {
      setSaveError(parseApiError(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-5 space-y-4">
      <p className="text-sm text-gray-600">
        Add coach notes directly here or review narrative fields from
        submissions.
      </p>

      {canAddNote ? (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
          <label className="block text-sm font-medium text-gray-800">
            Add coach note
          </label>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={4}
            placeholder="Log context for the team — saved to coach notes and synced to Airtable when linked."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
          />
          {saveError ? (
            <p className="text-sm text-red-700">{saveError}</p>
          ) : null}
          <button
            type="button"
            onClick={() => void handleAddNote()}
            disabled={saving || !draft.trim()}
            className="px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save note"}
          </button>
        </div>
      ) : null}

      {all.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
          <p className="text-sm text-gray-600">No notes on file yet.</p>
          <p className="text-xs text-gray-500 mt-1">
            Add a coach note above or log a progress update.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {all.map((n) => (
            <CoachNoteCard key={n.id} note={n} />
          ))}
        </div>
      )}
    </div>
  );
}
