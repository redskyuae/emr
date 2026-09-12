import type { Dispatch } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
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
    <div className="grid gap-2 p-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
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

  function markNormal(target: 'ros' | 'exam') {
    return (
      <Button
        disabled={disabled}
        onClick={() => dispatch({ type: 'mark-all-normal', target })}
        size="xs"
        type="button"
        variant="outline"
      >
        Mark all normal
      </Button>
    );
  }

  return (
    <Card className="shadow-fluent-2 gap-0 py-0">
      <CardHeader className="border-b py-4">
        <CardTitle className="text-lg">
          <h2>Examination</h2>
        </CardTitle>
        <CardDescription>
          Review patient-reported symptoms separately from Doctor-observed findings.
        </CardDescription>
      </CardHeader>

      <CardContent className="grid items-start gap-4 p-4 xl:grid-cols-2">
        <section className="overflow-hidden rounded-lg border">
          <SectionHeading
            action={markNormal('ros')}
            context="Patient-reported symptoms"
            title="Review of Systems"
          />
          <FindingsGrid disabled={disabled} dispatch={dispatch} findings={state.ros} target="ros" />
        </section>

        <section className="overflow-hidden rounded-lg border">
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

        <section className="overflow-hidden rounded-lg border xl:col-span-2">
          <SectionHeading title="Ayurveda Assessment" />
          <div className="grid gap-3 p-4 md:grid-cols-3">
            {Object.entries(state.ayurveda).map(([label, value]) => (
              <label className="min-w-0" key={label}>
                <span className="mb-1 block text-sm font-medium">
                  {ayurvedaLabels[label as keyof typeof ayurvedaLabels]}
                </span>
                <Textarea
                  aria-label={ayurvedaLabels[label as keyof typeof ayurvedaLabels]}
                  className="min-h-20 resize-y"
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
