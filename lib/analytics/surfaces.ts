// Sheets and dialogs keep their open state in the URL (ADR 0010): one parameter per surface, `new`
// for create and a record id for an existing record. This map says which parameter opens which
// surface on which page, so one listener can record `surface_opened` for all of them. The same
// parameter name can mean different things on different pages (`status` is a filter on most lists
// but the Asset Status sheet on its Master page), so the map is keyed by the cleaned page route.
// Parameters that are filters, tabs, steps or paging are deliberately absent.

export const SURFACE_MODES = ['create', 'edit', 'view', 'delete'] as const;

type SurfaceMode = (typeof SURFACE_MODES)[number];

export const SURFACE_NAMES = [
  'role',
  'user',
  'room',
  'rota',
  'asset',
  'doctor',
  'therapist',
  'room-type',
  'work-order',
  'doctor-schedule',
  'therapist-schedule',
  'asset-category',
  'asset-condition',
  'asset-status',
  'work-order-type',
  'work-order-priority',
  'work-order-status',
  'admission-type',
  'ward',
  'bed',
  'admit-source',
  'visit-type',
  'charge-item',
  'appointment-reason',
  'cancelled-reason',
  'ayurveda-code',
  'country',
  'language',
  'nationality',
  'religion',
  'state',
  'admit',
  'appointment',
  'appointment-cancel',
  'add-sessions',
  'allergy',
  'problem',
  'vital',
  'medication',
  'clinical-note',
  'capture-vitals',
  'capture-note',
  'capture-nurse-note',
  'capture-allergy',
  'capture-medication',
  'capture-plan',
  'capture-session',
  'amend-visit',
  'amend-note',
  'amend-vital',
  'plan-session',
  'invoice-line',
  'payment-receipt',
] as const;

type SurfaceName = (typeof SURFACE_NAMES)[number];

type OpenedSurface = { surface: SurfaceName; mode: SurfaceMode };

type ParamRule =
  /** `new` opens the create form; any other value opens `existing` for a record (or nothing). */
  | { kind: 'record'; surface: SurfaceName; existing: SurfaceMode | null }
  /** Only a record id opens it, in `mode`. */
  | { kind: 'existing'; surface: SurfaceName; mode: SurfaceMode }
  /** The value names the surface, as `?capture=vitals` does. */
  | { kind: 'values'; values: Readonly<Record<string, OpenedSurface>> };

const record = (surface: SurfaceName): ParamRule => ({ kind: 'record', surface, existing: 'edit' });
const createOnly = (surface: SurfaceName): ParamRule => ({
  kind: 'record',
  surface,
  existing: null,
});
const existing = (surface: SurfaceName, mode: SurfaceMode): ParamRule => ({
  kind: 'existing',
  surface,
  mode,
});
const created = (surface: SurfaceName): OpenedSurface => ({ surface, mode: 'create' });

