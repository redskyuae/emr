'use client';

import type { FieldErrors } from 'react-hook-form';

import { useFormFunnelAnalytics } from '@/hooks/use-form-funnel-analytics';
import { captureAnalyticsEvent } from '@/lib/analytics/analytics-client';
import type { AnalyticsEventProperties } from '@/lib/analytics/catalogue';
import { formValidationFailure } from '@/lib/analytics/form-validation';

import type { PatientFormValues } from '../_utils/patient-form-schema';

type PatientFormMode = AnalyticsEventProperties<'patient_form_started'>['mode'];

/**
 * The Patient form funnel for Registration and edit. `mode` is `null` until the form is on
 * screen. Only the mode, whether an Emirates ID was given, durations and field names are sent.
 */
export function usePatientFormAnalytics(mode: PatientFormMode | null) {
  const funnel = useFormFunnelAnalytics({
    active: mode !== null,
    onStarted: () => {
      if (mode) captureAnalyticsEvent('patient_form_started', { mode });
    },
    onAbandoned: (seconds) => {
      if (mode) {
        captureAnalyticsEvent('patient_form_abandoned', { mode, seconds_since_started: seconds });
      }
    },
  });

  return {
    /** A valid submit, before the save request. */
    recordSubmitted: (values: PatientFormValues) => {
      if (!mode) return;

      captureAnalyticsEvent('patient_form_submitted', {
        mode,
        has_emirates_id: values.hasEmiratesId,
        seconds_since_started: funnel.secondsSinceStarted(),
      });
    },
    /** The save succeeded, so leaving the form now is not an abandonment. */
    recordSaved: funnel.finish,
    recordInvalid: (errors: FieldErrors<PatientFormValues>) => {
      captureAnalyticsEvent(
        'form_validation_failed',
        formValidationFailure(mode === 'register' ? 'patient_registration' : 'patient_edit', errors)
      );
    },
  };
}
