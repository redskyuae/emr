import type { Dispatch } from 'react';
import { PlusIcon, Trash2Icon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { AssessmentAction, AssessmentState } from '../_utils/assessment-state';
import { SectionHeading } from './section-heading';

const vitalFields = [
  ['temperature', 'Temperature', '°C'],
  ['systolic', 'Systolic BP', 'mmHg'],
  ['diastolic', 'Diastolic BP', 'mmHg'],
  ['pulse', 'Pulse', 'bpm'],
  ['respiratoryRate', 'Respiratory rate', '/min'],
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
  dispatch,
}: {
  state: AssessmentState;
  dispatch: Dispatch<AssessmentAction>;
}) {
  const disabled = state.status === 'COMPLETED';

  return (
    <Card className="shadow-fluent-2 gap-0 py-0">
      <CardHeader className="border-b py-4">
        <CardTitle className="text-lg">
          <h2>Intake</h2>
        </CardTitle>
        <CardDescription>
          Record observations, the presenting complaint, and history.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 p-4">
        <section className="overflow-hidden rounded-lg border">
          <SectionHeading title="Vital Signs" />
          <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-5">
            {vitalFields.map(([key, label, unit]) => (
              <label className="min-w-0" key={key}>
                <span className="text-muted-foreground mb-1 block text-xs font-medium">
                  {label} {unit ? <span aria-hidden="true">· {unit}</span> : null}
                </span>
                <Input
                  aria-label={`${label}${unit ? ` in ${unit}` : ''}`}
                  disabled={disabled}
                  onChange={(event) =>
                    dispatch({ type: 'update-vital', field: key, value: event.target.value })
                  }
                  value={state.vitals[key]}
                />
              </label>
            ))}
          </div>
        </section>

        <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(20rem,1fr)]">
          <section className="overflow-hidden rounded-lg border">
            <SectionHeading title="History of Present Illness" />
            <div className="space-y-4 p-4">
              <label>
                <span className="mb-1 block text-sm font-medium">Chief complaint</span>
                <Input
                  aria-label="Chief complaint"
                  disabled={disabled}
                  onChange={(event) =>
                    dispatch({
                      type: 'update-field',
                      field: 'chiefComplaint',
                      value: event.target.value,
                    })
                  }
                  value={state.chiefComplaint}
                />
              </label>

              <label>
                <span className="mb-1 block text-sm font-medium">HPI narrative</span>
                <Textarea
                  aria-label="HPI narrative"
                  className="min-h-28 resize-y"
                  disabled={disabled}
                  onChange={(event) =>
                    dispatch({ type: 'update-field', field: 'hpi', value: event.target.value })
                  }
                  value={state.hpi}
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                {Object.entries(state.hpiMeta).map(([label, value]) => {
                  const displayLabel = label.replace(/([A-Z])/g, ' $1');

                  return (
                    <label className="min-w-0" key={label}>
                      <span className="text-muted-foreground mb-1 block text-xs font-medium capitalize">
                        {displayLabel}
                      </span>
                      <Input
                        aria-label={`HPI ${displayLabel}`}
                        disabled={disabled}
                        onChange={(event) =>
                          dispatch({
                            type: 'update-hpi-meta',
                            field: label as keyof AssessmentState['hpiMeta'],
                            value: event.target.value,
                          })
                        }
                        value={value}
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-lg border">
            <SectionHeading title="Allergies & Problems" />
            <div className="space-y-5 p-4">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                {(
                  [
                    ['Allergies', state.allergies, 'allergy'],
                    ['Problems', state.problems, 'problem'],
                  ] as const
                ).map(([label, items, target]) => (
                  <div className="min-w-0" key={target}>
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p
                        className={
                          target === 'allergy' ? 'text-destructive font-semibold' : 'font-semibold'
                        }
                      >
                        {label}
                      </p>
                      <Button
                        aria-label={`Add ${target}`}
                        disabled={disabled}
                        onClick={() =>
                          dispatch({ type: target === 'allergy' ? 'add-allergy' : 'add-problem' })
                        }
                        size="xs"
                        type="button"
                        variant="outline"
                      >
                        <PlusIcon aria-hidden="true" />
                        Add
                      </Button>
                    </div>
                    <div className="grid gap-2">
                      {items.map((item, index) => (
                        <div
                          className="grid grid-cols-[minmax(0,1fr)_auto] gap-2"
                          key={`${target}-${index}`}
                        >
                          <Input
                            aria-label={`${target === 'allergy' ? 'Allergy' : 'Problem'} ${index + 1}`}
                            disabled={disabled}
                            onChange={(event) =>
                              dispatch({
                                type: target === 'allergy' ? 'update-allergy' : 'update-problem',
                                index,
                                value: event.target.value,
                              })
                            }
                            value={item}
                          />
                          <Button
                            aria-label={`Remove ${target} ${index + 1}`}
                            disabled={disabled}
                            onClick={() =>
                              dispatch({
                                type: target === 'allergy' ? 'remove-allergy' : 'remove-problem',
                                index,
                              })
                            }
                            size="icon"
                            type="button"
                            variant="ghost"
                          >
                            <Trash2Icon aria-hidden="true" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4">
                <p className="mb-3 text-sm font-semibold">Relevant history</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {historyLabels.map(([key, label]) => (
                    <label className="min-w-0" key={key}>
                      <span className="text-muted-foreground mb-1 block text-xs font-medium">
                        {label}
                      </span>
                      <Input
                        aria-label={label}
                        disabled={disabled}
                        onChange={(event) =>
                          dispatch({
                            type: 'update-history-summary',
                            field: key,
                            value: event.target.value,
                          })
                        }
                        value={state.historySummary[key]}
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </CardContent>
    </Card>
  );
}
