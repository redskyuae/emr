import { bookingPathValues } from '@/app/api/lib/modules/appointment/schemas/appointment-schema';
import type {
  InvoiceStatus,
  PaymentMethod,
} from '@/app/api/lib/modules/invoice/schemas/invoice-schema';
import { treatmentSessionStructureSchema } from '@/app/api/lib/modules/treatment/schemas/treatment-schema';
import { ACCEPTED_VISIT_DOCUMENT_TYPES } from '@/app/api/lib/modules/visit-document/schemas/visit-document-schema';
import { VISIT_STATUSES } from '@/app/api/lib/modules/visit/schemas/visit-schema';
import { prop, type EventSpec } from '@/lib/analytics/event-spec';

// Invoice Status and Payment Method are declared next to their Drizzle tables. Importing those at
// runtime would pull the table definitions into every browser page that loads the catalogue, so the
// values are repeated here, type-checked against the schema, and compared with the real arrays by
// `server-lifecycle-events.unit.tests.ts`.
const INVOICE_STATUS_VALUES = [
  'DRAFT',
  'FINALIZED',
  'PARTIALLY_PAID',
  'PAID',
  'VOID',
] as const satisfies readonly InvoiceStatus[];
const PAYMENT_METHOD_VALUES = [
  'CASH',
  'CARD',
  'UPI',
  'BANK_TRANSFER',
  'CHEQUE',
  'OTHER',
] as const satisfies readonly PaymentMethod[];

const CLINICAL_CONTEXTS = ['visit', 'admission', 'patient'] as const;
const INVOICE_LINKS = ['visit', 'admission', 'none'] as const;

const bookingPath = () => prop.enum(bookingPathValues);
const clinicalContext = () => prop.enum(CLINICAL_CONTEXTS);
const invoiceLink = () => prop.enum(INVOICE_LINKS);
const invoiceStatus = () => prop.enum(INVOICE_STATUS_VALUES);
const sessionStructure = () => prop.enum(treatmentSessionStructureSchema.options);
const documentContentType = () => prop.optional(prop.enum(ACCEPTED_VISIT_DOCUMENT_TYPES));

