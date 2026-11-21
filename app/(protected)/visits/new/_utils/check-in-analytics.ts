// Pure helpers behind the Check-in funnel events. They return fixed kinds only; the server's
// messages are read to classify a rejection and are never sent.

import type {
  CheckInBlockKind,
  CheckInMode,
  CheckInSection,
} from '@/lib/analytics/events/funnel-events';

import type { CreateVisitFormValues } from './create-visit-form-schema';

export function checkInMode(mode: CreateVisitFormValues['mode']): CheckInMode {
  return mode === 'walk-in' ? 'walk_in' : 'appointment';
}

/** The section staff are working in: choosing the Patient, the Visit details, or Billing. */
export function checkInSection({
  confirmed,
  createInvoice,
}: {
  confirmed: boolean;
  createInvoice: boolean;
}): CheckInSection {
  if (!confirmed) return 'patient';

  return createInvoice ? 'billing' : 'visit_details';
}

// Matched against the Check-in validator's messages in app/api/lib/modules/visit/.
const BLOCK_PATTERNS: readonly [RegExp, CheckInBlockKind][] = [
  [/is provisional and must complete registration/i, 'provisional_patient'],
  [/is inactive and cannot be checked in/i, 'inactive_patient'],
  [/already has an active visit/i, 'active_visit_exists'],
  [/already has a visit/i, 'appointment_already_checked_in'],
  [/is not scheduled for today/i, 'appointment_not_today'],
  [
    /not in a checked-in eligible status|no longer eligible for check-in/i,
    'appointment_not_eligible',
  ],
];

/**
 * Why the server would not check this Patient or Appointment in, from its error messages. `null`
 * for any other failure, which is not a block.
 */
export function checkInBlockKind(errors: readonly string[]): CheckInBlockKind | null {
  for (const [pattern, kind] of BLOCK_PATTERNS) {
    if (errors.some((error) => pattern.test(error))) return kind;
  }

  return null;
}
