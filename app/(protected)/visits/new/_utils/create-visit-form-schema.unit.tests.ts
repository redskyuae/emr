import { describe, expect, it } from 'vitest';

import { createVisitFormSchema } from './create-visit-form-schema';

const base = {
  mode: 'appointment' as const,
  appointmentId: '12',
  patientId: '',
  doctorId: '',
  visitTypeId: '3',
  chiefComplaint: '',
  remarks: '',
};

describe('createVisitFormSchema', () => {
  it('accepts an Appointment whose Doctor is already assigned', () => {
    expect(createVisitFormSchema.safeParse(base).success).toBe(true);
  });

  it('requires an Appointment for an Appointment Visit', () => {
    const result = createVisitFormSchema.safeParse({ ...base, appointmentId: '' });
    expect(result.success).toBe(false);
  });

  it('requires Patient, Doctor, and Visit type for a Walk-in Visit', () => {
    const result = createVisitFormSchema.safeParse({
      ...base,
      mode: 'walk-in',
      appointmentId: '',
      visitTypeId: '',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path[0])).toEqual(
        expect.arrayContaining(['patientId', 'doctorId', 'visitTypeId'])
      );
    }
  });
});
