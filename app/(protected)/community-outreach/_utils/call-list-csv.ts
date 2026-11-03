import { staffName } from './outreach-presentation';
import type { OutreachContact } from './outreach-types';

const HEADER = ['Name', 'Phone', 'Area', 'Interest', 'Next follow-up', 'Assigned staff'];

function cell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

/** Builds a call list. Contacts who did not agree to be contacted are never exported. */
export function buildCallListCsv(contacts: OutreachContact[]) {
  const rows = contacts
    .filter((contact) => contact.consent)
    .map((contact) =>
      [
        contact.name,
        contact.phone,
        contact.area,
        contact.interest,
        contact.next,
        staffName(contact.staffId),
      ]
        .map(cell)
        .join(',')
    );

  return [HEADER.map(cell).join(','), ...rows].join('\n');
}
