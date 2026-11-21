import type { BookingPath } from '@/app/api/lib/modules/appointment/schemas/appointment-schema';
import type { VisitStatus } from '@/app/api/lib/modules/visit/schemas/visit-schema';
import { CONSULTATION_STEP_IDS } from '@/app/(protected)/visits/[id]/_utils/consultation-steps';
import { VISIT_OUTSTANDING_KINDS } from '@/app/(protected)/visits/[id]/_utils/visit-workflow';
import type { CreateVisitFormValues } from '@/app/(protected)/visits/new/_utils/create-visit-form-schema';
import { prop, type EventSpec } from '@/lib/analytics/event-spec';

// The Booking Path, Visit Status and payment timing lists live in modules that build Zod schemas,
// which the root bundle should not carry. They are restated here against the source types, and
// `funnel-events.unit.tests.ts` checks they still equal the source lists.
const BOOKING_PATHS = ['CONSULTATION', 'PROCEDURE'] as const satisfies readonly BookingPath[];
const VISIT_STATUSES = [
  'CHECKED_IN',
  'IN_CONSULTATION',
  'COMPLETED',
  'CANCELLED',
] as const satisfies readonly VisitStatus[];
const PAYMENT_TIMINGS = [
  'NOW',
  'LATER',
] as const satisfies readonly CreateVisitFormValues['paymentTiming'][];

const BOOKING_STEPS = [
  'patient',
  'doctor',
  'schedule',
  'details',
  'treatment_session',
  'procedure_schedule',
  'resources',
] as const;
const BOOKING_REJECTION_KINDS = [
  'duplicate_patient_match',
  'conflict',
  'validation',
  'forbidden',
  'server_error',
] as const;
const CHECK_IN_MODES = ['appointment', 'walk_in'] as const;
const CHECK_IN_SECTIONS = ['patient', 'visit_details', 'billing'] as const;
const CHECK_IN_BLOCK_KINDS = [
  'provisional_patient',
  'inactive_patient',
  'active_visit_exists',
  'appointment_already_checked_in',
  'appointment_not_today',
  'appointment_not_eligible',
] as const;
const CHECK_IN_BILLING_STEPS = [
  'create_invoice',
  'add_line',
  'finalize',
  'record_payment',
] as const;

export type BookingStep = (typeof BOOKING_STEPS)[number];
export type BookingRejectionKind = (typeof BOOKING_REJECTION_KINDS)[number];
export type CheckInMode = (typeof CHECK_IN_MODES)[number];
export type CheckInSection = (typeof CHECK_IN_SECTIONS)[number];
export type CheckInBlockKind = (typeof CHECK_IN_BLOCK_KINDS)[number];
export type CheckInBillingStep = (typeof CHECK_IN_BILLING_STEPS)[number];

const bookingPath = prop.enum(BOOKING_PATHS);
const checkInMode = prop.enum(CHECK_IN_MODES);
const secondsSinceStarted = prop.count();

/** Step-by-step events inside Appointment booking, Check-in and consultation, recorded by the browser (#359). */
export const funnelEvents = {
  appointment_booking_started: {
    source: 'client',
    properties: { prefilled_from_plan: prop.boolean() },
  },
  appointment_booking_patient_chosen: {
    source: 'client',
    properties: { patient_kind: prop.enum(['existing', 'provisional_new']) },
  },
  appointment_booking_path_selected: {
    source: 'client',
    properties: { booking_path: bookingPath },
  },
  appointment_booking_step_completed: {
    source: 'client',
    properties: {
      step: prop.enum(BOOKING_STEPS),
      // The Patient step can complete before a Booking Path is chosen.
      booking_path: prop.optional(bookingPath),
    },
  },
  appointment_booking_submitted: {
    source: 'client',
    properties: { booking_path: bookingPath, seconds_since_started: secondsSinceStarted },
  },
  appointment_booking_rejected: {
    source: 'client',
    properties: {
      status: prop.optional(prop.status()),
      booking_path: bookingPath,
      rejection_kind: prop.enum(BOOKING_REJECTION_KINDS),
    },
  },
  appointment_booking_abandoned: {
    source: 'client',
    properties: {
      last_step: prop.optional(prop.enum(BOOKING_STEPS)),
      booking_path: prop.optional(bookingPath),
      seconds_since_started: secondsSinceStarted,
    },
  },
  appointment_reschedule_started: {
    source: 'client',
    properties: { booking_path: bookingPath },
  },
  appointment_reschedule_submitted: {
    source: 'client',
    properties: { booking_path: bookingPath, seconds_since_started: secondsSinceStarted },
  },
  appointment_reschedule_abandoned: {
    source: 'client',
    properties: { booking_path: bookingPath, seconds_since_started: secondsSinceStarted },
  },
  check_in_started: {
    source: 'client',
    properties: { check_in_mode: checkInMode, prefilled_from_appointment: prop.boolean() },
  },
  check_in_patient_confirmed: {
    source: 'client',
    properties: { check_in_mode: checkInMode },
  },
  check_in_blocked: {
    source: 'client',
    properties: { block_kind: prop.enum(CHECK_IN_BLOCK_KINDS), check_in_mode: checkInMode },
  },
  check_in_submitted: {
    source: 'client',
    properties: {
      check_in_mode: checkInMode,
      payment_timing: prop.optional(prop.enum(PAYMENT_TIMINGS)),
      creates_invoice: prop.boolean(),
      seconds_since_started: secondsSinceStarted,
    },
  },
  check_in_payment_step_failed: {
    source: 'client',
    properties: {
      status: prop.optional(prop.status()),
      failed_step: prop.enum(CHECK_IN_BILLING_STEPS),
    },
  },
  check_in_abandoned: {
    source: 'client',
    properties: {
      last_section: prop.enum(CHECK_IN_SECTIONS),
      check_in_mode: checkInMode,
      seconds_since_started: secondsSinceStarted,
    },
  },
  consultation_step_viewed: {
    source: 'client',
    properties: {
      step: prop.enum(CONSULTATION_STEP_IDS),
      visit_status: prop.enum(VISIT_STATUSES),
      previous_step: prop.optional(prop.enum(CONSULTATION_STEP_IDS)),
      is_ayurveda_brand: prop.boolean(),
      seconds_on_previous_step: prop.optional(prop.count()),
    },
  },
  consultation_complete_opened: {
    source: 'client',
    properties: {
      outstanding_kinds: prop.enumList(VISIT_OUTSTANDING_KINDS),
      outstanding_item_count: prop.count(),
    },
  },
  consultation_complete_dismissed: {
    source: 'client',
    properties: { outstanding_item_count: prop.count() },
  },
} as const satisfies Record<string, EventSpec>;
