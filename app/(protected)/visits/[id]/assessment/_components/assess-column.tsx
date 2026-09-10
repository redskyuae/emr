import type { Dispatch } from 'react';
import { PlusIcon, Trash2Icon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  dispatch,
}: {
  state: AssessmentState;
  dispatch: Dispatch<AssessmentAction>;
}) {
  const disabled = state.status === 'COMPLETED';

  return (
    <Card className="shadow-fluent-2 flex min-h-0 flex-col gap-0 overflow-hidden py-0">
      <CardHeader className="h-10 shrink-0 border-b px-3 py-1.5">
        <CardTitle className="text-sm">Assess</CardTitle>
        <p className="text-muted-foreground text-[10px]">Observations, complaint, and history</p>
      </CardHeader>
      <CardContent className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)_auto] gap-1.5 p-2">
        <section className="overflow-hidden rounded border">
          <SectionHeading title="Vital Signs" />
          <div className="grid grid-cols-3 gap-1 p-1.5">
            {vitalFields.map(([key, label, unit]) => (
              <label className="min-w-0" key={key}>
                <span className="text-muted-foreground mb-0.5 block text-[9px] font-medium">
                  {label} {unit && <span aria-hidden="true">· {unit}</span>}
                </span>
                <Input
                  className="h-7 px-1.5 text-[10px]"
                  disabled={disabled}
                  aria-label={`${label}${unit ? ` in ${unit}` : ''}`}
                  onChange={(event) =>
                    dispatch({ type: 'update-vital', field: key, value: event.target.value })
                  }
                  value={state.vitals[key]}
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
            <div className="grid min-h-0 grid-cols-2 content-start gap-x-2 gap-y-0.5 overflow-hidden text-[9px]">
              {Object.entries(state.hpiMeta).map(([label, value]) => (
                <label className="flex min-w-0 items-center gap-1" key={label}>
                  <span className="text-muted-foreground shrink-0 capitalize">
                    {label.replace(/([A-Z])/g, ' $1')}:
                  </span>
                  <input
                    aria-label={`HPI ${label.replace(/([A-Z])/g, ' $1')}`}
                    className="focus:border-ring min-w-0 flex-1 border-b border-transparent bg-transparent font-medium outline-none disabled:opacity-70"
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
              ))}
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded border">
          <SectionHeading title="Allergies & Problems" />
          <div className="space-y-1 p-1.5">
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ['Allergies', state.allergies, 'allergy'],
                  ['Problems', state.problems, 'problem'],
                ] as const
              ).map(([label, items, target]) => (
                <div className="min-w-0" key={target}>
                  <div className="mb-0.5 flex items-center justify-between">
                    <p className="text-destructive text-[8px] font-semibold">{label}</p>
                    <Button
                      aria-label={`Add ${target}`}
                      className="size-5"
                      disabled={disabled}
                      onClick={() =>
                        dispatch({ type: target === 'allergy' ? 'add-allergy' : 'add-problem' })
                      }
                      size="icon-xs"
                      type="button"
                      variant="ghost"
                    >
                      <PlusIcon aria-hidden="true" />
                    </Button>
                  </div>
                  <div className="grid gap-0.5">
                    {items.map((item, index) => (
                      <div className="grid grid-cols-[1fr_auto] gap-0.5" key={`${target}-${index}`}>
                        <input
                          aria-label={`${target === 'allergy' ? 'Allergy' : 'Problem'} ${index + 1}`}
                          className="border-input bg-background focus:border-ring h-5 min-w-0 rounded-sm border px-1 text-[8px] outline-none"
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
                          className="size-5"
                          disabled={disabled}
                          onClick={() =>
                            dispatch({
                              type: target === 'allergy' ? 'remove-allergy' : 'remove-problem',
                              index,
                            })
                          }
                          size="icon-xs"
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
            <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[9px]">
              {historyLabels.map(([key, label]) => (
                <label className="flex min-w-0 items-center gap-1" key={key}>
                  <span className="text-muted-foreground shrink-0">{label}:</span>
                  <input
                    aria-label={label}
                    className="focus:border-ring min-w-0 flex-1 border-b border-transparent bg-transparent font-medium outline-none disabled:opacity-70"
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
        </section>
      </CardContent>
    </Card>
  );
}
