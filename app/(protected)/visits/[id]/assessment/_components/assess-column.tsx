import type { Dispatch } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { StaticClinicianVisit } from '../../../_data/static-clinician-visits';
import type { AssessmentAction, AssessmentState } from '../_utils/assessment-state';
import { SectionHeading } from './section-heading';

const vitalFields = [
  ['temperature', 'Temp', '°C'],
  ['systolic', 'BP sys', 'mmHg'],
  ['diastolic', 'BP dia', 'mmHg'],
  ['pulse', 'Pulse', 'bpm'],
  ['respiratoryRate', 'Resp', '/min'],
  ['spo2', 'SpO₂', '%'],
  ['oxygen', 'Oxygen', ''],
  ['height', 'Height', 'cm'],
  ['weight', 'Weight', 'kg'],
] as const;

const historyLabels = [
  ['smoking', 'Smoking'],
  ['activity', 'Physical activity'],
  ['family', 'Family history'],
  ['social', 'Social history'],
] as const;

export function AssessColumn({
  state,
  visit,
  dispatch,
}: {
  state: AssessmentState;
  visit: StaticClinicianVisit;
  dispatch: Dispatch<AssessmentAction>;
}) {
  const disabled = state.status === 'COMPLETED';

  return (
    <Card className="shadow-fluent-2 flex min-h-0 flex-col overflow-hidden">
      <CardHeader className="h-12 shrink-0 border-b px-3 py-2">
        <CardTitle className="text-sm">Assess</CardTitle>
        <p className="text-muted-foreground text-[10px]">Observations, complaint, and history</p>
      </CardHeader>
      <CardContent className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)_auto] gap-1.5 p-2">
        <section className="overflow-hidden rounded border">
          <SectionHeading title="Vital Signs" />
          <div className="grid grid-cols-3 gap-1 p-1.5">
            {vitalFields.map(([key, label, unit]) => (
              <label className="min-w-0" key={key}>
                <span className="mb-0.5 block text-[9px] font-medium text-muted-foreground">
                  {label} {unit && <span aria-hidden="true">· {unit}</span>}
                </span>
                <Input
                  className="h-7 px-1.5 text-[10px]"
                  defaultValue={state.vitals[key]}
                  disabled={disabled}
                  aria-label={`${label}${unit ? ` in ${unit}` : ''}`}
                />
              </label>
            ))}
          </div>
        </section>

        <section className="min-h-0 overflow-hidden rounded border">
          <SectionHeading title="History of Present Illness" />
          <div className="grid h-[calc(100%-1.75rem)] min-h-0 grid-rows-[auto_auto_1fr] gap-1 p-1.5">
            <label>
              <span className="sr-only">Chief complaint</span>
              <Input
                aria-label="Chief complaint"
                className="h-7 px-2 text-[10px] font-medium"
                disabled={disabled}
                onChange={(event) =>
                  dispatch({ type: 'update-field', field: 'chiefComplaint', value: event.target.value })
                }
                value={state.chiefComplaint}
              />
            </label>
            <label>
              <span className="sr-only">HPI narrative</span>
              <Textarea
                aria-label="HPI narrative"
                className="h-12 min-h-0 resize-none px-2 py-1 text-[10px] leading-4"
                disabled={disabled}
                onChange={(event) =>
                  dispatch({ type: 'update-field', field: 'hpi', value: event.target.value })
                }
                value={state.hpi}
              />
            </label>
            <dl className="grid min-h-0 grid-cols-2 content-start gap-x-2 gap-y-0.5 overflow-hidden text-[9px]">
              {Object.entries(state.hpiMeta).map(([label, value]) => (
                <div className="flex min-w-0 gap-1" key={label}>
                  <dt className="shrink-0 capitalize text-muted-foreground">
                    {label.replace(/([A-Z])/g, ' $1')}:
                  </dt>
                  <dd className="truncate font-medium" title={value}>
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="overflow-hidden rounded border">
          <SectionHeading title="Allergies & Problems" />
          <div className="space-y-1 p-1.5">
            <div className="flex flex-wrap gap-1">
              {visit.allergies.map((allergy) => (
                <Badge key={allergy} variant="destructive" className="h-5 px-1.5 text-[9px]">
                  Allergy · {allergy}
                </Badge>
              ))}
              {state.problems.map((problem) => (
                <Badge key={problem} variant="secondary" className="h-5 px-1.5 text-[9px]">
                  {problem}
                </Badge>
              ))}
            </div>
            <dl className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[9px]">
              {historyLabels.map(([key, label]) => (
                <div className="flex min-w-0 gap-1" key={key}>
                  <dt className="shrink-0 text-muted-foreground">{label}:</dt>
                  <dd className="truncate font-medium" title={state.historySummary[key]}>
                    {state.historySummary[key]}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      </CardContent>
    </Card>
  );
}
