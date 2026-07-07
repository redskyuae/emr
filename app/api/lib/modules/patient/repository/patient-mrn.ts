export function formatPatientMrn(sequenceNumber: number) {
  return `MRN-${String(sequenceNumber).padStart(4, '0')}`;
}
