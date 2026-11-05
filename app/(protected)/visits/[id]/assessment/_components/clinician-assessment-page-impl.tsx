'use client';

import { useEffect, useReducer, useRef, useState } from 'react';
import type { StaticClinicianVisit } from '../../../_data/static-clinician-visits';
import {
  assessmentReducer,
  canCompleteAssessment,
  createAssessmentState,
} from '../_utils/assessment-state';
import { AssessColumn } from './assess-column';
import { AssessmentCommandBar } from './assessment-command-bar';
import { consultationSteps, ConsultationProgress } from './consultation-progress';
import { ExamineColumn } from './examine-column';
import { PlanColumn } from './plan-column';
import { VisitSafetyStrip } from './visit-safety-strip';

export function ClinicianAssessmentPageImpl({ visit }: { visit: StaticClinicianVisit }) {
  const [state, dispatch] = useReducer(assessmentReducer, visit, createAssessmentState);
  const [completionErrors, setCompletionErrors] = useState<string[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const stepContentRef = useRef<HTMLElement>(null);
  const shouldFocusStepRef = useRef(false);

  useEffect(() => {
    if (!shouldFocusStepRef.current) {
      return;
    }

    shouldFocusStepRef.current = false;
    stepContentRef.current?.scrollIntoView?.({ block: 'start' });
    stepContentRef.current?.focus({ preventScroll: true });
  }, [currentStep]);

  function moveToStep(step: number) {
    if (step < 0 || step >= consultationSteps.length || step === currentStep) {
      return;
    }

    shouldFocusStepRef.current = true;
    setCurrentStep(step);
    setCompletionErrors([]);
  }

  function validateCompletion() {
    const validation = canCompleteAssessment(state);
    setCompletionErrors(validation.errors);
    setConfirmOpen(validation.valid);
  }

  return (
    <section
      aria-label="Clinician Visit consultation"
      className="mx-auto w-full max-w-screen-2xl space-y-4 pb-4"
      data-testid="clinician-consultation"
    >
      <VisitSafetyStrip allergies={state.allergies} status={state.status} visit={visit} />

      <ConsultationProgress currentStep={currentStep} onStepChange={moveToStep} />

      <section
        aria-label={consultationSteps[currentStep].label}
        className="ring-offset-background focus-visible:ring-ring scroll-mt-96 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:scroll-mt-80 lg:scroll-mt-60 xl:scroll-mt-44"
        ref={stepContentRef}
        tabIndex={-1}
      >
        {currentStep === 0 ? <AssessColumn dispatch={dispatch} state={state} /> : null}
        {currentStep === 1 ? <ExamineColumn dispatch={dispatch} state={state} /> : null}
        {currentStep === 2 ? <PlanColumn dispatch={dispatch} state={state} view="orders" /> : null}
        {currentStep === 3 ? (
          <PlanColumn dispatch={dispatch} state={state} view="completion" />
        ) : null}
      </section>

      <AssessmentCommandBar
        confirmOpen={confirmOpen}
        currentStep={currentStep}
        dispatch={dispatch}
        errors={completionErrors}
        onConfirmOpenChange={setConfirmOpen}
        onNext={() => moveToStep(currentStep + 1)}
        onPrevious={() => moveToStep(currentStep - 1)}
        onValidate={validateCompletion}
        state={state}
        stepCount={consultationSteps.length}
      />
    </section>
  );
}
