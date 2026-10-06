export type TreatmentForUnsafeImportDetection = {
  id: number;
  code: string;
  name: string;
  legacySourceIdentity: string | null;
  durationMinutes: number | null;
  setupMinutes: number | null;
  cleaningMinutes: number | null;
  roomType: string | null;
  therapistSkill: string | null;
  sessionCount: number;
  matchingSessionMetadataCount: number;
};

export type PriorUnsafeImportCandidate = {
  id: number;
  code: string;
  name: string;
  sessionCount: number;
  reason: string;
};

function oldDisplayParts(identity: string) {
  const separator = identity.indexOf('_');
  const codeSource = separator > 0 ? identity.slice(0, separator) : identity.replace(/\s+/gu, '');
  const nameSource = separator > 0 ? identity.slice(separator + 1) || identity : identity;
  const code = codeSource
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/gu, '')
    .slice(0, 20);
  const name = nameSource
    .replace(/[^\p{L}\p{N} +,&'()/_.:;{}[\]-]/gu, ' ')
    .replace(/\s+/gu, ' ')
    .trim()
    .slice(0, 200);
  return { code, name };
}

export function detectPriorUnsafeImports(
  treatments: TreatmentForUnsafeImportDetection[],
  legacyTreatmentIdentities: string[]
): PriorUnsafeImportCandidate[] {
  const expectedDisplays = legacyTreatmentIdentities.map(oldDisplayParts);
  return treatments
    .filter((treatment) => {
      if (treatment.legacySourceIdentity !== null) return false;
      if (['TRT-0400', 'TRT-0401'].includes(treatment.code.toUpperCase())) return false;
      if (
        treatment.durationMinutes !== 60 ||
        treatment.setupMinutes !== 10 ||
        treatment.cleaningMinutes !== 5 ||
        treatment.roomType !== 'Panchakarma room' ||
        treatment.therapistSkill !== 'Abhyanga' ||
        treatment.sessionCount < 1 ||
        treatment.sessionCount > 12 ||
        treatment.matchingSessionMetadataCount !== treatment.sessionCount
      ) {
        return false;
      }
      return expectedDisplays.some(
        (display) =>
          display.code.toLowerCase() === treatment.code.toLowerCase() &&
          display.name.toLowerCase() === treatment.name.toLowerCase()
      );
    })
    .map((treatment) => ({
      id: treatment.id,
      code: treatment.code,
      name: treatment.name,
      sessionCount: treatment.sessionCount,
      reason: 'Matches the metadata and Session signature of the retired unsafe importer',
    }))
    .sort((left, right) => left.id - right.id);
}
