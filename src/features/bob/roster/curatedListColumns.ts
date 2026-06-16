import type { BobRosterSchemaField } from "@/platform/api/bob/shared";
import { importantRosterTableColumns } from "@/lib/bobIntakeColumns";

const PREFERRED = [
  /^school$/i,
  /^grade$/i,
  /^track$/i,
  /^coach$/i,
  /^pod$/i,
  /yw\s*status|youth\s*works/i,
];

/** Roster list: headshot + up to 4 readable columns (not full Airtable). */
export function curatedRosterListColumns(
  schema: BobRosterSchemaField[] | null | undefined,
): { headshot: BobRosterSchemaField | null; columns: BobRosterSchemaField[] } {
  const all = importantRosterTableColumns(schema);
  const headshot =
    all.find((f) => f.type === "multipleAttachments" && /headshot/i.test(f.name)) ??
    all.find((f) => /headshot|student\s*photo|profile\s*photo|^photo$/i.test(f.name)) ??
    null;

  const withoutHeadshot = all.filter((f) => f !== headshot);
  const picked: BobRosterSchemaField[] = [];
  const seen = new Set<string>();

  for (const pattern of PREFERRED) {
    if (picked.length >= 4) break;
    const f = withoutHeadshot.find(
      (c) => !seen.has(c.name) && pattern.test(c.name),
    );
    if (f) {
      picked.push(f);
      seen.add(f.name);
    }
  }

  for (const f of withoutHeadshot) {
    if (picked.length >= 4) break;
    if (!seen.has(f.name)) {
      picked.push(f);
      seen.add(f.name);
    }
  }

  return { headshot, columns: picked };
}
