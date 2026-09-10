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
    <div className="grid grid-cols-2 gap-0.5 p-1">
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
    <Card className="shadow-fluent-2 flex min-h-0 flex-col gap-0 overflow-hidden py-0">
      <CardHeader className="h-10 shrink-0 border-b px-3 py-1.5">
        <CardTitle className="text-sm">Examine</CardTitle>
        <p className="text-muted-foreground text-[9px]">
          Patient report vs Doctor findings · ✓ Normal · ⚠ Abnormal
        </p>
      </CardHeader>
      <CardContent className="grid min-h-0 flex-1 grid-rows-[auto_auto_auto] content-between gap-1 p-2 [@media(max-height:900px)]:auto-rows-max [@media(max-height:900px)]:grid-rows-none [@media(max-height:900px)]:content-start [@media(max-height:900px)]:overflow-y-auto">
        <section className="rounded border">
          <SectionHeading
            action={markNormal('ros')}
            context="Patient-reported symptoms"
            title="Review of Systems"
          />
          <FindingsGrid disabled={disabled} dispatch={dispatch} findings={state.ros} target="ros" />
        </section>

        <section className="rounded border">
          <SectionHeading
            action={markNormal('exam')}
            context="Doctor-observed signs"
            title="Physical Examination"
          />
          <FindingsGrid
            disabled={disabled}
            dispatch={dispatch}
            findings={state.exam}
            target="exam"
          />
        </section>

        <section className="rounded border">
          <SectionHeading title="Ayurveda Assessment" />
          <div className="grid grid-cols-3 gap-1 p-1 text-[8px]">
            {Object.entries(state.ayurveda).map(([label, value]) => (
              <label className="bg-muted/40 min-w-0 rounded p-0.5" key={label}>
                <span className="text-muted-foreground block leading-2">
                  {ayurvedaLabels[label as keyof typeof ayurvedaLabels]}
                </span>
                <textarea
                  aria-label={ayurvedaLabels[label as keyof typeof ayurvedaLabels]}
                  className="focus:ring-ring h-4 w-full resize-none bg-transparent text-[7px] leading-2 font-medium outline-none focus:ring-1 disabled:opacity-70"
                  disabled={disabled}
                  onChange={(event) =>
                    dispatch({
                      type: 'update-ayurveda',
                      field: label as keyof AssessmentState['ayurveda'],
                      value: event.target.value,
                    })
                  }
                  value={value}
                />
              </label>
            ))}
          </div>
        </section>
      </CardContent>
    </Card>
  );
}
