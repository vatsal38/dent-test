"use client";

import { TextWithLinks } from "@/components/TextWithLinks";
import type { CoachNote } from "../types";

export function CoachNoteCard({ note }: { note: CoachNote }) {
  return (
    <article className="rounded-xl border border-amber-200/80 bg-amber-50/60 p-3.5">
      <div className="flex items-center justify-between gap-2 mb-2">
        <p className="text-xs font-semibold text-amber-900">
          {note.author || "Coach note"}
        </p>
        {note.at ? (
          <time className="text-[11px] text-gray-500">{note.at}</time>
        ) : null}
      </div>
      <div className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">
        <TextWithLinks text={note.body} />
      </div>
    </article>
  );
}
