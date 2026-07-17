export function formatAdmissionNumber(sequenceNumber: number) {
  return `ADM-${String(sequenceNumber).padStart(4, '0')}`;
}
