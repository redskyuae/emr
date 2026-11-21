'use client';

import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { useQueryState } from 'nuqs';

import { ApiError } from '@/app/queries/api-error';
import { AppointmentApiError } from '@/app/queries/appointments/useCreateAppointment';
import { captureAnalyticsEvent } from '@/lib/analytics/analytics-client';
import type { BookingStep } from '@/lib/analytics/events/funnel-events';
import { useWorkflowAnalytics } from '@/lib/analytics/use-workflow-analytics';

import type { BookAppointmentFormValues } from '../_utils/book-appointment-form-schema';
import {
  bookingRejectionKind,
  chosenBookingPatient,
  completedBookingSteps,
} from '../_utils/booking-analytics';

/**
 * The Book Appointment funnel: started, Patient chosen, Booking Path selected, each step completed
 * the first time the booking state makes it valid, submitted, rejected and abandoned. The booking
 * itself (`appointment_booked`) is recorded by the server.
 */
export function useBookingAnalytics(values: BookAppointmentFormValues) {
  const [addSessionsParam] = useQueryState('add-sessions');
  // Opened from a Patient Treatment Plan; read once, as the screen clears the parameter later.
  const [prefilledFromPlan] = useState(addSessionsParam !== null);
  const bookingPath = values.visitType === '' ? null : values.visitType;
  const lastBookingPath = useRef<typeof bookingPath>(null);
  const lastPatientKey = useRef<string | null>(null);
  const recordedSteps = useRef(new Set<BookingStep>());
  const lastStep = useRef<BookingStep | null>(null);

  const workflow = useWorkflowAnalytics({
    onStart: () =>
      captureAnalyticsEvent('appointment_booking_started', {
        prefilled_from_plan: prefilledFromPlan,
      }),
    onAbandon: ({ secondsSinceStarted, options }) =>
      captureAnalyticsEvent(
        'appointment_booking_abandoned',
        {
          last_step: lastStep.current,
          booking_path: bookingPath,
          seconds_since_started: secondsSinceStarted,
        },
        options
      ),
  });

  const recordProgress = useEffectEvent(() => {
    const patient = chosenBookingPatient(values);

    if ((patient?.key ?? null) !== lastPatientKey.current) {
      lastPatientKey.current = patient?.key ?? null;

      if (patient) {
        captureAnalyticsEvent('appointment_booking_patient_chosen', { patient_kind: patient.kind });
      }
    }

    if (bookingPath !== lastBookingPath.current) {
      lastBookingPath.current = bookingPath;

      if (bookingPath) {
        captureAnalyticsEvent('appointment_booking_path_selected', { booking_path: bookingPath });
      }
    }

    for (const step of completedBookingSteps(values)) {
      if (recordedSteps.current.has(step)) continue;

      recordedSteps.current.add(step);
      lastStep.current = step;
      captureAnalyticsEvent('appointment_booking_step_completed', {
        step,
        booking_path: bookingPath,
      });
    }
  });

  // Runs after every render: the booking state, not a click, decides when a step is complete.
  useEffect(() => {
    recordProgress();
  });

  return {
    recordSubmitted() {
      if (!bookingPath) return;

      captureAnalyticsEvent('appointment_booking_submitted', {
        booking_path: bookingPath,
        seconds_since_started: workflow.secondsSinceStarted(),
      });
    },
    recordBooked: workflow.markSucceeded,
    recordRejected(error: unknown) {
      if (!bookingPath) return;

      captureAnalyticsEvent('appointment_booking_rejected', {
        status: error instanceof ApiError ? error.status : null,
        booking_path: bookingPath,
        rejection_kind: bookingRejectionKind({
          status: error instanceof ApiError ? error.status : undefined,
          hasPatientMatches:
            error instanceof AppointmentApiError && error.patientMatches.length > 0,
        }),
      });
    },
  };
}
