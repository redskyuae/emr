import type { Dispatch, InputHTMLAttributes } from 'react';
import { Trash2Icon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type {
  DiagnosisRow,
  PrescriptionRow,
  ProcedureRow,
  TreatmentRow,
} from '../../../_data/static-clinician-visits';
import type { AssessmentAction } from '../_utils/assessment-state';

function ClinicalField({
  label,
  className,
  ...props
}: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={cn('min-w-0', className)}>
      <span className="text-muted-foreground mb-1 block text-xs font-medium">{label}</span>
      <Input aria-label={label} {...props} />
    </label>
  );
}

function RowHeader({
  label,
  onRemove,
  disabled,
}: {
  label: string;
  onRemove: () => void;
  disabled: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b pb-2">
      <p className="text-sm font-semibold">{label}</p>
      <Button
        aria-label={`Remove ${label}`}
        disabled={disabled}
        onClick={onRemove}
        size="xs"
        type="button"
        variant="ghost"
      >
        <Trash2Icon aria-hidden="true" />
        Remove
      </Button>
    </div>
  );
}

function ToggleField({
  label,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm font-medium">
      <Checkbox
        checked={checked}
        disabled={disabled}
        onCheckedChange={(value) => onChange(value === true)}
      />
      {label}
    </label>
  );
}

export function DiagnosisEditor({
  row,
  disabled,
  dispatch,
}: {
  row: DiagnosisRow;
  disabled: boolean;
  dispatch: Dispatch<AssessmentAction>;
}) {
  const update = (field: keyof Omit<DiagnosisRow, 'id'>, value: string | boolean) =>
    dispatch({ type: 'update-diagnosis', id: row.id, field, value });

  return (
    <div className="bg-background space-y-3 rounded-lg border p-3">
      <RowHeader
        disabled={disabled}
        label={row.description || 'New diagnosis'}
        onRemove={() => dispatch({ type: 'remove-diagnosis', id: row.id })}
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <ClinicalField
          className="lg:col-span-1"
          disabled={disabled}
          label="Code"
          onChange={(event) => update('code', event.target.value)}
          value={row.code}
        />
        <ClinicalField
          className="lg:col-span-3"
          disabled={disabled}
          label="Diagnosis"
          onChange={(event) => update('description', event.target.value)}
          value={row.description}
        />
        <ClinicalField
          className="lg:col-span-2"
          disabled={disabled}
          label="Type"
          onChange={(event) => update('type', event.target.value)}
          value={row.type}
        />
        <ClinicalField
          className="lg:col-span-1"
          disabled={disabled}
          label="Onset year"
          onChange={(event) => update('onsetYear', event.target.value)}
          value={row.onsetYear}
        />
        <ClinicalField
          className="sm:col-span-2 lg:col-span-5"
          disabled={disabled}
          label="Narrative"
          onChange={(event) => update('narrative', event.target.value)}
          value={row.narrative}
        />
      </div>
      <div className="flex flex-wrap gap-4">
        <ToggleField
          checked={row.primary}
          disabled={disabled}
          label="Primary"
          onChange={(value) => update('primary', value)}
        />
        <ToggleField
          checked={row.reasonForVisit}
          disabled={disabled}
          label="Reason for Visit"
          onChange={(value) => update('reasonForVisit', value)}
        />
      </div>
    </div>
  );
}

export function TreatmentEditor({
  row,
  disabled,
  dispatch,
}: {
  row: TreatmentRow;
  disabled: boolean;
  dispatch: Dispatch<AssessmentAction>;
}) {
  const update = (field: keyof Omit<TreatmentRow, 'id'>, value: string) =>
    dispatch({ type: 'update-treatment', id: row.id, field, value });

  return (
    <div className="bg-background space-y-3 rounded-lg border p-3">
      <RowHeader
        disabled={disabled}
        label={row.service || 'New treatment'}
        onRemove={() => dispatch({ type: 'remove-treatment', id: row.id })}
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ClinicalField
          className="lg:col-span-2"
          disabled={disabled}
          label="Treatment"
          onChange={(event) => update('service', event.target.value)}
          value={row.service}
        />
        <ClinicalField
          disabled={disabled}
          label="Sessions"
          onChange={(event) => update('sessions', event.target.value)}
          value={row.sessions}
        />
        <ClinicalField
          disabled={disabled}
          label="Status"
          onChange={(event) => update('status', event.target.value)}
          value={row.status}
        />
        <ClinicalField
          className="sm:col-span-2 lg:col-span-4"
          disabled={disabled}
          label="Summary"
          onChange={(event) => update('summary', event.target.value)}
          value={row.summary}
        />
      </div>
    </div>
  );
}

