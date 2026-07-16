export function formatAppointmentBookingNumber(sequenceNumber: number) {
  return `APT-${String(sequenceNumber).padStart(4, '0')}`;
}