/** Business outcomes of Appointments, Visits and clinical records, Patients, Admissions and Billing, recorded by the server when the action succeeds (#358). */
export const serverLifecycleEvents = {
  appointment_booked: {
    source: 'server',
    properties: {
      booking_path: bookingPath(),
      patient_kind: prop.enum(['existing', 'provisional_new']),
      appointment_mode_code: prop.optional(prop.code()),
      appointment_type_code: prop.optional(prop.code()),
      appointment_reason_code: prop.optional(prop.code()),
      slot_count: prop.optional(prop.count()),
      lead_time_days: prop.count(),
      is_same_day: prop.boolean(),
      procedure_source: prop.optional(prop.enum(['existing_plan', 'catalogue_treatment'])),
      has_doctor: prop.boolean(),
      has_remarks: prop.boolean(),
    },
  },
  appointment_rescheduled: {
    source: 'server',
    properties: {
      booking_path: bookingPath(),
      doctor_changed: prop.boolean(),
      lead_time_days: prop.count(),
    },
  },
  appointment_cancelled: {
    source: 'server',
    properties: {
      booking_path: bookingPath(),
      cancelled_reason_code: prop.optional(prop.code()),
      lead_time_days: prop.count(),
      released_plan_session: prop.boolean(),
    },
  },
  visit_checked_in: {
    source: 'server',
    properties: {
      check_in_mode: prop.enum(['appointment', 'walk_in']),
      visit_type_code: prop.code(),
      admit_source_code: prop.optional(prop.code()),
      has_doctor: prop.boolean(),
      has_treatment_session: prop.boolean(),
      document_count: prop.count(),
      minutes_vs_appointment_start: prop.optional(prop.offset()),
    },
  },
  visit_consultation_started: {
    source: 'server',
    properties: {
      visit_type_code: prop.code(),
      minutes_since_check_in: prop.count(),
    },
  },
  visit_completed: {
    source: 'server',
    properties: {
      visit_type_code: prop.code(),
      minutes_since_check_in: prop.count(),
      minutes_in_consultation: prop.optional(prop.count()),
    },
  },
  visit_cancelled: {
    source: 'server',
    properties: {
      from_status: prop.enum(VISIT_STATUSES),
      minutes_since_check_in: prop.count(),
    },
  },
  visit_amended: {
    source: 'server',
    properties: {
      amended_part: prop.enum(['visit', 'clinical_note', 'vital_sign', 'diagnoses']),
      days_since_completed: prop.optional(prop.count()),
    },
  },
  visit_diagnoses_saved: {
    source: 'server',
    properties: {
      icd10_count: prop.count(),
      ayurveda_count: prop.count(),
    },
  },
  visit_document_added: {
    source: 'server',
    properties: { content_type: documentContentType() },
  },
  visit_document_removed: {
    source: 'server',
    properties: { content_type: documentContentType() },
  },
  clinical_note_created: {
    source: 'server',
    properties: {
      note_type_code: prop.optional(prop.code()),
      context: clinicalContext(),
    },
  },
  clinical_note_signed: {
    source: 'server',
    properties: {
      note_type_code: prop.optional(prop.code()),
      minutes_since_created: prop.count(),
    },
  },
  vital_signs_recorded: {
    source: 'server',
    properties: {
      context: clinicalContext(),
      fields_recorded_count: prop.count(),
    },
  },
  patient_chart_item_changed: {
    source: 'server',
    properties: {
      kind: prop.enum(['allergy', 'problem', 'medication']),
      action: prop.enum(['created', 'updated', 'removed']),
    },
  },
  treatment_plan_assigned: {
    source: 'server',
    properties: {
      session_structure: sessionStructure(),
      session_count: prop.count(),
    },
  },
  treatment_plan_sessions_added: {
    source: 'server',
    properties: { added_count: prop.count() },
  },
  treatment_plan_session_started: {
    source: 'server',
    properties: { session_structure: sessionStructure() },
  },
  patient_registered: {
    source: 'server',
    properties: {
      registration_path: prop.enum(['direct', 'completed_provisional']),
      has_emirates_id: prop.boolean(),
      is_medical_tourist: prop.boolean(),
      identity_document_count: prop.count(),
    },
  },
  patient_deactivated: {
    source: 'server',
    properties: {},
  },
  patient_reactivated: {
    source: 'server',
    properties: {},
  },
  patient_admitted: {
    source: 'server',
    properties: {
      admission_type_code: prop.code(),
      from_visit: prop.boolean(),
      has_expected_discharge_date: prop.boolean(),
    },
  },
  bed_transferred: {
    source: 'server',
    properties: { same_ward: prop.boolean() },
  },
  admission_discharged: {
    source: 'server',
    properties: {
      length_of_stay_days: prop.count(),
      has_discharge_summary: prop.boolean(),
    },
  },
  admission_cancelled: {
    source: 'server',
    properties: {},
  },
  invoice_created: {
    source: 'server',
    properties: { linked_to: invoiceLink() },
  },
  invoice_finalized: {
    source: 'server',
    properties: {
      linked_to: invoiceLink(),
      line_count: prop.count(),
      manual_line_count: prop.count(),
      bed_auto_line_count: prop.count(),
      has_discount: prop.boolean(),
      resulting_status: invoiceStatus(),
      minutes_since_created: prop.count(),
    },
  },
  invoice_voided: {
    source: 'server',
    properties: { from_status: invoiceStatus() },
  },
  invoice_deleted: {
    source: 'server',
    properties: {},
  },
  payment_recorded: {
    source: 'server',
    properties: {
      payment_method: prop.enum(PAYMENT_METHOD_VALUES),
      resulting_invoice_status: invoiceStatus(),
      payment_sequence: prop.count(),
      linked_to: invoiceLink(),
      minutes_since_visit_check_in: prop.optional(prop.count()),
    },
  },
  bed_charges_generated: {
    source: 'server',
    properties: { line_count: prop.count() },
  },
} as const satisfies Record<string, EventSpec>;
