// The Audit Action catalogue (ADR 0053). Every Audit Event names one of these
// actions; its category, entity type, Module and Operation are all derived from
// it, so a route can never file an action in the wrong place. Labels are shared
// with the Audit Log page and the CSV export, so a new action needs no UI change.

export const AUDIT_CATEGORIES = [
  'access',
  'create',
  'update',
  'delete',
  'export',
  'admin',
  'auth',
] as const;

export type AuditCategory = (typeof AUDIT_CATEGORIES)[number];

/** The area of the EMR an action belongs to, as the Audit Log's Module column shows it. */
export const AUDIT_MODULES = [
  'Visits',
  'Patients',
  'Billing',
  'Identity & Access',
  'Audit Log',
  'Sign-in & Sessions',
] as const;

export type AuditModule = (typeof AUDIT_MODULES)[number];

/** What kind of thing the action did, as the Audit Log's Operation column shows it. */
export const AUDIT_OPERATIONS = [
  'View',
  'Create',
  'Update',
  'Amend',
  'Delete',
  'Sign',
  'Status change',
  'Assign',
  'Revoke',
  'Export',
  'Sign in',
  'Sign out',
] as const;

export type AuditOperation = (typeof AUDIT_OPERATIONS)[number];

export const AUDIT_ENTITY_TYPES = [
  'visit',
  'role',
  'session',
  'user',
  'patient',
  'invoice',
  'payment',
  'audit-log',
  'vital-sign',
  'clinical-note',
  'visit-document',
  'visit-diagnosis',
  'consolidated-report',
] as const;

export type AuditEntityType = (typeof AUDIT_ENTITY_TYPES)[number];

/** How each kind of record is named in the Audit Log. */
export const AUDIT_ENTITY_LABELS: Record<AuditEntityType, string> = {
  visit: 'Visit',
  role: 'Role',
  user: 'Staff user',
  patient: 'Patient',
  invoice: 'Invoice',
  payment: 'Payment',
  'audit-log': 'Audit Log',
  session: 'Session',
  'vital-sign': 'Vital Sign',
  'clinical-note': 'Clinical Note',
  'visit-document': 'Visit Document',
  'visit-diagnosis': 'Visit Diagnoses',
  'consolidated-report': 'Consolidated Patient Report',
};

type AuditActionDefinition = {
  label: string;
  module: AuditModule;
  category: AuditCategory;
  operation: AuditOperation;
  entityType: AuditEntityType;
};

const define = (
  module: AuditModule,
  entityType: AuditEntityType,
  operation: AuditOperation,
  category: AuditCategory,
  label: string
): AuditActionDefinition => ({ label, module, category, operation, entityType });

