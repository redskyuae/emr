import type { Dispatch, ReactNode } from 'react';
import { PlusIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { AssessmentAction, AssessmentState } from '../_utils/assessment-state';
import { CompactClinicalRow } from './compact-clinical-row';
import { SectionHeading } from './section-heading';

function AddButton({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      aria-label={`Add ${label}`}
      className="h-5 px-1.5 text-[9px]"
      disabled={disabled}
      onClick={onClick}
      size="xs"
      type="button"
      variant="outline"
    >
      <PlusIcon aria-hidden="true" />
      Add
    </Button>
  );
}

function CompactSection({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="min-h-0 overflow-hidden rounded border">
      <SectionHeading action={action} title={title} />
      <div className="space-y-1 p-1.5">{children}</div>
    </section>
  );
}

export function PlanColumn({
  state,
  dispatch,
}: {
  state: AssessmentState;
  dispatch: Dispatch<AssessmentAction>;
}) {
  const disabled = state.status === 'COMPLETED';

  return (
    <Card className="shadow-fluent-2 flex min-h-0 flex-col overflow-hidden">
      <CardHeader className="h-12 shrink-0 border-b px-3 py-2">
        <CardTitle className="text-sm">Plan</CardTitle>
        <p className="text-muted-foreground text-[10px]">Decisions, orders, and completion</p>
      </CardHeader>
      <CardContent className="grid min-h-0 flex-1 grid-cols-2 grid-rows-[auto_auto_auto_minmax(0,1fr)] gap-1.5 p-2">
        <CompactSection
          action={
            <AddButton
              disabled={disabled}
              label="diagnosis"
              onClick={() => dispatch({ type: 'add-diagnosis' })}
            />
          }
          title="Diagnosis"
        >
          <label>
            <span className="text-muted-foreground mb-0.5 block text-[9px]">
              Clinical Impression
            </span>
            <Textarea
              aria-label="Clinical Impression"
              className="h-10 min-h-0 resize-none px-1.5 py-1 text-[9px] leading-3"
              disabled={disabled}
              onChange={(event) =>
                dispatch({
                  type: 'update-field',
                  field: 'clinicalImpression',
                  value: event.target.value,
                })
              }
              value={state.clinicalImpression}
            />
          </label>
          {state.diagnoses.map((diagnosis) => (
            <CompactClinicalRow
              badge={
                diagnosis.primary ? <Badge className="h-4 px-1 text-[8px]">Primary</Badge> : null
              }
              detail={diagnosis.narrative}
              disabled={disabled}
              key={diagnosis.id}
              meta={[diagnosis.code, diagnosis.type].filter(Boolean).join(' · ')}
              onRemove={() => dispatch({ type: 'remove-diagnosis', id: diagnosis.id })}
              title={diagnosis.description}
            />
          ))}
        </CompactSection>

        <CompactSection
          action={
            <AddButton
              disabled={disabled}
              label="treatment"
              onClick={() => dispatch({ type: 'add-treatment' })}
            />
          }
          title="Treatment Plan"
        >
          <label>
            <span className="text-muted-foreground mb-0.5 block text-[9px]">Advised Treatment</span>
            <Textarea
              aria-label="Advised Treatment"
              className="h-10 min-h-0 resize-none px-1.5 py-1 text-[9px] leading-3"
              disabled={disabled}
              onChange={(event) =>
                dispatch({
                  type: 'update-field',
                  field: 'advisedTreatment',
                  value: event.target.value,
                })
              }
              value={state.advisedTreatment}
            />
          </label>
          {state.treatments.map((treatment) => (
            <CompactClinicalRow
              badge={
                <Badge variant="outline" className="h-4 px-1 text-[8px]">
                  {treatment.status}
                </Badge>
              }
              detail={treatment.summary}
              disabled={disabled}
              key={treatment.id}
              meta={`${treatment.sessions} session`}
              onRemove={() => dispatch({ type: 'remove-treatment', id: treatment.id })}
              title={treatment.service}
            />
          ))}
        </CompactSection>

        <CompactSection
          action={
            <AddButton
              disabled={disabled}
              label="OP Procedure"
              onClick={() => dispatch({ type: 'add-procedure' })}
            />
          }
          title="OP Procedure"
        >
          {state.procedures.map((procedure) => (
            <CompactClinicalRow
              detail={procedure.notes}
              disabled={disabled}
              key={procedure.id}
              meta={[procedure.code, `Qty ${procedure.quantity}`].filter(Boolean).join(' · ')}
              onRemove={() => dispatch({ type: 'remove-procedure', id: procedure.id })}
              title={procedure.description}
            />
          ))}
        </CompactSection>

        <CompactSection
          action={
            <AddButton
              disabled={disabled}
              label="prescription"
              onClick={() => dispatch({ type: 'add-prescription' })}
            />
          }
          title="Prescription"
        >
          {state.prescriptions.map((prescription) => (
            <CompactClinicalRow
              detail={prescription.instruction}
              disabled={disabled}
              key={prescription.id}
              meta={`${prescription.dose} ${prescription.unit} · ${prescription.route} · ${prescription.frequency} · ${prescription.duration}`}
              onRemove={() => dispatch({ type: 'remove-prescription', id: prescription.id })}
              title={prescription.medicine}
            />
          ))}
        </CompactSection>

        <CompactSection title="Medical Decision Making">
          <dl className="grid gap-1 text-[9px]">
            <div>
              <dt className="text-muted-foreground">Complexity</dt>
              <dd className="truncate font-medium">{state.mdm.problemComplexity}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Data reviewed</dt>
              <dd className="truncate font-medium">{state.mdm.dataReviewed.join(' · ')}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Risk</dt>
              <dd>
                <Badge variant="secondary" className="h-4 px-1 text-[8px]">
                  {state.mdm.risk}
                </Badge>
              </dd>
            </div>
          </dl>
        </CompactSection>

        <CompactSection title="Addendum">
          <Textarea
            aria-label="Addendum"
            className="h-[4.25rem] min-h-0 resize-none px-1.5 py-1 text-[9px] leading-3"
            disabled={disabled}
            onChange={(event) =>
              dispatch({ type: 'update-field', field: 'addendum', value: event.target.value })
            }
            placeholder="Optional note after assessment"
            value={state.addendum}
          />
        </CompactSection>

        <section className="col-span-2 min-h-0 overflow-hidden rounded border">
          <SectionHeading title="Visit Completion" />
          <div className="grid grid-cols-[1fr_1fr_0.8fr] gap-1.5 p-1.5">
            <div className="min-w-0">
              <p className="text-muted-foreground mb-1 text-[9px]">Patient Education</p>
              <div className="flex flex-wrap gap-1">
                {state.education.map((item) => (
                  <Badge className="h-4 px-1 text-[8px]" key={item} variant="secondary">
                    ✓ {item}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="grid min-w-0 gap-1 text-[9px]">
              <p className="truncate">
                <span className="text-muted-foreground">Complaint:</span>{' '}
                {state.presentingComplaint}
              </p>
              <p className="truncate">
                <span className="text-muted-foreground">Finding:</span> {state.examinationFinding}
              </p>
              <p className="truncate">
                <span className="text-muted-foreground">Recommendation:</span>{' '}
                {state.recommendation}
              </p>
            </div>
            <label className="min-w-0">
              <span className="text-muted-foreground mb-0.5 block text-[9px]">
                Discharge Disposition
              </span>
              <select
                aria-label="Discharge Disposition"
                className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-7 w-full rounded-md border px-1.5 text-[9px] outline-none focus-visible:ring-2 disabled:opacity-50"
                disabled={disabled}
                onChange={(event) =>
                  dispatch({
                    type: 'update-field',
                    field: 'dischargeDisposition',
                    value: event.target.value,
                  })
                }
                value={state.dischargeDisposition}
              >
                <option value="">Select disposition</option>
                <option>Home or self-care</option>
                <option>Transfer to emergency</option>
                <option>Admit as inpatient</option>
                <option>Left against medical advice</option>
              </select>
              <Input
                className="mt-1 h-7 px-1.5 text-[9px]"
                disabled
                value={state.encounterEnd}
                aria-label="Encounter end"
              />
            </label>
          </div>
        </section>
      </CardContent>
    </Card>
  );
}
