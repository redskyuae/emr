'use client';

import { useEffect, useEffectEvent, useRef } from 'react';

import { ApiError, getApiErrors } from '@/app/queries/api-error';
import { captureAnalyticsEvent } from '@/lib/analytics/analytics-client';
import type { CheckInBillingStep } from '@/lib/analytics/events/funnel-events';
import { useWorkflowAnalytics } from '@/lib/analytics/use-workflow-analytics';

import { checkInBlockKind, checkInMode, checkInSection } from '../_utils/check-in-analytics';
import type { CreateVisitFormValues } from '../_utils/create-visit-form-schema';

type CheckInAnalyticsOptions = {
  mode: CreateVisitFormValues['mode'];
  prefilledFromAppointment: boolean;
  confirmed: boolean;
  createInvoice: boolean;
  /** The selected Patient when they are Provisional, which keeps Confirm Patient disabled. */
  provisionalPatientId: number | null;
};

function statusOf(error: unknown) {
  return error instanceof ApiError ? error.status : null;
}

/**
 * The Check-in funnel: started, Patient confirmed, blocked, submitted, a billing step failing after
 * the Visit was checked in, and abandoned. The Check-in and Payment themselves are recorded by the
 * server.
 */
export function useCheckInAnalytics({
  mode,
  prefilledFromAppointment,
  confirmed,
  createInvoice,
  provisionalPatientId,
}: CheckInAnalyticsOptions) {
  const currentMode = checkInMode(mode);
  const lastProvisionalPatientId = useRef<number | null>(null);

  const workflow = useWorkflowAnalytics({
    onStart: () =>
      captureAnalyticsEvent('check_in_started', {
        check_in_mode: currentMode,
        prefilled_from_appointment: prefilledFromAppointment,
      }),
    onAbandon: ({ secondsSinceStarted, options }) =>
      captureAnalyticsEvent(
        'check_in_abandoned',
        {
          last_section: checkInSection({ confirmed, createInvoice }),
          check_in_mode: currentMode,
          seconds_since_started: secondsSinceStarted,
        },
        options
      ),
  });

  // Once per Provisional Patient selected; the id is compared here and never sent.
  const recordProvisionalBlock = useEffectEvent((patientId: number | null) => {
    if (patientId === lastProvisionalPatientId.current) return;

    lastProvisionalPatientId.current = patientId;

    if (patientId !== null) {
      captureAnalyticsEvent('check_in_blocked', {
        block_kind: 'provisional_patient',
        check_in_mode: currentMode,
      });
    }
  });

  useEffect(() => {
    recordProvisionalBlock(provisionalPatientId);
  }, [provisionalPatientId]);

  return {
    recordPatientConfirmed() {
      captureAnalyticsEvent('check_in_patient_confirmed', { check_in_mode: currentMode });
    },
    recordSubmitted(values: Pick<CreateVisitFormValues, 'createInvoice' | 'paymentTiming'>) {
      captureAnalyticsEvent('check_in_submitted', {
        check_in_mode: currentMode,
        payment_timing: values.createInvoice ? values.paymentTiming : null,
        creates_invoice: values.createInvoice,
        seconds_since_started: workflow.secondsSinceStarted(),
      });
    },
    recordRejected(error: unknown) {
      const blockKind = checkInBlockKind(getApiErrors(error));

      if (blockKind) {
        captureAnalyticsEvent('check_in_blocked', {
          block_kind: blockKind,
          check_in_mode: currentMode,
        });
      }
    },
    recordCheckedIn: workflow.markSucceeded,
    recordPaymentStepFailed(failedStep: CheckInBillingStep, error: unknown) {
      captureAnalyticsEvent('check_in_payment_step_failed', {
        status: statusOf(error),
        failed_step: failedStep,
      });
    },
  };
}
