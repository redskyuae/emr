import type { Dispatch, ReactNode } from 'react';
import { PlusIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { AssessmentAction, AssessmentState } from '../_utils/assessment-state';
import {
  DiagnosisEditor,
  PrescriptionEditor,
  ProcedureEditor,
  TreatmentEditor,
} from './editable-clinical-rows';
import { SectionHeading } from './section-heading';

const mdmDataOptions = ['Previous Visit', 'Medication list', 'Pulse oximetry'];
const educationOptions = [
  'Medication technique',
  'Warning signs',
  'Diet and hydration',
  'Exercise goals',
  'Preventive screening',
];

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
    <section className="min-h-0 rounded border">
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
    <Card className="shadow-fluent-2 flex min-h-0 flex-col gap-0 overflow-hidden py-0">
      <CardHeader className="h-10 shrink-0 border-b px-3 py-1.5">
        <CardTitle className="text-sm">Plan</CardTitle>
        <p className="text-muted-foreground text-[10px]">Decisions, orders, and completion</p>
      </CardHeader>
      <CardContent className="grid min-h-0 flex-1 grid-cols-2 grid-rows-[auto_auto_auto_minmax(0,1fr)] gap-1.5 p-2 [@media(max-height:900px)]:auto-rows-max [@media(max-height:900px)]:grid-rows-none [@media(max-height:900px)]:content-start [@media(max-height:900px)]:overflow-y-auto">
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
              className="h-8 min-h-0 resize-none px-1.5 py-1 text-[9px] leading-3"
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
            <DiagnosisEditor
              disabled={disabled}
              dispatch={dispatch}
              key={diagnosis.id}
              row={diagnosis}
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
              className="h-8 min-h-0 resize-none px-1.5 py-1 text-[9px] leading-3"
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
            <TreatmentEditor
              disabled={disabled}
              dispatch={dispatch}
              key={treatment.id}
              row={treatment}
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
            <ProcedureEditor
              disabled={disabled}
              dispatch={dispatch}
              key={procedure.id}
              row={procedure}
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
            <PrescriptionEditor
              disabled={disabled}
              dispatch={dispatch}
              key={prescription.id}
              row={prescription}
            />
          ))}
        </CompactSection>

        <CompactSection title="Medical Decision Making">
          <div className="grid grid-cols-[1fr_3.25rem] gap-1">
            <label>
              <span className="text-muted-foreground block text-[7px]">Complexity</span>
              <Input
                aria-label="MDM complexity"
                className="h-5 rounded-sm px-1 text-[8px]"
                disabled={disabled}
                onChange={(event) =>
                  dispatch({
                    type: 'update-mdm',
                    field: 'problemComplexity',
                    value: event.target.value,
                  })
                }
                value={state.mdm.problemComplexity}
              />
            </label>
            <label>
              <span className="text-muted-foreground block text-[7px]">Risk</span>
              <select
                aria-label="MDM risk"
                className="border-input bg-background h-5 w-full rounded-sm border px-0.5 text-[8px]"
                disabled={disabled}
                onChange={(event) =>
                  dispatch({ type: 'update-mdm', field: 'risk', value: event.target.value })
                }
                value={state.mdm.risk}
              >
                {['Minimal', 'Low', 'Moderate', 'High'].map((risk) => (
                  <option key={risk}>{risk}</option>
                ))}
              </select>
            </label>
          </div>
          <fieldset>
            <legend className="text-muted-foreground text-[7px]">Data reviewed</legend>
            <div className="flex flex-wrap gap-x-2 gap-y-0.5">
              {mdmDataOptions.map((item) => (
                <label className="flex items-center gap-0.5 text-[8px]" key={item}>
                  <input
                    checked={state.mdm.dataReviewed.includes(item)}
                    disabled={disabled}
                    onChange={() => dispatch({ type: 'toggle-mdm-data', item })}
                    type="checkbox"
                  />
                  {item}
                </label>
              ))}
            </div>
          </fieldset>
        </CompactSection>

        <CompactSection title="Addendum">
          <Textarea
            aria-label="Addendum"
            className="h-12 min-h-0 resize-none px-1.5 py-1 text-[9px] leading-3"
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
          <div className="grid grid-cols-[0.8fr_1.35fr_1fr] gap-1.5 p-1.5">
            <div className="min-w-0">
              <p className="text-muted-foreground mb-1 text-[9px]">Patient Education</p>
              <div className="grid grid-cols-2 gap-x-1 gap-y-0.5">
                {educationOptions.map((item) => (
                  <label className="flex items-center gap-1 text-[8px]" key={item}>
                    <input
                      checked={state.education.includes(item)}
                      disabled={disabled}
                      onChange={() => dispatch({ type: 'toggle-education', item })}
                      type="checkbox"
                    />
                    {item}
                  </label>
                ))}
              </div>
            </div>
            <div className="grid min-w-0 gap-0.5">
              {(
                [
                  ['Presenting complaint', 'presentingComplaint'],
                  ['Examination finding', 'examinationFinding'],
                  ['Recommendation', 'recommendation'],
                ] as const
              ).map(([label, field]) => (
                <label key={field} className="grid grid-cols-[4.75rem_1fr] items-center gap-1">
                  <span className="text-muted-foreground text-[7px]">{label}</span>
                  <Input
                    aria-label={label}
                    className="h-5 rounded-sm px-1 text-[8px]"
                    disabled={disabled}
                    onChange={(event) =>
                      dispatch({ type: 'update-field', field, value: event.target.value })
                    }
                    value={state[field]}
                  />
                </label>
              ))}
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
                aria-label="Encounter end"
                disabled={disabled}
                onChange={(event) =>
                  dispatch({
                    type: 'update-field',
                    field: 'encounterEnd',
                    value: event.target.value,
                  })
                }
                value={state.encounterEnd}
              />
            </label>
          </div>
        </section>
      </CardContent>
    </Card>
  );
}
