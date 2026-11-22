import { describe, expect, it } from 'vitest';

import { AUDIT_CHANGE_VALUE_MAX_LENGTH } from '@/app/api/lib/modules/audit-log/schemas/audit-log-schema';
import { diffAuditFields, VISIT_AUDIT_FIELDS } from './audit-changes';

describe('diffAuditFields', () => {
  it('should record only the listed fields that changed', () => {
    const before = { remarks: 'Old', chiefComplaint: 'Back pain', secret: 'a' };
    const after = { remarks: 'New', chiefComplaint: 'Back pain', secret: 'b' };

    expect(
      diffAuditFields(before, after, [
        { path: 'remarks', label: 'Remarks' },
        { path: 'chiefComplaint', label: 'Chief complaint' },
      ])
    ).toEqual([{ field: 'remarks', label: 'Remarks', from: 'Old', to: 'New' }]);
  });

  it('should read nested summaries by path and treat a cleared value as null', () => {
    const before = { doctor: { id: 1, name: 'Dr. Sara Ali' }, remarks: 'Note' };
    const after = { doctor: null, remarks: '' };

    expect(diffAuditFields(before, after, VISIT_AUDIT_FIELDS)).toEqual([
      { field: 'doctor.name', label: 'Doctor', from: 'Dr. Sara Ali', to: null },
      { field: 'remarks', label: 'Remarks', from: 'Note', to: null },
    ]);
  });

  it('should compare dates by instant and keep numbers and booleans as they are', () => {
    const fields = [
      { path: 'recordedAt', label: 'Recorded at' },
      { path: 'systolic', label: 'Systolic' },
      { path: 'isVip', label: 'VIP' },
    ];
    const at = new Date('2026-11-22T06:00:00Z');

    expect(
      diffAuditFields(
        { recordedAt: at, systolic: 120, isVip: false },
        { recordedAt: new Date(at), systolic: 140, isVip: true },
        fields
      )
    ).toEqual([
      { field: 'systolic', label: 'Systolic', from: 120, to: 140 },
      { field: 'isVip', label: 'VIP', from: false, to: true },
    ]);
  });

  it('should cut a very long value', () => {
    const long = 'x'.repeat(AUDIT_CHANGE_VALUE_MAX_LENGTH + 50);
    const [change] = diffAuditFields({ plan: '' }, { plan: long }, [
      { path: 'plan', label: 'Plan' },
    ]);

    expect(String(change.to)).toHaveLength(AUDIT_CHANGE_VALUE_MAX_LENGTH + 1);
  });
});
