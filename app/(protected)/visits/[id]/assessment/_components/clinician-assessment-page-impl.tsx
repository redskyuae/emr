'use client';

import { useReducer } from 'react';
import type { StaticClinicianVisit } from '../../../_data/static-clinician-visits';
import { assessmentReducer, createAssessmentState } from '../_utils/assessment-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AssessColumn } from './assess-column';
import { DesktopWorkspaceGuard } from './desktop-workspace-guard';
import { ExamineColumn } from './examine-column';
import { VisitSafetyStrip } from './visit-safety-strip';

export function ClinicianAssessmentPageImpl({ visit }: { visit: StaticClinicianVisit }) {
  const [state, dispatch] = useReducer(assessmentReducer, visit, createAssessmentState);

  return (
    <DesktopWorkspaceGuard>
      <main
        className="grid h-[calc(100svh-7rem)] min-h-0 grid-rows-[5rem_minmax(0,1fr)_3.5rem] gap-2 overflow-hidden"
        data-testid="clinician-cockpit"
      >
        <VisitSafetyStrip visit={visit} />

        <div className="grid min-h-0 grid-cols-3 gap-2">
          <AssessColumn dispatch={dispatch} state={state} visit={visit} />
          <ExamineColumn dispatch={dispatch} state={state} />
          <Card className="shadow-fluent-2 min-h-0 overflow-hidden">
            <CardHeader className="h-12 border-b px-3 py-2">
              <CardTitle className="text-sm">Plan</CardTitle>
              <p className="text-muted-foreground text-[10px]">Diagnosis, treatment, and completion</p>
            </CardHeader>
            <CardContent className="p-2" />
          </Card>
        </div>

        <div className="bg-card shadow-fluent-8 flex items-center rounded-lg border px-3 text-sm">
          Complete workflow actions
        </div>
      </main>
    </DesktopWorkspaceGuard>
  );
}
