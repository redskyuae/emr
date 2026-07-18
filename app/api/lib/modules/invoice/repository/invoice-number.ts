export function formatInvoiceNumber(sequenceNumber: number) {
  return `INV-${String(sequenceNumber).padStart(4, '0')}`;
}

export function formatReceiptNumber(sequenceNumber: number) {
  return `RCP-${String(sequenceNumber).padStart(4, '0')}`;
}