export function ProcedureEditor({
  row,
  disabled,
  dispatch,
}: {
  row: ProcedureRow;
  disabled: boolean;
  dispatch: Dispatch<AssessmentAction>;
}) {
  const update = (field: keyof Omit<ProcedureRow, 'id'>, value: string) =>
    dispatch({ type: 'update-procedure', id: row.id, field, value });

  return (
    <div className="bg-background space-y-3 rounded-lg border p-3">
      <RowHeader
        disabled={disabled}
        label={row.description || 'New OP Procedure'}
        onRemove={() => dispatch({ type: 'remove-procedure', id: row.id })}
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ClinicalField
          disabled={disabled}
          label="Code"
          onChange={(event) => update('code', event.target.value)}
          value={row.code}
        />
        <ClinicalField
          className="lg:col-span-2"
          disabled={disabled}
          label="Procedure"
          onChange={(event) => update('description', event.target.value)}
          value={row.description}
        />
        <ClinicalField
          disabled={disabled}
          label="Quantity"
          onChange={(event) => update('quantity', event.target.value)}
          value={row.quantity}
        />
        <ClinicalField
          className="sm:col-span-2 lg:col-span-4"
          disabled={disabled}
          label="Notes"
          onChange={(event) => update('notes', event.target.value)}
          value={row.notes}
        />
      </div>
    </div>
  );
}

export function PrescriptionEditor({
  row,
  disabled,
  dispatch,
}: {
  row: PrescriptionRow;
  disabled: boolean;
  dispatch: Dispatch<AssessmentAction>;
}) {
  const update = (field: keyof Omit<PrescriptionRow, 'id'>, value: string) =>
    dispatch({ type: 'update-prescription', id: row.id, field, value });

  return (
    <div className="bg-background space-y-3 rounded-lg border p-3">
      <RowHeader
        disabled={disabled}
        label={row.medicine || 'New prescription'}
        onRemove={() => dispatch({ type: 'remove-prescription', id: row.id })}
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ClinicalField
          className="sm:col-span-2"
          disabled={disabled}
          label="Medicine"
          onChange={(event) => update('medicine', event.target.value)}
          value={row.medicine}
        />
        <ClinicalField
          disabled={disabled}
          label="Unit"
          onChange={(event) => update('unit', event.target.value)}
          value={row.unit}
        />
        <ClinicalField
          disabled={disabled}
          label="Route"
          onChange={(event) => update('route', event.target.value)}
          value={row.route}
        />
        <ClinicalField
          disabled={disabled}
          label="Dose"
          onChange={(event) => update('dose', event.target.value)}
          value={row.dose}
        />
        <ClinicalField
          disabled={disabled}
          label="Frequency"
          onChange={(event) => update('frequency', event.target.value)}
          value={row.frequency}
        />
        <ClinicalField
          disabled={disabled}
          label="Duration"
          onChange={(event) => update('duration', event.target.value)}
          value={row.duration}
        />
        <ClinicalField
          disabled={disabled}
          label="Refill"
          onChange={(event) => update('refill', event.target.value)}
          value={row.refill}
        />
        <ClinicalField
          disabled={disabled}
          label="Quantity"
          onChange={(event) => update('quantity', event.target.value)}
          value={row.quantity}
        />
        <ClinicalField
          disabled={disabled}
          label="Start date"
          onChange={(event) => update('startDate', event.target.value)}
          value={row.startDate}
        />
        <ClinicalField
          disabled={disabled}
          label="End date"
          onChange={(event) => update('endDate', event.target.value)}
          value={row.endDate}
        />
        <ClinicalField
          className="sm:col-span-2 lg:col-span-4"
          disabled={disabled}
          label="Instructions"
          onChange={(event) => update('instruction', event.target.value)}
          value={row.instruction}
        />
      </div>
    </div>
  );
}
