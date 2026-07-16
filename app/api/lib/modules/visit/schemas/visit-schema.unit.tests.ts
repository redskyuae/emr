import { describe, expect, it } from 'vitest';

import {
  cancelVisitSchema,
  checkInVisitSchema,
  formatVisitDate,
  listVisitsSchema,
  updateVisitSchema,
  visitIdSchema,
  visitTenantIdSchema,
} from './visit-schema';

const errorsOf = (result: { error?: { issues: { message: string }[] } }) =>
  result.error?.issues.map((issue) => issue.message) ?? [];

describe('Visit schema', () => {
  describe('checkInVisitSchema', () => {
    it('should accept an appointment check-in', () => {
      expect(checkInVisitSchema.parse({ appointmentId: 5, visitTypeId: 2 })).toMatchObject({
        appointmentId: 5,
        visitTypeId: 2,
      });
    });

    it('should accept a walk-in check-in', () => {
      expect(checkInVisitSchema.parse({ patientId: 7, doctorId: 3, visitTypeId: 2 })).toMatchObject(
        {
          patientId: 7,
          doctorId: 3,
          visitTypeId: 2,
        }
      );
    });

    it('should reject supplying both an appointment and walk-in details', () => {
      expect(
        errorsOf(
          checkInVisitSchema.safeParse({
            appointmentId: 5,
            patientId: 7,
            doctorId: 3,
            visitTypeId: 2,
          })
        )
      ).toContain(
        'Provide either appointmentId for an Appointment check-in or patientId and doctorId for a Walk-in Visit, not both.'
      );
    });

    it('should require patient and doctor for a walk-in', () => {
      const errors = errorsOf(checkInVisitSchema.safeParse({ visitTypeId: 2 }));

      expect(errors).toContain('Patient ID is required for a Walk-in Visit');
      expect(errors).toContain('Doctor ID is required for a Walk-in Visit');
    });

    it('should require a doctor when only a patient is supplied', () => {
      expect(errorsOf(checkInVisitSchema.safeParse({ patientId: 7, visitTypeId: 2 }))).toContain(
        'Doctor ID is required for a Walk-in Visit'
      );
    });

    it('should require the visit type', () => {
      expect(errorsOf(checkInVisitSchema.safeParse({ appointmentId: 5 }))).toContain(
        'Visit type ID is required'
      );
    });

    it('should reject a non-positive appointment id', () => {
      expect(
        errorsOf(checkInVisitSchema.safeParse({ appointmentId: 0, visitTypeId: 2 }))
      ).toContain('Appointment ID must be positive');
    });

    it('should trim the chief complaint and drop it when blank', () => {
      expect(
        checkInVisitSchema.parse({
          appointmentId: 5,
          visitTypeId: 2,
          chiefComplaint: '  Fever for 3 days  ',
        }).chiefComplaint
      ).toBe('Fever for 3 days');

      expect(
        checkInVisitSchema.parse({ appointmentId: 5, visitTypeId: 2, chiefComplaint: '   ' })
          .chiefComplaint
      ).toBeUndefined();
    });

    it('should reject a chief complaint over 500 characters', () => {
      expect(
        errorsOf(
          checkInVisitSchema.safeParse({
            appointmentId: 5,
            visitTypeId: 2,
            chiefComplaint: 'a'.repeat(501),
          })
        )
      ).toContain('Chief complaint must be at most 500 characters');
    });
  });

  describe('cancelVisitSchema', () => {
    it('should require a cancellation reason', () => {
      expect(errorsOf(cancelVisitSchema.safeParse({}))).toContain(
        'Cancellation reason is required'
      );
    });

    it('should reject a blank cancellation reason', () => {
      expect(errorsOf(cancelVisitSchema.safeParse({ cancellationReason: '   ' }))).toContain(
        'Cancellation reason cannot be empty'
      );
    });

    it('should trim the cancellation reason', () => {
      expect(cancelVisitSchema.parse({ cancellationReason: ' Patient left ' })).toEqual({
        cancellationReason: 'Patient left',
      });
    });

    it('should reject a reason over 255 characters', () => {
      expect(
        errorsOf(cancelVisitSchema.safeParse({ cancellationReason: 'a'.repeat(256) }))
      ).toContain('Cancellation reason must be at most 255 characters');
    });
  });

  describe('updateVisitSchema', () => {
    it('should normalize blank fields to undefined', () => {
      expect(updateVisitSchema.parse({ chiefComplaint: '', remarks: null })).toEqual({
        chiefComplaint: undefined,
        remarks: undefined,
      });
    });
  });

  describe('listVisitsSchema', () => {
    it('should transform a DD-MM-YYYY visit date to ISO', () => {
      expect(listVisitsSchema.parse({ visitDate: '16-07-2026' }).visitDate).toBe('2026-07-16');
    });

    it('should reject a malformed visit date', () => {
      expect(errorsOf(listVisitsSchema.safeParse({ visitDate: '2026-07-16' }))).toContain(
        'Visit date must be in DD-MM-YYYY format'
      );
    });

    it('should reject an impossible calendar date', () => {
      expect(errorsOf(listVisitsSchema.safeParse({ visitDate: '31-02-2026' }))).toContain(
        'Visit date must be in DD-MM-YYYY format'
      );
    });

    it('should reject an unknown status', () => {
      expect(errorsOf(listVisitsSchema.safeParse({ status: 'PENDING' }))).toContain(
        'Status is Invalid.'
      );
    });

    it('should accept a known status and coerce paging', () => {
      expect(listVisitsSchema.parse({ status: 'CHECKED_IN', page: '2', limit: '5' })).toMatchObject(
        {
          status: 'CHECKED_IN',
          page: 2,
          limit: 5,
        }
      );
    });

    it('should accept an empty filter object', () => {
      expect(listVisitsSchema.parse({})).toEqual({});
    });
  });

  describe('formatVisitDate', () => {
    it('should format an ISO date back to DD-MM-YYYY', () => {
      expect(formatVisitDate('2026-07-16')).toBe('16-07-2026');
    });
  });

  it('should validate id is a positive integer and tenant id is non-empty', () => {
    expect(visitIdSchema.safeParse('0').success).toBe(false);
    expect(visitIdSchema.parse('7')).toBe(7);
    expect(visitTenantIdSchema.safeParse('   ').success).toBe(false);
  });
});
