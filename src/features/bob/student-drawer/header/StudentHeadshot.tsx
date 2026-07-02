"use client";

import { useMemo, useState } from "react";
import type { BobStudent } from "@/platform/api/bob/students";
import { resolveStudentHeadshotUrl } from "@/lib/bobStudentHeadshot";
import { useBobRosterSchema } from "@/platform/query/hooks/useBobStudents";
import { initialsOf } from "@/features/bob/roster/recordDisplay";

export function StudentHeadshot({
  student,
  name,
}: {
  student: BobStudent;
  name: string;
}) {
  const { data: schemaRes } = useBobRosterSchema();
  const [expanded, setExpanded] = useState(false);
  const [broken, setBroken] = useState(false);

  const photoUrl = useMemo(() => {
    if (broken) return "";
    return resolveStudentHeadshotUrl(student, schemaRes?.fields ?? null);
  }, [broken, schemaRes?.fields, student]);

  const initials = initialsOf(name);

  return (
    <>
      <button
        type="button"
        onClick={() => photoUrl && setExpanded(true)}
        disabled={!photoUrl}
        className={`shrink-0 h-12 w-12 rounded-xl overflow-hidden shadow-sm ${
          photoUrl
            ? "ring-2 ring-orange-100 hover:ring-orange-300 transition-shadow cursor-zoom-in"
            : "bg-linear-to-br from-orange-500 to-orange-600 text-white flex items-center justify-center text-sm font-bold"
        }`}
        aria-label={photoUrl ? "View headshot" : undefined}
      >
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl}
            alt=""
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
            onError={() => setBroken(true)}
          />
        ) : (
          <span aria-hidden>{initials}</span>
        )}
      </button>

      {expanded && photoUrl ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6"
          role="dialog"
          aria-modal="true"
          aria-label={`${name} headshot`}
          onClick={() => setExpanded(false)}
        >
          <button
            type="button"
            className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 text-white text-xl hover:bg-white/20"
            onClick={() => setExpanded(false)}
            aria-label="Close headshot"
          >
            ✕
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photoUrl}
            alt={name}
            className="max-h-[90vh] max-w-[min(100%,28rem)] w-auto h-auto rounded-xl shadow-2xl object-contain"
            referrerPolicy="no-referrer"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ) : null}
    </>
  );
}
