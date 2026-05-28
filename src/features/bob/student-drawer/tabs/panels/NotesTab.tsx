"use client";

import { useStudentDrawerContext } from "../../context/StudentDrawerContext";
import { CoachNoteCard } from "../../widgets/CoachNoteCard";
import { extractCoachNotes } from "../../lib/profileSignals";
import { useStudentSubmissions } from "../../hooks/useStudentTabQueries";
import { SUBMISSION_TYPE_LABELS } from "@/features/bob/submissions/display";

export function NotesTab() {
  const { student, tab } = useStudentDrawerContext();
  const { data: submissions = [] } = useStudentSubmissions(
    student?.id ?? null,
    tab,
  );

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

  const all = [...coachNotes, ...submissionNotes];

  return (
    <div className="p-5 space-y-4">
      <p className="text-sm text-gray-600">
        Coach notes from Airtable and narrative fields from submissions — your
        operational paper trail.
      </p>

      {all.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
          <p className="text-sm text-gray-600">No notes on file yet.</p>
          <p className="text-xs text-gray-500 mt-1">
            Add coach notes in Airtable or log a progress update.
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