export const AUDIT_ACTIONS = {
  // Visits
  'visit.view': define('Visits', 'visit', 'View', 'access', 'Viewed Visit'),
  'visit.amend': define('Visits', 'visit', 'Amend', 'update', 'Amended Visit'),
  'visit.cancel': define('Visits', 'visit', 'Status change', 'update', 'Cancelled Visit'),
  'visit.delete': define('Visits', 'visit', 'Delete', 'delete', 'Deleted Visit'),
  'visit.update': define('Visits', 'visit', 'Update', 'update', 'Updated Visit'),
  'visit.check-in': define('Visits', 'visit', 'Create', 'create', 'Checked in Visit'),
  'visit.complete': define('Visits', 'visit', 'Status change', 'update', 'Completed Visit'),
  'visit.start-consultation': define(
    'Visits',
    'visit',
    'Status change',
    'update',
    'Started consultation'
  ),
  // Recorded inside a Visit
  'clinical-note.sign': define('Visits', 'clinical-note', 'Sign', 'update', 'Signed Clinical Note'),
  'clinical-note.amend': define(
    'Visits',
    'clinical-note',
    'Amend',
    'update',
    'Amended Clinical Note'
  ),
  'clinical-note.create': define(
    'Visits',
    'clinical-note',
    'Create',
    'create',
    'Created Clinical Note'
  ),
  'clinical-note.update': define(
    'Visits',
    'clinical-note',
    'Update',
    'update',
    'Updated Clinical Note'
  ),
  'clinical-note.delete': define(
    'Visits',
    'clinical-note',
    'Delete',
    'delete',
    'Deleted Clinical Note'
  ),
  'vital-sign.amend': define('Visits', 'vital-sign', 'Amend', 'update', 'Amended Vital Sign'),
  'vital-sign.create': define('Visits', 'vital-sign', 'Create', 'create', 'Recorded Vital Sign'),
  'vital-sign.update': define('Visits', 'vital-sign', 'Update', 'update', 'Updated Vital Sign'),
  'vital-sign.delete': define('Visits', 'vital-sign', 'Delete', 'delete', 'Deleted Vital Sign'),
  'visit-diagnosis.save': define(
    'Visits',
    'visit-diagnosis',
    'Update',
    'update',
    'Saved Visit diagnoses'
  ),
  'visit-diagnosis.amend': define(
    'Visits',
    'visit-diagnosis',
    'Amend',
    'update',
    'Amended Visit diagnoses'
  ),
  'visit-document.add': define(
    'Visits',
    'visit-document',
    'Create',
    'create',
    'Added Visit Document'
  ),
  'visit-document.delete': define(
    'Visits',
    'visit-document',
    'Delete',
    'delete',
    'Deleted Visit Document'
  ),
  // Patients
  'patient.view': define('Patients', 'patient', 'View', 'access', 'Viewed Patient'),
  'patient.create': define('Patients', 'patient', 'Create', 'create', 'Registered Patient'),
  'patient.update': define('Patients', 'patient', 'Update', 'update', 'Updated Patient'),
  'patient.delete': define('Patients', 'patient', 'Delete', 'delete', 'Deleted Patient'),
  'patient.deactivate': define(
    'Patients',
    'patient',
    'Status change',
    'update',
    'Deactivated Patient'
  ),
  'patient.reactivate': define(
    'Patients',
    'patient',
    'Status change',
    'update',
    'Reactivated Patient'
  ),
  'consolidated-report.view': define(
    'Patients',
    'consolidated-report',
    'View',
    'access',
    'Viewed Consolidated Report'
  ),
  // Billing
  'invoice.void': define('Billing', 'invoice', 'Status change', 'update', 'Voided Invoice'),
  'invoice.finalize': define('Billing', 'invoice', 'Status change', 'update', 'Finalized Invoice'),
  'payment.record': define('Billing', 'payment', 'Create', 'create', 'Recorded Payment'),
  // Identity and access
  'role.create': define('Identity & Access', 'role', 'Create', 'admin', 'Created Role'),
  'role.update': define('Identity & Access', 'role', 'Update', 'admin', 'Updated Role'),
  'role.delete': define('Identity & Access', 'role', 'Delete', 'admin', 'Deleted Role'),
  'role.permissions-change': define(
    'Identity & Access',
    'role',
    'Update',
    'admin',
    'Changed Role permissions'
  ),
  'user.create': define('Identity & Access', 'user', 'Create', 'admin', 'Created user'),
  'user.update': define('Identity & Access', 'user', 'Update', 'admin', 'Updated user'),
  'user.deactivate': define(
    'Identity & Access',
    'user',
    'Status change',
    'admin',
    'Deactivated user'
  ),
  'user.reactivate': define(
    'Identity & Access',
    'user',
    'Status change',
    'admin',
    'Reactivated user'
  ),
  'user.role-assign': define(
    'Identity & Access',
    'user',
    'Assign',
    'admin',
    'Assigned Role to user'
  ),
  'user.role-remove': define(
    'Identity & Access',
    'user',
    'Revoke',
    'admin',
    'Removed Role from user'
  ),
  'user.sessions-revoke': define(
    'Identity & Access',
    'user',
    'Revoke',
    'admin',
    'Revoked user Sessions'
  ),
  // Sign-in and Sessions
  'auth.sign-in': define('Sign-in & Sessions', 'session', 'Sign in', 'auth', 'Signed in'),
  'auth.sign-in-failed': define(
    'Sign-in & Sessions',
    'session',
    'Sign in',
    'auth',
    'Failed sign-in attempt'
  ),
  'auth.sign-out': define('Sign-in & Sessions', 'session', 'Sign out', 'auth', 'Signed out'),
  'auth.session-revoke': define(
    'Sign-in & Sessions',
    'session',
    'Revoke',
    'auth',
    'Ended own Session'
  ),
  // The Audit Log itself
  'audit-log.export': define('Audit Log', 'audit-log', 'Export', 'export', 'Exported Audit Log'),
  'user-audit.list-export': define(
    'Audit Log',
    'audit-log',
    'Export',
    'export',
    'Exported User Audit Events'
  ),
  'user-audit.export': define('Audit Log', 'user', 'Export', 'export', 'Exported a user’s audit'),
} as const satisfies Record<string, AuditActionDefinition>;

export type AuditAction = keyof typeof AUDIT_ACTIONS;

export const AUDIT_ACTION_KEYS = Object.keys(AUDIT_ACTIONS) as [AuditAction, ...AuditAction[]];

export function isAuditAction(value: string): value is AuditAction {
  return Object.hasOwn(AUDIT_ACTIONS, value);
}

/** The actions matching a Module and/or Operation filter. */
export function auditActionsMatching(filter: {
  module?: AuditModule;
  operation?: AuditOperation;
}): AuditAction[] {
  return AUDIT_ACTION_KEYS.filter((action) => {
    const definition = AUDIT_ACTIONS[action];
    return (
      (!filter.module || definition.module === filter.module) &&
      (!filter.operation || definition.operation === filter.operation)
    );
  });
}
