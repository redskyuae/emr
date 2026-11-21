'use client';

import { useEffect, useEffectEvent, useRef } from 'react';

import type { VisitStatus } from '@/app/api/lib/modules/visit/schemas/visit-schema';
import { captureAnalyticsEvent } from '@/lib/analytics/analytics-client';

import { consultationStepTransition } from '../_utils/consultation-step-analytics';
import type { ConsultationStepId } from '../_utils/consultation-steps';

/** Records `consultation_step_viewed` each time the step in the URL changes, with the time spent on the one before. */
export function useConsultationStepAnalytics({
  stepId,
  visitStatus,
  isAyurvedaBrand,
}: {
  stepId: ConsultationStepId;
  visitStatus: VisitStatus;
  isAyurvedaBrand: boolean;
}) {
  const lastView = useRef<{ step: ConsultationStepId; shownAt: number } | null>(null);

  const recordView = useEffectEvent((step: ConsultationStepId) => {
    // Also absorbs React strict mode running the effect twice for the same step.
    if (lastView.current?.step === step) return;

    const now = Date.now();
    const { previousStep, secondsOnPreviousStep } = consultationStepTransition(
      lastView.current,
      now
    );
    lastView.current = { step, shownAt: now };

    captureAnalyticsEvent('consultation_step_viewed', {
      step,
      visit_status: visitStatus,
      previous_step: previousStep,
      is_ayurveda_brand: isAyurvedaBrand,
      seconds_on_previous_step: secondsOnPreviousStep,
    });
  });

  useEffect(() => {
    recordView(stepId);
  }, [stepId]);
}
