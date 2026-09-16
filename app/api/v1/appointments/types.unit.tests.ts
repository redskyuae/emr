import { describe, expect, it } from 'vitest';

import type { CreateAppointmentRequest } from './types';

describe('CreateAppointmentRequest', () => {
  it('should expose the strict Appointment wire contract', () => {
    const request = {
      bookingPath: 'PROCEDURE',
      patientId: 5,
      slotDate: '31-12-2099',
      startTime: '10:00',
      endTime: '11:15',
      treatmentId: 400,
      treatmentSessionId: 401,
    } satisfies CreateAppointmentRequest;

    expect(request.bookingPath).toBe('PROCEDURE');
  });

  it('should not expose Patient registration-only fields for a Provisional Patient', () => {
    const request = {
      bookingPath: 'PROCEDURE',
      provisionalPatient: {
        firstName: 'Asha',
        lastName: 'Rao',
        phone: '9876543210',
        // @ts-expect-error The strict Appointment schema does not accept this Patient field.
        preferredPaymentMethod: 'cash',
      },
      slotDate: '31-12-2099',
      startTime: '10:00',
      endTime: '11:15',
      treatmentId: 400,
      treatmentSessionId: 401,
    } satisfies CreateAppointmentRequest;

    expect(request.bookingPath).toBe('PROCEDURE');
  });
});
