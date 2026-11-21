import type { CHARGE_ITEM_CATEGORIES } from '@/app/db/schema/charge-item';
import { prop, type EventSpec } from '@/lib/analytics/event-spec';

const RECORD_ACTIONS = ['created', 'updated', 'deleted'] as const;

/**
 * Every Tenant-scoped Master and Global Reference module that records `master_record_changed`,
 * named after its module under `app/api/lib/modules/`.
 */
const MASTER_MODULES = [
  'bed',
  'room',
  'ward',
  'state',
  'country',
  'allergen',
  'language',
  'religion',
  'room-type',
  'specialty',
  'treatment',
  'visit-type',
  'charge-item',
  'doctor-rota',
  'nationality',
  'admit-source',
  'asset-status',
  'admission-type',
  'asset-category',
  'diagnosis-code',
  'therapist-skill',
  'asset-condition',
  'work-order-type',
  'appointment-mode',
  'appointment-type',
  'work-order-status',
  'clinical-note-type',
  'appointment-status',
  'appointment-reason',
  'work-order-priority',
  'ayurveda-diagnosis-code',
  'appointment-cancelled-reason',
] as const;

// A type-only import keeps the database schema out of the browser bundle; `satisfies` keeps the
// list in step with the Charge Item Category column.
const CHARGE_ITEM_CATEGORY_VALUES = [
  'BED',
  'OTHER',
  'PROCEDURE',
  'CONSUMABLE',
  'CONSULTATION',
  'INVESTIGATION',
] as const satisfies readonly (typeof CHARGE_ITEM_CATEGORIES)[number][];

/**
 * Tenant, access and configuration outcomes (signup, sign-in, Staff, Roles, schedules, Masters,
 * Assets), recorded by the server when the action succeeds (#358).
 */
export const serverAccessEvents = {
  tenant_signed_up: {
    source: 'server',
    properties: {},
  },
  tenant_onboarded: {
    source: 'server',
    properties: { minutes_since_signup: prop.count() },
  },
  user_signed_in: {
    source: 'server',
    properties: { remember_me: prop.boolean() },
  },
  tenant_profile_updated: {
    source: 'server',
    properties: {},
  },
  tenant_deactivated: {
    source: 'server',
    properties: {},
  },
  tenant_reactivated: {
    source: 'server',
    properties: {},
  },
  staff_changed: {
    source: 'server',
    properties: {
      action: prop.enum(['created', 'updated', 'deactivated', 'reactivated']),
      profile_kind: prop.enum(['staff', 'doctor', 'therapist']),
    },
  },
  role_changed: {
    source: 'server',
    properties: {
      action: prop.enum(RECORD_ACTIONS),
      is_system_role: prop.boolean(),
    },
  },
  role_permissions_changed: {
    source: 'server',
    properties: { permission_count: prop.count() },
  },
  staff_roles_changed: {
    source: 'server',
    properties: { role_count: prop.count() },
  },
  sessions_revoked: {
    source: 'server',
    properties: { scope: prop.enum(['single', 'user', 'all']) },
  },
  schedule_changed: {
    source: 'server',
    properties: {
      action: prop.enum(['created', 'updated']),
      span_days: prop.count(),
      rota_count: prop.count(),
      schedule_kind: prop.enum(['doctor', 'therapist']),
    },
  },
  master_record_changed: {
    source: 'server',
    properties: {
      master: prop.enum(MASTER_MODULES),
      action: prop.enum(RECORD_ACTIONS),
      charge_item_category: prop.optional(prop.enum(CHARGE_ITEM_CATEGORY_VALUES)),
    },
  },
  asset_changed: {
    source: 'server',
    properties: { action: prop.enum(RECORD_ACTIONS) },
  },
  work_order_created: {
    source: 'server',
    properties: {
      work_order_type_code: prop.optional(prop.code()),
      work_order_priority_code: prop.optional(prop.code()),
    },
  },
} as const satisfies Record<string, EventSpec>;
