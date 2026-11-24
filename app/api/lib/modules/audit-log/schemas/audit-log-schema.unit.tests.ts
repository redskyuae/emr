import { describe, expect, it } from 'vitest';

import {
  AUDIT_ACTIONS,
  AUDIT_CATEGORIES,
  AUDIT_ENTITY_LABELS,
  AUDIT_MODULES,
  AUDIT_OPERATIONS,
  auditActionsMatching,
  isAuditAction,
} from './audit-action-catalogue';
import {
  auditEventFiltersSchema,
  exportAuditEventsSchema,
  listAuditEventsSchema,
  recordAuditEventSchema,
} from './audit-log-schema';
import {
  exportUserAuditDetailSchema,
  exportUserAuditListSchema,
  userAuditDetailSchema,
} from './user-audit-schema';

const validEvent = {
  tenantId: 'tenant-1',
  action: 'visit.amend',
  actorUserId: 'user-1',
  actorName: 'Dr. Sara Ali',
};

const errorsOf = (result: { error?: { issues: { message: string }[] } }) =>
  result.error?.issues.map((issue) => issue.message) ?? [];

describe('Audit action catalogue', () => {
  it('should file every action under a known category, Module and Operation', () => {
    for (const definition of Object.values(AUDIT_ACTIONS)) {
      expect(AUDIT_CATEGORIES).toContain(definition.category);
      expect(AUDIT_MODULES).toContain(definition.module);
      expect(AUDIT_OPERATIONS).toContain(definition.operation);
      expect(AUDIT_ENTITY_LABELS[definition.entityType]).toBeTruthy();
    }
  });

  it('should file everything recorded inside a Visit under the Visits Module', () => {
    for (const action of [
      'clinical-note.amend',
      'vital-sign.create',
      'visit-diagnosis.save',
    ] as const) {
      expect(AUDIT_ACTIONS[action].module).toBe('Visits');
    }
  });

  it('should list the actions matching a Module and Operation', () => {
    expect(auditActionsMatching({ module: 'Visits', operation: 'Amend' }).sort()).toEqual([
      'clinical-note.amend',
      'visit-diagnosis.amend',
      'visit.amend',
      'vital-sign.amend',
    ]);
    expect(auditActionsMatching({ operation: 'Export' })).toEqual([
      'audit-log.export',
      'user-audit.list-export',
      'user-audit.export',
    ]);
    expect(auditActionsMatching({})).toHaveLength(Object.keys(AUDIT_ACTIONS).length);
  });

  it('should recognise catalogue actions and reject anything else', () => {
    expect(isAuditAction('visit.view')).toBe(true);
    expect(isAuditAction('visit.teleport')).toBe(false);
    expect(isAuditAction('toString')).toBe(false);
  });
});

