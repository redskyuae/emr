'use client';

import type { FieldErrors } from 'react-hook-form';

import { ApiError } from '@/app/queries/api-error';
import { useFormFunnelAnalytics } from '@/hooks/use-form-funnel-analytics';
import { captureAnalyticsEvent } from '@/lib/analytics/analytics-client';
import type { AnalyticsEventProperties } from '@/lib/analytics/catalogue';
import { formValidationFailure } from '@/lib/analytics/form-validation';

import type { CreateInvoiceFormValues } from '../_utils/create-invoice-form-schema';

type InvoiceLink = AnalyticsEventProperties<'invoice_composer_started'>['linked_to'];

type Submission = Omit<
  AnalyticsEventProperties<'invoice_composer_submitted'>,
  'seconds_since_started'
>;

export type ComposerStep = AnalyticsEventProperties<'invoice_composer_step_failed'>['failed_step'];

/**
 * The Invoice composer funnel. Only the kind of encounter, counts and yes/no flags are sent: no
 * Patient, no Invoice id and no amounts.
 */
export function useInvoiceComposerAnalytics({
  openedFor,
  currentLink,
}: {
  /** What the composer was opened for, from the address. */
  openedFor: InvoiceLink;
  /** The encounter kind chosen in the form now. */
  currentLink: () => InvoiceLink;
}) {
  const funnel = useFormFunnelAnalytics({
    active: true,
    onStarted: () => captureAnalyticsEvent('invoice_composer_started', { linked_to: openedFor }),
    onAbandoned: (seconds) =>
      captureAnalyticsEvent('invoice_composer_abandoned', {
        linked_to: currentLink(),
        seconds_since_started: seconds,
      }),
  });

  return {
    recordSubmitted: (submission: Submission) =>
      captureAnalyticsEvent('invoice_composer_submitted', {
        ...submission,
        seconds_since_started: funnel.secondsSinceStarted(),
      }),
    recordStepFailed: (step: ComposerStep, error: unknown) =>
      captureAnalyticsEvent('invoice_composer_step_failed', {
        failed_step: step,
        status: error instanceof ApiError ? error.status : undefined,
      }),
    /** Every chained call succeeded, so leaving now is not an abandonment. */
    recordCompleted: funnel.finish,
    recordInvalid: (errors: FieldErrors<CreateInvoiceFormValues>) =>
      captureAnalyticsEvent(
        'form_validation_failed',
        formValidationFailure('invoice_composer', errors)
      ),
  };
}
