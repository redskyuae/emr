'use client';

import type { BookingPath } from '@/app/api/lib/modules/appointment/schemas/appointment-schema';
import { captureAnalyticsEvent } from '@/lib/analytics/analytics-client';
import { useWorkflowAnalytics } from '@/lib/analytics/use-workflow-analytics';

/**
 * Appointment Rescheduling: started once the Appointment has loaded and may be rescheduled,
 * submitted, and abandoned. The reschedule itself is recorded by the server.
 */
export function useRescheduleAnalytics(bookingPath: BookingPath | null) {
  const workflow = useWorkflowAnalytics({
    ready: bookingPath !== null,
    onStart: () => {
      if (bookingPath) {
        captureAnalyticsEvent('appointment_reschedule_started', { booking_path: bookingPath });
      }
    },
    onAbandon: ({ secondsSinceStarted, options }) => {
      if (bookingPath) {
        captureAnalyticsEvent(
          'appointment_reschedule_abandoned',
          { booking_path: bookingPath, seconds_since_started: secondsSinceStarted },
          options
        );
      }
    },
  });

  return {
    recordSubmitted() {
      if (!bookingPath) return;

      captureAnalyticsEvent('appointment_reschedule_submitted', {
        booking_path: bookingPath,
        seconds_since_started: workflow.secondsSinceStarted(),
      });
    },
    recordRescheduled: workflow.markSucceeded,
  };
}