describe('Audit Log schema', () => {
  it('should reject an action that is not in the catalogue', () => {
    expect(
      errorsOf(recordAuditEventSchema.safeParse({ ...validEvent, action: 'visit.teleport' }))
    ).toContain('Audit action is Invalid.');
  });

  it('should require an actor name', () => {
    expect(errorsOf(recordAuditEventSchema.safeParse({ ...validEvent, actorName: ' ' }))).toContain(
      'Actor name is required'
    );
  });

  it('should coerce a numeric entity id to a string and blank optional text to null', () => {
    const parsed = recordAuditEventSchema.parse({
      ...validEvent,
      entityId: 42,
      reason: '   ',
      entityLabel: ' V-2026-00012 ',
    });

    expect(parsed).toMatchObject({ entityId: '42', reason: null, entityLabel: 'V-2026-00012' });
  });

  it('should accept field changes with scalar values', () => {
    const parsed = recordAuditEventSchema.parse({
      ...validEvent,
      changes: [{ field: 'remarks', label: 'Remarks', from: null, to: 'Review in 2 weeks' }],
    });

    expect(parsed.changes).toHaveLength(1);
  });

  it('should reject a From date after the To date', () => {
    expect(
      errorsOf(auditEventFiltersSchema.safeParse({ fromDate: '2026-11-20', toDate: '2026-11-01' }))
    ).toContain('From date must be on or before To date');
  });

  it('should reject a date that is not YYYY-MM-DD', () => {
    expect(errorsOf(auditEventFiltersSchema.safeParse({ fromDate: '20-11-2026' }))).toContain(
      'From date must be a date in YYYY-MM-DD format'
    );
  });

  it.each(['2026-02-30', '2026-13-01', '0000-01-01'])(
    'should reject the impossible date %s as Invalid',
    (value) => {
      expect(errorsOf(auditEventFiltersSchema.safeParse({ fromDate: value }))).toEqual([
        'From date is Invalid.',
      ]);
      expect(errorsOf(userAuditDetailSchema.safeParse({ toDate: value }))).toEqual([
        'To date is Invalid.',
      ]);
    }
  );

  it('should accept a leap day in a leap year', () => {
    expect(auditEventFiltersSchema.parse({ fromDate: '2028-02-29' })).toEqual({
      fromDate: '2028-02-29',
    });
    expect(userAuditDetailSchema.parse({ toDate: '2028-02-29' })).toEqual({
      toDate: '2028-02-29',
    });
  });

  it('should truncate an over-long user agent and IP address instead of rejecting the event', () => {
    const result = recordAuditEventSchema.safeParse({
      ...validEvent,
      ipAddress: ` ${'1'.repeat(80)} `,
      userAgent: 'u'.repeat(1500),
    });

    expect(result.success).toBe(true);
    expect(result.data?.ipAddress).toBe('1'.repeat(64));
    expect(result.data?.userAgent).toBe('u'.repeat(1000));
  });

  it('should store a blank user agent and IP address as null', () => {
    expect(
      recordAuditEventSchema.parse({ ...validEvent, ipAddress: ' ', userAgent: '' })
    ).toMatchObject({ ipAddress: null, userAgent: null });
  });

  it('should reject an unknown category and a page size over 100', () => {
    expect(errorsOf(listAuditEventsSchema.safeParse({ category: 'gossip' }))).toContain(
      'Audit category is Invalid.'
    );
    expect(errorsOf(listAuditEventsSchema.safeParse({ limit: '101' }))).toContain(
      'Limit must be at most 100'
    );
  });

  it('should accept Module and Operation filters and reject unknown ones', () => {
    expect(listAuditEventsSchema.parse({ module: 'Billing', operation: 'Status change' })).toEqual({
      module: 'Billing',
      operation: 'Status change',
    });
    expect(errorsOf(listAuditEventsSchema.safeParse({ module: 'Pharmacy' }))).toContain(
      'Module is Invalid.'
    );
    expect(errorsOf(listAuditEventsSchema.safeParse({ operation: 'Teleport' }))).toContain(
      'Operation is Invalid.'
    );
  });

  it('should coerce Patient and Visit ids from query-string values', () => {
    expect(listAuditEventsSchema.parse({ patientId: '7', visitId: '12', page: '2' })).toMatchObject(
      {
        patientId: 7,
        visitId: 12,
        page: 2,
      }
    );
  });
});

describe('Audit export schemas', () => {
  it('should default every export to CSV', () => {
    expect(exportAuditEventsSchema.parse({}).format).toBe('csv');
    expect(exportUserAuditListSchema.parse({}).format).toBe('csv');
    expect(exportUserAuditDetailSchema.parse({}).format).toBe('csv');
  });

  it('should accept PDF and reject any other format with the exact message', () => {
    expect(exportAuditEventsSchema.parse({ format: 'pdf' }).format).toBe('pdf');
    expect(errorsOf(exportUserAuditListSchema.safeParse({ format: 'PDF' }))).toEqual([
      'Format must be csv or pdf',
    ]);
  });

  it('should keep the date-range rule on the exports', () => {
    expect(
      errorsOf(exportAuditEventsSchema.safeParse({ fromDate: '2026-11-20', toDate: '2026-11-01' }))
    ).toEqual(['From date must be on or before To date']);
    expect(
      errorsOf(
        exportUserAuditDetailSchema.safeParse({ fromDate: '2026-11-20', toDate: '2026-11-01' })
      )
    ).toEqual(['From date must be on or before To date']);
  });
});
