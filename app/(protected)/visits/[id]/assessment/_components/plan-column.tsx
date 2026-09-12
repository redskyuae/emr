import type { Dispatch, ReactNode } from 'react';
import { PlusIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
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

function WorkflowSection({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`overflow-hidden rounded-lg border ${className ?? ''}`}>
      <SectionHeading action={action} title={title} />
      <div className="space-y-3 p-4">{children}</div>
    </section>
  );
}

function OrdersContent({
  state,
  dispatch,
  disabled,
}: {
  state: AssessmentState;
  dispatch: Dispatch<AssessmentAction>;
  disabled: boolean;
}) {
  return (
    <div className="space-y-4">
      <WorkflowSection
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
          <span className="mb-1 block text-sm font-medium">Clinical Impression</span>
          <Textarea
            aria-label="Clinical Impression"
            className="min-h-20 resize-y"
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
      </WorkflowSection>

      <WorkflowSection
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
          <span className="mb-1 block text-sm font-medium">Advised Treatment</span>
          <Textarea
            aria-label="Advised Treatment"
            className="min-h-20 resize-y"
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
      </WorkflowSection>

      <WorkflowSection
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
      </WorkflowSection>

      <WorkflowSection
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
      </WorkflowSection>
    </div>
  );
}

function CompletionContent({
  state,
  dispatch,
  disabled,
}: {
  state: AssessmentState;
  dispatch: Dispatch<AssessmentAction>;
  disabled: boolean;
}) {
  return (
    <div className="grid items-start gap-4 lg:grid-cols-2">
      <WorkflowSection title="Medical Decision Making">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(10rem,1fr)]">
          <label>
            <span className="mb-1 block text-sm font-medium">Complexity</span>
            <Input
              aria-label="MDM complexity"
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
            <span className="mb-1 block text-sm font-medium">Risk</span>
            <NativeSelect
              aria-label="MDM risk"
              className="w-full"
              disabled={disabled}
              onChange={(event) =>
                dispatch({ type: 'update-mdm', field: 'risk', value: event.target.value })
              }
              value={state.mdm.risk}
            >
              {['Minimal', 'Low', 'Moderate', 'High'].map((risk) => (
                <NativeSelectOption key={risk}>{risk}</NativeSelectOption>
              ))}
            </NativeSelect>
          </label>
        </div>

        <fieldset>
          <legend className="mb-2 text-sm font-medium">Data reviewed</legend>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {mdmDataOptions.map((item) => (
              <label className="flex items-center gap-2 text-sm" key={item}>
                <Checkbox
                  checked={state.mdm.dataReviewed.includes(item)}
                  disabled={disabled}
                  onCheckedChange={() => dispatch({ type: 'toggle-mdm-data', item })}
                />
                {item}
              </label>
            ))}
          </div>
        </fieldset>
      </WorkflowSection>

      <WorkflowSection title="Addendum">
        <label>
          <span className="mb-1 block text-sm font-medium">Additional clinical note</span>
          <Textarea
            aria-label="Addendum"
            className="min-h-32 resize-y"
            disabled={disabled}
            onChange={(event) =>
              dispatch({ type: 'update-field', field: 'addendum', value: event.target.value })
            }
            placeholder="Optional note after assessment"
            value={state.addendum}
          />
        </label>
      </WorkflowSection>

      <WorkflowSection className="lg:col-span-2" title="Visit Completion">
        <div className="grid items-start gap-5 lg:grid-cols-3">
          <fieldset>
            <legend className="mb-2 text-sm font-medium">Patient Education</legend>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
              {educationOptions.map((item) => (
                <label className="flex items-center gap-2 text-sm" key={item}>
                  <Checkbox
                    checked={state.education.includes(item)}
                    disabled={disabled}
                    onCheckedChange={() => dispatch({ type: 'toggle-education', item })}
                  />
                  {item}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-3">
            {(
              [
                ['Presenting complaint', 'presentingComplaint'],
                ['Examination finding', 'examinationFinding'],
                ['Recommendation', 'recommendation'],
              ] as const
            ).map(([label, field]) => (
              <label key={field}>
                <span className="text-muted-foreground mb-1 block text-xs font-medium">
                  {label}
                </span>
                <Input
                  aria-label={label}
                  disabled={disabled}
                  onChange={(event) =>
                    dispatch({ type: 'update-field', field, value: event.target.value })
                  }
                  value={state[field]}
                />
              </label>
            ))}
          </div>

          <div className="grid gap-3">
            <label>
              <span className="mb-1 block text-sm font-medium">Discharge Disposition</span>
              <NativeSelect
                aria-label="Discharge Disposition"
                className="w-full"
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
                <NativeSelectOption value="">Select disposition</NativeSelectOption>
                <NativeSelectOption>Home or self-care</NativeSelectOption>
                <NativeSelectOption>Transfer to emergency</NativeSelectOption>
                <NativeSelectOption>Admit as inpatient</NativeSelectOption>
                <NativeSelectOption>Left against medical advice</NativeSelectOption>
              </NativeSelect>
            </label>
            <label>
              <span className="mb-1 block text-sm font-medium">Encounter end</span>
              <Input
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
        </div>
      </WorkflowSection>
    </div>
  );
}

export function PlanColumn({
  state,
  dispatch,
  view = 'orders',
}: {
  state: AssessmentState;
  dispatch: Dispatch<AssessmentAction>;
  view?: 'orders' | 'completion';
}) {
  const disabled = state.status === 'COMPLETED';
  const completing = view === 'completion';

  return (
    <Card className="shadow-fluent-2 gap-0 py-0">
      <CardHeader className="border-b py-4">
        <CardTitle className="text-lg">
          <h2>{completing ? 'Complete Visit' : 'Diagnosis & Orders'}</h2>
        </CardTitle>
        <CardDescription>
          {completing
            ? 'Review the Visit summary, Patient education, and discharge disposition.'
            : 'Document the clinical impression, treatment, procedures, and prescriptions.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        {completing ? (
          <CompletionContent disabled={disabled} dispatch={dispatch} state={state} />
        ) : (
          <OrdersContent disabled={disabled} dispatch={dispatch} state={state} />
        )}
      </CardContent>
    </Card>
  );
}
