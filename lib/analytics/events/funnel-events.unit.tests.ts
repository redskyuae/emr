import { describe, expect, it } from 'vitest';

import { bookingPathValues } from '@/app/api/lib/modules/appointment/schemas/appointment-schema';
import { VISIT_STATUSES } from '@/app/api/lib/modules/visit/schemas/visit-schema';
import { createVisitFormSchema } from '@/app/(protected)/visits/new/_utils/create-visit-form-schema';
import { sanitizeEventProperties } from '@/lib/analytics/catalogue';
import { funnelEvents } from './funnel-events';

describe('funnelEvents', () => {
  it('should offer exactly the Booking Paths the Appointment schema accepts', () => {
    expect(funnelEvents.appointment_booking_path_selected.properties.booking_path.values).toEqual(
      bookingPathValues
    );
  });

  it('should offer exactly the Visit Statuses the Visit schema defines', () => {
    expect(funnelEvents.consultation_step_viewed.properties.visit_status.values).toEqual(
      VISIT_STATUSES
    );
  });

  it('should offer exactly the payment timings the Check-in form accepts', () => {
    expect(funnelEvents.check_in_submitted.properties.payment_timing.values).toEqual(
      createVisitFormSchema.shape.paymentTiming.options
    );
  });

  it('should be recorded only by the browser', () => {
    for (const spec of Object.values(funnelEvents)) {
      expect(spec.source).toBe('client');
    }
  });

  it('should drop record ids and typed text from a booking rejection', () => {
    expect(
      sanitizeEventProperties('appointment_booking_rejected', {
        status: 409,
        booking_path: 'CONSULTATION',
        rejection_kind: 'duplicate_patient_match',
        patient_id: 42,
        patientMatches: [{ id: 42, mrn: 'MRN-0001' }],
        message: 'A Patient with these details already exists.',
      })
    ).toEqual({
      status: 409,
      booking_path: 'CONSULTATION',
      rejection_kind: 'duplicate_patient_match',
    });
  });

  it('should drop an outstanding kind that is not a fixed kind', () => {
    expect(
      sanitizeEventProperties('consultation_complete_opened', {
        outstanding_item_count: 1,
        outstanding_kinds: ['No Vital Signs recorded.'],
      })
    ).toEqual({ outstanding_item_count: 1 });
  });
});
