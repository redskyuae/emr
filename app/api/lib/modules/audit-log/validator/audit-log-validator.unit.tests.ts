import { describe, expect, it } from 'vitest';

import { validateExportAuditEvents, validateGetAuditEvents } from './get-audit-events-validator';
import { validateRecordAuditEvent } from './record-audit-event-validator';

describe('Audit Log validators', () => {
  it('should derive category and entity type from the action catalogue', () => {
    const result = validateRecordAuditEvent({
      tenantId: 'tenant-1',
      action: 'clinical-note.amend',
      actorUserId: 'user-1',
      actorName: 'Dr. Sara Ali',
      // A caller cannot smuggle its own category in.
      category: 'access',
    });

    expect(result).toMatchObject({
      success: true,
      data: { category: 'update', entityType: 'clinical-note' },
    });
  });

  it('should return the schema errors when the event is invalid', () => {
    expect(validateRecordAuditEvent({ tenantId: 'tenant-1' })).toMatchObject({ success: false });
  });

  it('should combine tenant and filter errors for a list request', () => {
    const result = validateGetAuditEvents({ category: 'gossip' }, ' ');

    expect(result).toEqual({
      success: false,
      errors: ['Tenant ID cannot be empty', 'Audit category is Invalid.'],
    });
  });

  it('should return the parsed filters with the tenant id', () => {
    expect(validateGetAuditEvents({ patientId: '3', page: '1' }, 'tenant-1')).toEqual({
      success: true,
      data: { patientId: 3, page: 1, tenantId: 'tenant-1' },
    });
  });

  it('should not accept paging on an export', () => {
    expect(validateExportAuditEvents({ page: '2', toDate: '2026-11-22' }, 'tenant-1')).toEqual({
      success: true,
      data: { toDate: '2026-11-22', format: 'csv', tenantId: 'tenant-1' },
    });
  });

  it('should accept a PDF export and reject an unknown format', () => {
    expect(validateExportAuditEvents({ format: 'pdf' }, 'tenant-1')).toEqual({
      success: true,
      data: { format: 'pdf', tenantId: 'tenant-1' },
    });
    expect(validateExportAuditEvents({ format: 'xlsx' }, 'tenant-1')).toEqual({
      success: false,
      errors: ['Format must be csv or pdf'],
    });
  });
});
