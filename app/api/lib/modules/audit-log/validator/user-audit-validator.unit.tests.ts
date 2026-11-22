import { describe, expect, it } from 'vitest';

import {
  validateExportUserAuditDetail,
  validateExportUserAuditList,
  validateGetUserAuditDetail,
  validateGetUserAuditList,
} from './get-user-audit-validator';

describe('User Audit validators', () => {
  it('should parse the list filters with the tenant id', () => {
    expect(
      validateGetUserAuditList({ fromDate: '2026-11-01', page: '2', query: ' sara ' }, 'tenant-1')
    ).toEqual({
      success: true,
      data: { fromDate: '2026-11-01', page: 2, query: 'sara', tenantId: 'tenant-1' },
    });
  });

  it('should reject an inverted range and a page size over 100', () => {
    const result = validateGetUserAuditList(
      { fromDate: '2026-11-20', toDate: '2026-11-01', limit: '500' },
      'tenant-1'
    );

    expect(result).toMatchObject({ success: false });
    expect(result.success ? [] : result.errors).toEqual(
      expect.arrayContaining([
        'From date must be on or before To date',
        'Limit must be at most 100',
      ])
    );
  });

  it('should require a user id for the detail', () => {
    expect(validateGetUserAuditDetail('  ', {}, 'tenant-1')).toEqual({
      success: false,
      errors: ['User ID is required'],
    });
  });

  it('should return the user id and range for the detail', () => {
    expect(validateGetUserAuditDetail('user-1', { toDate: '2026-11-22' }, 'tenant-1')).toEqual({
      success: true,
      data: { toDate: '2026-11-22', tenantId: 'tenant-1', userId: 'user-1' },
    });
  });

  it('should default the list export to CSV and drop paging', () => {
    expect(
      validateExportUserAuditList({ query: ' sara ', page: '3', limit: '10' }, 'tenant-1')
    ).toEqual({
      success: true,
      data: { query: 'sara', format: 'csv', tenantId: 'tenant-1' },
    });
  });

  it('should accept a PDF export for one member and reject an unknown format', () => {
    expect(validateExportUserAuditDetail('user-1', { format: 'pdf' }, 'tenant-1')).toEqual({
      success: true,
      data: { format: 'pdf', tenantId: 'tenant-1', userId: 'user-1' },
    });
    expect(validateExportUserAuditDetail('user-1', { format: 'xls' }, 'tenant-1')).toEqual({
      success: false,
      errors: ['Format must be csv or pdf'],
    });
  });

  it('should report an inverted range on an export as on the page', () => {
    const result = validateExportUserAuditList(
      { fromDate: '2026-11-20', toDate: '2026-11-01' },
      'tenant-1'
    );

    expect(result).toEqual({ success: false, errors: ['From date must be on or before To date'] });
  });
});
