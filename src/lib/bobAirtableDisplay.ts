/** Shared helpers for showing Airtable field values (especially linked records). */

export function isAirtableRecordId(s: string): boolean {
  return /^rec[a-zA-Z0-9]{10,}$/.test(String(s || "").trim());
}

/** Remove raw Airtable record ids from free text (never show rec… in UI). */
export function stripAirtableRecordIdsFromText(text: string): string {
  return String(text || "")
    .replace(/rec[a-zA-Z0-9]{10,}/g, "")
    .replace(/\s{2,}/g, " ")
    .replace(/(^[,\s]+|[,\s]+$)/g, "")
    .trim();
}

export function normalizeAirtableValue(v: unknown): unknown {
  if (typeof v !== "string") return v;
  const t = v.trim();
  if (!t) return v;
  if (
    (t.startsWith("[") && t.endsWith("]")) ||
    (t.startsWith("{") && t.endsWith("}"))
  ) {
    try {
      return JSON.parse(t);
    } catch {
      return v;
    }
  }
  return v;
}

/** Best-effort human label from a linked-record array item (expanded object or plain text). */
export function displayTextFromValueItem(x: unknown): string | null {
  if (x == null) return null;
  if (typeof x === "string") {
    const t = x.trim();
    if (!t || isAirtableRecordId(t)) return null;
    return t;
  }
  if (typeof x === "number" || typeof x === "boolean") {
    return String(x);
  }
  if (typeof x === "object" && !Array.isArray(x)) {
    const o = x as Record<string, unknown>;
    for (const key of ["name", "label", "title", "value", "text"]) {
      const v = o[key];
      if (typeof v === "string") {
        const t = v.trim();
        if (t && !isAirtableRecordId(t)) return t;
      }
    }
    const fields = o.fields;
    if (fields && typeof fields === "object" && !Array.isArray(fields)) {
      for (const v of Object.values(fields as Record<string, unknown>)) {
        const text = displayTextFromValueItem(v);
        if (text) return text;
      }
    }
  }
  return null;
}

export type AirtableAttachmentItem = {
  id?: string;
  url: string;
  filename?: string;
  thumbUrl?: string;
};

function attachmentUrlFromObject(o: Record<string, unknown>): string | null {
  if (typeof o.url === "string" && o.url.trim()) return o.url.trim();
  const thumbs = o.thumbnails;
  if (thumbs && typeof thumbs === "object" && !Array.isArray(thumbs)) {
    const t = thumbs as Record<string, { url?: string } | undefined>;
    for (const key of ["small", "large", "full"]) {
      const u = t[key]?.url;
      if (typeof u === "string" && u.trim()) return u.trim();
    }
  }
  return null;
}

/** Airtable `multipleAttachments` values (e.g. Headshot with several images). */
export function extractAirtableAttachments(value: unknown): AirtableAttachmentItem[] {
  const normalized = normalizeAirtableValue(value);
  if (normalized == null) return [];

  const rawList = Array.isArray(normalized)
    ? normalized
    : typeof normalized === "object"
      ? [normalized]
      : [];

  const out: AirtableAttachmentItem[] = [];
  for (const item of rawList) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const o = item as Record<string, unknown>;
    const url = attachmentUrlFromObject(o);
    if (!url) continue;
    const thumbs = o.thumbnails as Record<string, { url?: string }> | undefined;
    const thumbUrl =
      thumbs?.small?.url?.trim() ||
      thumbs?.large?.url?.trim() ||
      url;
    out.push({
      id: typeof o.id === "string" ? o.id : undefined,
      url,
      filename:
        typeof o.filename === "string" ? o.filename : undefined,
      thumbUrl,
    });
  }
  return out;
}

export function isAttachmentLikeField(
  fieldName: string,
  fieldType?: string | null,
): boolean {
  if (fieldType === "multipleAttachments") return true;
  return /headshot|head\s*shot|profile\s*photo|student\s*photo|^photo$/i.test(
    fieldName,
  );
}

export function extractAirtableRecordIds(value: unknown): string[] {
  const v = normalizeAirtableValue(value);
  if (v == null) return [];
  if (Array.isArray(v)) {
    const ids: string[] = [];
    for (const x of v) {
      if (x == null) continue;
      if (typeof x === "string" && isAirtableRecordId(x)) {
        ids.push(x.trim());
        continue;
      }
      if (typeof x === "object" && !Array.isArray(x)) {
        const id = (x as { id?: string }).id;
        if (id && isAirtableRecordId(id)) ids.push(String(id).trim());
      }
    }
    return Array.from(new Set(ids));
  }
  if (typeof v === "string" && isAirtableRecordId(v)) return [v.trim()];
  if (typeof v === "object" && v !== null) {
    const id = (v as { id?: string }).id;
    if (id && isAirtableRecordId(id)) return [String(id).trim()];
  }
  return [];
}

/**
 * Human-readable cell text. When `labelsByRecordId` is provided, linked record ids
 * are replaced with resolved primary-field labels (e.g. school name).
 * Raw `rec…` ids are never returned.
 */
export function cellDisplayValue(
  v: unknown,
  labelsByRecordId?: Record<string, string>,
): string {
  const normalized = normalizeAirtableValue(v);
  if (normalized == null) return "—";

  if (Array.isArray(normalized)) {
    const attachments = extractAirtableAttachments(normalized);
    if (attachments.length > 0) {
      return attachments.length === 1 ? "1 photo" : `${attachments.length} photos`;
    }

    const displayParts: string[] = [];
    const unresolvedIds: string[] = [];

    for (const item of normalized) {
      const text = displayTextFromValueItem(item);
      if (text) {
        displayParts.push(text);
        continue;
      }
      const id =
        typeof item === "string"
          ? item.trim()
          : typeof item === "object" &&
              item !== null &&
              typeof (item as { id?: string }).id === "string"
            ? String((item as { id: string }).id).trim()
            : "";
      if (id && isAirtableRecordId(id)) unresolvedIds.push(id);
    }

    if (displayParts.length > 0) {
      const joined = displayParts.slice(0, 5).join(", ");
      return displayParts.length > 5
        ? `${joined} +${displayParts.length - 5}`
        : joined;
    }

    if (unresolvedIds.length > 0 && labelsByRecordId) {
      const names = unresolvedIds
        .map((id) => labelsByRecordId[id])
        .filter((n) => n && String(n).trim());
      if (names.length > 0) {
        return names.join(", ");
      }
    }

    if (unresolvedIds.length > 0) {
      return unresolvedIds.length === 1 ? "…" : `${unresolvedIds.length} linked`;
    }
    return "—";
  }

  if (typeof normalized === "object") {
    const text = displayTextFromValueItem(normalized);
    if (text) return text;
    const ids = extractAirtableRecordIds(normalized);
    if (ids.length > 0 && labelsByRecordId) {
      const names = ids
        .map((id) => labelsByRecordId[id])
        .filter((n) => n && String(n).trim());
      if (names.length > 0) return names.join(", ");
    }
    return ids.length > 0 ? "…" : "—";
  }

  const s = String(normalized).trim();
  if (!s) return "—";

  if (isAirtableRecordId(s)) {
    const label = labelsByRecordId?.[s];
    return label && label.trim() ? label.trim() : "…";
  }

  const scrubbed = stripAirtableRecordIdsFromText(s);
  if (!scrubbed) {
    if (/rec[a-zA-Z0-9]{10,}/.test(s)) return "…";
    return "—";
  }

  if (/^\d{4}-\d{2}-\d{2}T/.test(scrubbed)) {
    const d = new Date(scrubbed);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
  }

  return scrubbed;
}