export const SURFACES_BY_ROUTE: Readonly<Record<string, Readonly<Record<string, ParamRule>>>> = {
  '/rooms': { room: record('room') },
  '/doctors': { doctor: record('doctor') },
  '/therapists': { therapist: record('therapist') },
  '/admissions': { admit: createOnly('admit') },
  '/rota-management': { rota: record('rota') },
  '/doctor-schedules': { schedule: record('doctor-schedule') },
  '/therapist-schedules': { schedule: record('therapist-schedule') },
  '/room-masters/types': { 'room-type': record('room-type') },
  '/identity-access/roles': { role: record('role') },
  '/identity-access/users': { user: record('user') },
  '/assets-management/inventory': { asset: record('asset') },
  '/assets-management/maintenance': { 'work-order': record('work-order') },
  '/asset-management-masters/categories': {
    category: record('asset-category'),
    deleteCategory: existing('asset-category', 'delete'),
  },
  '/asset-management-masters/conditions': { condition: record('asset-condition') },
  '/asset-management-masters/statuses': {
    status: record('asset-status'),
    deleteStatus: existing('asset-status', 'delete'),
  },
  '/asset-management-masters/work-order-types': { 'work-order-type': record('work-order-type') },
  '/asset-management-masters/work-order-priorities': {
    'work-order-priority': record('work-order-priority'),
  },
  '/asset-management-masters/work-order-statuses': {
    'work-order-status': record('work-order-status'),
  },
  '/inpatient-masters/admission-types': { admissionType: record('admission-type') },
  '/inpatient-masters/wards': { ward: record('ward') },
  '/inpatient-masters/beds': { bed: record('bed') },
  '/visit-masters/admit-sources': { admitSource: record('admit-source') },
  '/visit-masters/visit-types': { visitType: record('visit-type') },
  '/billing-masters/charge-items': { 'charge-item': record('charge-item') },
  '/appointment-masters/reasons': { reason: record('appointment-reason') },
  '/appointment-masters/cancelled-reasons': { reason: record('cancelled-reason') },
  '/clinical-masters/ayurveda-diagnosis-codes': { ayurvedaCode: record('ayurveda-code') },
  '/global-references/countries': { country: record('country') },
  '/global-references/languages': { language: record('language') },
  '/global-references/religions': { religion: record('religion') },
  '/global-references/nationalities': {
    nationality: record('nationality'),
    nationalityDelete: existing('nationality', 'delete'),
  },
  '/global-references/states': {
    state: record('state'),
    stateDelete: existing('state', 'delete'),
  },
  '/appointments': {
    appointment: existing('appointment', 'view'),
    cancel: existing('appointment-cancel', 'edit'),
  },
  '/appointments/new': { 'add-sessions': existing('add-sessions', 'create') },
  '/patients/:id': {
    allergy: record('allergy'),
    problem: record('problem'),
    vital: record('vital'),
    medication: record('medication'),
    note: record('clinical-note'),
  },
  // `?capture=complete` (the Complete Visit dialog) is part of the consultation funnel (#359).
  '/visits/:id': {
    capture: {
      kind: 'values',
      values: {
        vitals: created('capture-vitals'),
        note: created('capture-note'),
        'nurse-note': created('capture-nurse-note'),
        allergy: created('capture-allergy'),
        medication: created('capture-medication'),
        plan: created('capture-plan'),
        session: created('capture-session'),
        amend: { surface: 'amend-visit', mode: 'edit' },
      },
    },
    planSession: existing('plan-session', 'edit'),
    addSessions: existing('add-sessions', 'create'),
    amendNote: existing('amend-note', 'edit'),
    amendVital: existing('amend-vital', 'edit'),
  },
  '/admissions/:id': {
    capture: {
      kind: 'values',
      values: { vitals: created('capture-vitals'), note: created('capture-note') },
    },
  },
  '/billing/:id': {
    line: createOnly('invoice-line'),
    receipt: existing('payment-receipt', 'view'),
  },
};

function resolve(rule: ParamRule, value: string): OpenedSurface | null {
  switch (rule.kind) {
    case 'record':
      if (value === 'new') {
        return { surface: rule.surface, mode: 'create' };
      }

      return rule.existing ? { surface: rule.surface, mode: rule.existing } : null;
    case 'existing':
      return value === 'new' ? null : { surface: rule.surface, mode: rule.mode };
    case 'values':
      return Object.hasOwn(rule.values, value) ? rule.values[value] : null;
  }
}

type ReadableParams = { get(name: string): string | null };

/**
 * The surfaces that opened between two readings of the same page's query string: a parameter
 * that appeared, or for value-named surfaces one whose value changed. Changing a record surface's
 * value while it stays open (`new` becoming the saved record's id) is not a new opening. Pass
 * `previous` as `null` for a page that just loaded, so a deep link to an open sheet counts once.
 * Only the surface name and mode come back: never the record id in the value.
 */
export function openedSurfaces(
  route: string,
  previous: ReadableParams | null,
  next: ReadableParams
): OpenedSurface[] {
  const rules = SURFACES_BY_ROUTE[route];

  if (!rules) {
    return [];
  }

  const opened: OpenedSurface[] = [];

  for (const [param, rule] of Object.entries(rules)) {
    const value = next.get(param);
    const before = previous?.get(param) ?? null;

    if (!value || value === before || (rule.kind !== 'values' && before)) {
      continue;
    }

    const surface = resolve(rule, value);

    if (surface) {
      opened.push(surface);
    }
  }

  return opened;
}
