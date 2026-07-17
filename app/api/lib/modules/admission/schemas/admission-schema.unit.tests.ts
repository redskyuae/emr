import { describe, expect, it } from 'vitest';

import {
  admissionIdSchema,
  admissionTenantIdSchema,
  admitPatientSchema,
  cancelAdmissionSchema,
  dischargeAdmissionSchema,
  formatAdmissionDate,
  listAdmissionsSchema,
  transferBedSchema,
  updateAdmissionSchema,
} from './admission-schema';

describe('Admission schema', () => {
  describe('admitPatientSchema', () => {
    it('should require patient, doctor, admission type, and bed', () => {
      const result = admitPatientSchema.safeParse({});

      expect(result.success).toBe(false);

      const messages = result.error?.issues.map((issue) => issue.message);
      expect(messages).toContain('Patient ID is required');
      expect(messages).toContain('Doctor ID is required');
      expect(messages).toContain('Admission type ID is required');
      expect(messages).toContain('Bed ID is required');
    });

    it('should coerce numeric strings and leave optional fields absent', () => {
      expect(
        admitPatientSchema.parse({
          patientId: '7',
          doctorId: '3',
          admissionTypeId: '2',
          bedId: '9',
        })
      ).toEqual({
        patientId: 7,
        doctorId: 3,
        admissionTypeId: 2,
        bedId: 9,
        visitId: undefined,
        remarks: undefined,
        admissionReason: undefined,
        expectedDischargeDate: undefined,
      });
    });

    it('should transform the expected discharge date from DD-MM-YYYY to ISO', () => {
      const parsed = admitPatientSchema.parse({
        patientId: 7,
        doctorId: 3,
        admissionTypeId: 2,
        bedId: 9,
        expectedDischargeDate: '20-07-2026',
      });

      expect(parsed.expectedDischargeDate).toBe('2026-07-20');
    });

    it('should reject a malformed or impossible expected discharge date', () => {
      for (const value of ['2026-07-20', '31-02-2026', 'someday']) {
        const result = admitPatientSchema.safeParse({
          patientId: 7,
          doctorId: 3,
          admissionTypeId: 2,
          bedId: 9,
          expectedDischargeDate: value,
        });

        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.message).toBe(
          'Expected discharge date must be in DD-MM-YYYY format'
        );
      }
    });

    it('should treat blank and null optional strings as absent', () => {
      const parsed = admitPatientSchema.parse({
        patientId: 7,
        doctorId: 3,
        admissionTypeId: 2,
        bedId: 9,
        admissionReason: '  ',
        remarks: null,
        expectedDischargeDate: '',
      });

      expect(parsed.admissionReason).toBeUndefined();
      expect(parsed.remarks).toBeUndefined();
      expect(parsed.expectedDischargeDate).toBeUndefined();
    });

    it('should reject an admission reason longer than 500 characters', () => {
      const result = admitPatientSchema.safeParse({
        patientId: 7,
        doctorId: 3,
        admissionTypeId: 2,
        bedId: 9,
        admissionReason: 'x'.repeat(501),
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toBe(
        'Admission reason must be at most 500 characters'
      );
    });
  });

  describe('updateAdmissionSchema', () => {
    it('should accept a partial payload of reason, remarks, and expected discharge date', () => {
      expect(
        updateAdmissionSchema.parse({
          admissionReason: ' Observation ',
          expectedDischargeDate: '21-07-2026',
        })
      ).toEqual({
        admissionReason: 'Observation',
        remarks: undefined,
        expectedDischargeDate: '2026-07-21',
      });
    });
  });

  describe('transferBedSchema', () => {
    it('should require the target bed', () => {
      const result = transferBedSchema.safeParse({});

      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toBe('Bed ID is required');
    });

    it('should trim the reason and cap it at 255 characters', () => {
      expect(transferBedSchema.parse({ toBedId: '4', reason: ' Closer to nurses ' })).toEqual({
        toBedId: 4,
        reason: 'Closer to nurses',
      });

      const tooLong = transferBedSchema.safeParse({ toBedId: 4, reason: 'x'.repeat(256) });
      expect(tooLong.success).toBe(false);
      expect(tooLong.error?.issues[0]?.message).toBe(
        'Transfer reason must be at most 255 characters'
      );
    });
  });

  describe('dischargeAdmissionSchema', () => {
    it('should accept every discharge disposition', () => {
      for (const disposition of ['ROUTINE', 'LAMA', 'TRANSFERRED', 'DECEASED', 'ABSCONDED']) {
        expect(dischargeAdmissionSchema.parse({ dischargeDisposition: disposition })).toMatchObject(
          { dischargeDisposition: disposition }
        );
      }
    });

    it('should reject an unknown disposition with the exact message', () => {
      const result = dischargeAdmissionSchema.safeParse({ dischargeDisposition: 'HOME' });

      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toBe('Discharge disposition is Invalid.');
    });

    it('should treat a blank summary as absent', () => {
      expect(
        dischargeAdmissionSchema.parse({ dischargeDisposition: 'ROUTINE', dischargeSummary: '  ' })
      ).toEqual({ dischargeDisposition: 'ROUTINE', dischargeSummary: undefined });
    });
  });

  describe('cancelAdmissionSchema', () => {
    it('should require a non-empty reason capped at 255 characters', () => {
      expect(cancelAdmissionSchema.safeParse({}).success).toBe(false);
      expect(cancelAdmissionSchema.safeParse({ cancellationReason: '  ' }).success).toBe(false);
      expect(cancelAdmissionSchema.safeParse({ cancellationReason: 'x'.repeat(256) }).success).toBe(
        false
      );
      expect(cancelAdmissionSchema.parse({ cancellationReason: ' Admitted in error ' })).toEqual({
        cancellationReason: 'Admitted in error',
      });
    });
  });

  describe('listAdmissionsSchema', () => {
    it('should reject an unknown status with the exact message', () => {
      const result = listAdmissionsSchema.safeParse({ status: 'OPEN' });

      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toBe('Status is Invalid.');
    });

    it('should coerce filters and pagination', () => {
      expect(
        listAdmissionsSchema.parse({ status: 'ADMITTED', wardId: '3', page: '2', limit: '5' })
      ).toMatchObject({ status: 'ADMITTED', wardId: 3, page: 2, limit: 5 });
    });
  });

  it('should coerce and validate the admission id and tenant id', () => {
    expect(admissionIdSchema.parse('7')).toBe(7);
    expect(admissionIdSchema.safeParse('abc').success).toBe(false);
    expect(admissionTenantIdSchema.parse(' tenant-1 ')).toBe('tenant-1');
    expect(admissionTenantIdSchema.safeParse('   ').success).toBe(false);
  });

  it('should format ISO dates back to DD-MM-YYYY', () => {
    expect(formatAdmissionDate('2026-07-20')).toBe('20-07-2026');
  });
});
