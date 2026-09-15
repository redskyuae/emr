import { describe, expect, it } from 'vitest';

import { EMPTY_BOOK_APPOINTMENT_FORM_VALUES } from '@/app/(protected)/appointments/new/_utils/book-appointment-form-schema';
import { rescheduleAppointmentFormSchema } from './reschedule-appointment-form-schema';

describe('rescheduleAppointmentFormSchema', () => {
  it('should validate a Procedure using only its new date and time', () => {
    expect(
      rescheduleAppointmentFormSchema.safeParse({
        ...EMPTY_BOOK_APPOINTMENT_FORM_VALUES,
        visitType: 'PROCEDURE',
        slotDate: '2099-12-31',
        startTime: '10:00',
        endTime: '11:00',
      }).success
    ).toBe(true);
  });

  it('should require a Doctor, Rota, and slots for a Consultation', () => {
    const result = rescheduleAppointmentFormSchema.safeParse({
      ...EMPTY_BOOK_APPOINTMENT_FORM_VALUES,
      visitType: 'CONSULTATION',
      slotDate: '2099-12-31',
    });

    expect(result.success).toBe(false);
    if (result.success) return;

    expect(result.error.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: ['doctorId'] }),
        expect.objectContaining({ path: ['doctorRotaId'] }),
        expect.objectContaining({ path: ['slotTimes'] }),
      ])
    );
  });

  it('should reject an invalid Procedure time range', () => {
    const result = rescheduleAppointmentFormSchema.safeParse({
      ...EMPTY_BOOK_APPOINTMENT_FORM_VALUES,
      visitType: 'PROCEDURE',
      slotDate: '2099-12-31',
      startTime: '11:00',
      endTime: '10:00',
    });

    expect(result.success).toBe(false);
    if (result.success) return;

    expect(result.error.issues).toContainEqual(
      expect.objectContaining({ path: ['endTime'], message: 'End time must be after start time' })
    );
  });
});
