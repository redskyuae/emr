export function formatWorkOrderCode(sequenceNumber: number) {
  return `WO-${String(sequenceNumber).padStart(4, '0')}`;
}
