export function parseApiError(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Something went wrong";
}

export function isApiError(
  err: unknown,
): err is Error & { status?: number; code?: string } {
  return err instanceof Error;
}
