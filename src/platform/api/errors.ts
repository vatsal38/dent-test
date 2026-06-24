function humanizeAirtableErrorMessage(message: string): string {
  if (!/Airtable API error/i.test(message)) return message;

  if (
    /INVALID_VALUE_FOR_COLUMN/i.test(message) ||
    /not an array of record IDs/i.test(message)
  ) {
    return "Could not save to Airtable because a field has an incompatible value. Please try again or contact support if this continues.";
  }
  if (/INVALID_PERMISSIONS|API error 403/i.test(message)) {
    if (/externally synced/i.test(message)) {
      return "Airtable blocked the write because this table is externally synced. Imports still work; outbound writes are skipped.";
    }
    return "The server Airtable API token cannot write to this table. Ask an admin to grant the token editor access on Students & Alums (this is not your Dent login).";
  }
  if (/API error 404/i.test(message)) {
    return "The linked Airtable record could not be found.";
  }
  if (/API error 422/i.test(message)) {
    return "Airtable rejected the update. Please check the data and try again.";
  }
  if (/API error 5\d\d/i.test(message)) {
    return "Airtable is temporarily unavailable. Please try again later.";
  }
  return "Airtable sync failed. Please try again later.";
}

export function parseApiError(err: unknown): string {
  const raw =
    err instanceof Error
      ? err.message
      : typeof err === "string"
        ? err
        : "Something went wrong";
  return humanizeAirtableErrorMessage(raw);
}

export function isApiError(
  err: unknown,
): err is Error & { status?: number; code?: string } {
  return err instanceof Error;
}
