export function formatVisitNumber(sequenceNumber: number) {
  return `VST-${String(sequenceNumber).padStart(4, '0')}`;
}
