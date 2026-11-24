/**
 * The query string for an Audit Log request (list, User Audit or export): every
 * filter that is set, with empty ones left out so the API sees them as absent.
 */
export function auditSearchParams(params: Record<string, string | number | undefined>) {
  const searchParams = new URLSearchParams();

  for (const [name, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') searchParams.set(name, String(value));
  }

  return searchParams;
}
