// A stricter check than `Number(id)`, which coerces non-canonical numeric
// strings (e.g. "1e2", " 1 ") into a valid-looking integer instead of
// rejecting the malformed route segment.
export function parsePatientIdParam(id: string): number | null {
  if (!/^\d+$/.test(id)) {
    return null;
  }

  const patientId = Number(id);
  return Number.isInteger(patientId) && patientId > 0 ? patientId : null;
}
