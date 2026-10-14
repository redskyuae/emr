const POSITIONED_SESSION_LABEL = /^Session\s+\d+(?:\s+of\s+\d+)?(?:\s*·\s*(.*))?$/iu;

function positionedClinicalLabel(label: string): string | null {
  const match = label.trim().match(POSITIONED_SESSION_LABEL);
  if (!match) return null;

  return match[1]?.trim() ?? '';
}

function sessionPosition(sessionNumber: number, totalSessions: number) {
  return `Session ${sessionNumber} of ${totalSessions}`;
}

export function resequencePatientTreatmentPlanSessionLabel(
  label: string | null,
  sessionNumber: number,
  totalSessions: number
): string | null {
  if (label === null) return null;

  const clinicalLabel = positionedClinicalLabel(label);
  if (clinicalLabel === null) return label;

  const position = sessionPosition(sessionNumber, totalSessions);
  return clinicalLabel ? `${position} · ${clinicalLabel}` : position;
}

export function formatPatientTreatmentPlanSessionDisplayLabel(
  label: string,
  sessionNumber: number,
  totalSessions: number
): string {
  const position = sessionPosition(sessionNumber, totalSessions);
  const positionedLabel = positionedClinicalLabel(label);
  if (positionedLabel !== null) {
    return positionedLabel ? `${position} · ${positionedLabel}` : position;
  }

  const clinicalLabel = label.trim();
  return clinicalLabel ? `${position} · ${clinicalLabel}` : position;
}
