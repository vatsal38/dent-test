import type { BobRosterSchemaField } from "@/platform/api/bob/shared";
import { intakeDataTableColumns } from "@/lib/bobIntakeColumns";

const PREFERRED = [
  /^school$/i,
  /^grade$/i,
  /student\s*email|^email$/i,
  /^city$/i,
];

/** At most 3 supplemental columns beside pipeline / transfer / programs. */
export function curatedInboxListColumns(
  schema: BobRosterSchemaField[] | null | undefined,
  max = 3,
): BobRosterSchemaField[] {
  const all = intakeDataTableColumns(schema);
  const picked: BobRosterSchemaField[] = [];
  const seen = new Set<string>();

  for (const pattern of PREFERRED) {
    if (picked.length >= max) break;
    const f = all.find((c) => !seen.has(c.name) && pattern.test(c.name));
    if (f) {
      picked.push(f);
      seen.add(f.name);
    }
  }

  for (const f of all) {
    if (picked.length >= max) break;
    if (!seen.has(f.name)) {
      picked.push(f);
      seen.add(f.name);
    }
  }

  return picked;
}
