'use client';

import { useReducer, useState } from 'react';
import type { StaticClinicianVisit } from '../../../_data/static-clinician-visits';
import {
  assessmentReducer,
  canCompleteAssessment,
  createAssessmentState,
} from '../_utils/assessment-state';
import { AssessColumn } from './assess-column';
import { AssessmentCommandBar } from './assessment-command-bar';
import { DesktopWorkspaceGuard } from './desktop-workspace-guard';
import { ExamineColumn } from './examine-column';
import { PlanColumn } from './plan-column';
import { VisitSafetyStrip } from './visit-safety-strip';

export function ClinicianAssessmentPageImpl({ visit }: { visit: StaticClinicianVisit }) {
  const [state, dispatch] = useReducer(assessmentReducer, visit, createAssessmentState);
  const [completionErrors, setCompletionErrors] = useState<string[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);

  function validateCompletion() {
    const validation = canCompleteAssessment(state);
    setCompletionErrors(validation.errors);
    setConfirmOpen(validation.valid);
  }

  return (
    <DesktopWorkspaceGuard>
      <section
        aria-label="Clinician Visit cockpit"
        className="grid h-[calc(100svh-7.5rem)] min-h-0 grid-rows-[4rem_minmax(0,1fr)_3.5rem] gap-2 overflow-hidden"
        data-testid="clinician-cockpit"
      >
        <VisitSafetyStrip allergies={state.allergies} status={state.status} visit={visit} />

        <div className="grid min-h-0 grid-cols-3 gap-2">
          <AssessColumn dispatch={dispatch} state={state} />
          <ExamineColumn dispatch={dispatch} state={state} />
          <PlanColumn dispatch={dispatch} state={state} />
        </div>

        <AssessmentCommandBar
          confirmOpen={confirmOpen}
          dispatch={dispatch}
          errors={completionErrors}
          onConfirmOpenChange={setConfirmOpen}
          onValidate={validateCompletion}
          state={state}
        />
      </section>
    </DesktopWorkspaceGuard>
  );
}
