"use client";

import { useMemo, useState } from "react";
import type { BobStudent } from "@/platform/api/bob/students";
import { resolveStudentHeadshotUrl } from "@/lib/bobStudentHeadshot";
import { useBobRosterSchema } from "@/platform/query/hooks/useBobStudents";
import { initialsOf } from "@/features/bob/roster/recordDisplay";
import { HeadshotLightbox } from "@/features/bob/roster/HeadshotLightbox";

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
            className="h-full w-full object-cover object-top"
            referrerPolicy="no-referrer"
            onError={() => setBroken(true)}
          />
        ) : (
          <span aria-hidden>{initials}</span>
        )}
      </button>
      <HeadshotLightbox
        open={expanded}
        src={photoUrl}
        alt={name}
        onClose={() => setExpanded(false)}
      />
    </>
  );
}
