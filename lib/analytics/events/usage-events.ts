import type { TimelineFeed } from '@/app/api/lib/modules/patient-timeline/schemas/patient-timeline-schema';
import { prop, type EventSpec } from '@/lib/analytics/event-spec';
import { REJECTION_KINDS } from '@/lib/analytics/request-failure';
import { SURFACE_MODES, SURFACE_NAMES } from '@/lib/analytics/surfaces';

const PATIENT_FORM_MODES = ['register', 'edit', 'complete_provisional'] as const;

const FORMS = ['patient_registration', 'patient_edit', 'invoice_composer'] as const;

const INVOICE_LINKS = ['visit', 'admission', 'none'] as const;

const INVOICE_COMPOSER_STEPS = [
  'create_invoice',
  'add_line',
  'update_draft',
  'finalize',
  'record_payment',
] as const;

const LISTS = [
  'patients',
  'previous_visits',
  'users',
  'assets',
  'work_orders',
  'appointments',
] as const;

/** A filter's name, never its chosen value. `date_range` is the From and To pair. */
const LIST_FILTERS = [
  'status',
  'gender',
  'doctor',
  'therapist',
  'date_range',
  'type',
  'role',
  'category',
] as const;

const TIMELINE_FEEDS = [
  'all',
  'billing',
  'records',
  'encounters',
] as const satisfies readonly TimelineFeed[];

const requestFailure = {
  api_route: prop.optional(prop.route()),
  status: prop.optional(prop.status()),
  rejection_kind: prop.enum(REJECTION_KINDS),
} as const;

/** Friction and feature-usage events across the app, recorded by the browser (#360). */
export const usageEvents = {
  action_rejected: { source: 'client', properties: requestFailure },
  data_load_failed: { source: 'client', properties: requestFailure },
  form_validation_failed: {
    source: 'client',
    properties: {
      form: prop.enum(FORMS),
      invalid_field_count: prop.count(),
      invalid_fields: prop.codeList(),
    },
  },
  patient_form_started: {
    source: 'client',
    properties: { mode: prop.enum(PATIENT_FORM_MODES) },
  },
  patient_form_submitted: {
    source: 'client',
    properties: {
      mode: prop.enum(PATIENT_FORM_MODES),
      has_emirates_id: prop.boolean(),
      seconds_since_started: prop.count(),
    },
  },
  patient_form_abandoned: {
    source: 'client',
    properties: { mode: prop.enum(PATIENT_FORM_MODES), seconds_since_started: prop.count() },
  },
  invoice_composer_started: {
    source: 'client',
    properties: { linked_to: prop.enum(INVOICE_LINKS) },
  },
  invoice_composer_submitted: {
    source: 'client',
    properties: {
      linked_to: prop.enum(INVOICE_LINKS),
      line_count: prop.count(),
      tender_count: prop.count(),
      finalize_now: prop.boolean(),
      has_discount: prop.boolean(),
      seconds_since_started: prop.count(),
    },
  },
  invoice_composer_step_failed: {
    source: 'client',
    properties: {
      failed_step: prop.enum(INVOICE_COMPOSER_STEPS),
      status: prop.optional(prop.status()),
    },
  },
  invoice_composer_abandoned: {
    source: 'client',
    properties: { linked_to: prop.enum(INVOICE_LINKS), seconds_since_started: prop.count() },
  },
  list_searched: {
    source: 'client',
    properties: { list: prop.enum(LISTS), query_length: prop.count(), has_results: prop.boolean() },
  },
  list_filtered: {
    source: 'client',
    properties: { list: prop.enum(LISTS), filter: prop.enum(LIST_FILTERS) },
  },
  surface_opened: {
    source: 'client',
    properties: { surface: prop.enum(SURFACE_NAMES), mode: prop.enum(SURFACE_MODES) },
  },
  document_printed: {
    source: 'client',
    properties: {
      document: prop.enum(['visit_summary', 'consolidated_report', 'payment_receipt']),
    },
  },
  export_downloaded: {
    source: 'client',
    properties: { export: prop.enum(['appointments']), format: prop.enum(['excel', 'pdf']) },
  },
  consolidated_report_opened: {
    source: 'client',
    properties: { period_days: prop.count() },
  },
  patient_detail_tab_viewed: {
    source: 'client',
    properties: { tab: prop.enum(['overview', 'chart', 'timeline']) },
  },
  patient_timeline_filtered: {
    source: 'client',
    properties: { feed: prop.enum(TIMELINE_FEEDS) },
  },
  // `page_number` is the ticket's name; `number` is on the never-send list, so the count of pages
  // now on screen is sent instead (2 for the first "load more").
  patient_timeline_more_loaded: {
    source: 'client',
    properties: { pages_loaded: prop.count() },
  },
  global_search_attempted: {
    source: 'client',
    properties: { query_length: prop.count() },
  },
} as const satisfies Record<string, EventSpec>;
