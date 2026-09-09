import type { Dispatch } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ClinicalFinding } from '../../../_data/static-clinician-visits';
import type { AssessmentAction, AssessmentState } from '../_utils/assessment-state';
import { FindingControl } from './finding-control';
import { SectionHeading } from './section-heading';

function FindingsGrid({
  findings,
  target,
  dispatch,
  disabled,
}: {
  findings: ClinicalFinding[];
  target: 'ros' | 'exam';
  dispatch: Dispatch<AssessmentAction>;
  disabled: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-1 p-1.5">
      {findings.map((finding) => (
        <FindingControl
          disabled={disabled}
          dispatch={dispatch}
          finding={finding}
          key={finding.id}
          target={target}
        />
      ))}
    </div>
  );
}

export function ExamineColumn({
  state,
  dispatch,
}: {
  state: AssessmentState;
  dispatch: Dispatch<AssessmentAction>;
}) {
  const disabled = state.status === 'COMPLETED';
  const ayurvedaLabels = {
    prakriti: 'Prakriti',
    vikriti: 'Vikriti',
    ashtavidha: 'Ashtavidha',
  } as const;
  const markNormal = (target: 'ros' | 'exam') => (
    <Button
      disabled={disabled}
      onClick={() => dispatch({ type: 'mark-all-normal', target })}
      size="xs"
      type="button"
      variant="outline"
      className="h-5 px-1.5 text-[9px]"
    >
      Mark all normal
    </Button>
  );

  return (
    <Card className="shadow-fluent-2 flex min-h-0 flex-col overflow-hidden">
      <CardHeader className="h-12 shrink-0 border-b px-3 py-2">
        <CardTitle className="text-sm">Examine</CardTitle>
        <p className="text-muted-foreground text-[10px]">System review and clinical examination</p>
      </CardHeader>
      <CardContent className="grid min-h-0 flex-1 grid-rows-[auto_auto_auto] content-between gap-1.5 p-2">
        <section className="overflow-hidden rounded border">
          <SectionHeading action={markNormal('ros')} title="Review of Systems" />
          <FindingsGrid
            disabled={disabled}
            dispatch={dispatch}
            findings={state.ros}
            target="ros"
          />
        </section>

        <section className="overflow-hidden rounded border">
          <SectionHeading action={markNormal('exam')} title="Physical Examination" />
          <FindingsGrid
            disabled={disabled}
            dispatch={dispatch}
            findings={state.exam}
            target="exam"
          />
        </section>

        <section className="overflow-hidden rounded border">
          <SectionHeading title="Ayurveda Assessment" />
          <dl className="grid grid-cols-3 gap-1 p-1.5 text-[9px]">
            {Object.entries(state.ayurveda).map(([label, value]) => (
              <div className="min-w-0 rounded bg-muted/40 p-1" key={label}>
                <dt className="mb-0.5 text-muted-foreground">
                  {ayurvedaLabels[label as keyof typeof ayurvedaLabels]}
                </dt>
                <dd className="line-clamp-2 font-medium" title={value}>
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      </CardContent>
    </Card>
  );
}
