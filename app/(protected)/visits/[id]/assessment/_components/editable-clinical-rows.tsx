import type { Dispatch, InputHTMLAttributes } from 'react';
import { Trash2Icon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type {
  DiagnosisRow,
  PrescriptionRow,
  ProcedureRow,
  TreatmentRow,
} from '../../../_data/static-clinician-visits';
import type { AssessmentAction } from '../_utils/assessment-state';

function MiniField({
  label,
  className,
  ...props
}: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={`min-w-0 ${className ?? ''}`}>
      <span className="text-muted-foreground block text-[7px] leading-2">{label}</span>
      <Input
        className="h-5 max-w-full min-w-0 rounded-sm px-1 text-[8px]"
        aria-label={label}
        {...props}
      />
    </label>
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
    <label className="flex items-center gap-1 text-[8px] font-medium">
      <input
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
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
    <div className="bg-background grid gap-0.5 rounded border p-1">
      <div className="grid grid-cols-[3.5rem_1fr_3.25rem] gap-1">
        <MiniField
          label="Code"
          value={row.code}
          disabled={disabled}
          onChange={(e) => update('code', e.target.value)}
        />
        <MiniField
          label="Diagnosis"
          value={row.description}
          disabled={disabled}
          onChange={(e) => update('description', e.target.value)}
        />
        <MiniField
          label="Type"
          value={row.type}
          disabled={disabled}
          onChange={(e) => update('type', e.target.value)}
        />
      </div>
      <div className="grid grid-cols-[3.25rem_1fr_auto] items-end gap-1">
        <MiniField
          label="Onset year"
          value={row.onsetYear}
          disabled={disabled}
          onChange={(e) => update('onsetYear', e.target.value)}
        />
        <MiniField
          label="Narrative"
          value={row.narrative}
          disabled={disabled}
          onChange={(e) => update('narrative', e.target.value)}
        />
        <Button
          aria-label={`Remove ${row.description}`}
          className="size-5"
          disabled={disabled}
          onClick={() => dispatch({ type: 'remove-diagnosis', id: row.id })}
          size="icon-xs"
          type="button"
          variant="ghost"
        >
          <Trash2Icon aria-hidden="true" />
        </Button>
      </div>
      <div className="flex gap-3">
        <ToggleField
          label="Primary"
          checked={row.primary}
          disabled={disabled}
          onChange={(value) => update('primary', value)}
        />
        <ToggleField
          label="Reason for Visit"
          checked={row.reasonForVisit}
          disabled={disabled}
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
    <div className="bg-background grid gap-0.5 rounded border p-1">
      <div className="grid grid-cols-[1fr_2.5rem_3.5rem] gap-1">
        <MiniField
          label="Treatment"
          value={row.service}
          disabled={disabled}
          onChange={(e) => update('service', e.target.value)}
        />
        <MiniField
          label="Sessions"
          value={row.sessions}
          disabled={disabled}
          onChange={(e) => update('sessions', e.target.value)}
        />
        <MiniField
          label="Status"
          value={row.status}
          disabled={disabled}
          onChange={(e) => update('status', e.target.value)}
        />
      </div>
      <div className="grid grid-cols-[1fr_auto] items-end gap-1">
        <MiniField
          label="Summary"
          value={row.summary}
          disabled={disabled}
          onChange={(e) => update('summary', e.target.value)}
        />
        <Button
          aria-label={`Remove ${row.service}`}
          className="size-5"
          disabled={disabled}
          onClick={() => dispatch({ type: 'remove-treatment', id: row.id })}
          size="icon-xs"
          type="button"
          variant="ghost"
        >
          <Trash2Icon aria-hidden="true" />
        </Button>
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
    <div className="bg-background grid gap-0.5 rounded border p-1">
      <div className="grid grid-cols-[3.25rem_1fr_2rem] gap-1">
        <MiniField
          label="Code"
          value={row.code}
          disabled={disabled}
          onChange={(e) => update('code', e.target.value)}
        />
        <MiniField
          label="Procedure"
          value={row.description}
          disabled={disabled}
          onChange={(e) => update('description', e.target.value)}
        />
        <MiniField
          label="Qty"
          value={row.quantity}
          disabled={disabled}
          onChange={(e) => update('quantity', e.target.value)}
        />
      </div>
      <div className="grid grid-cols-[1fr_auto] items-end gap-1">
        <MiniField
          label="Notes"
          value={row.notes}
          disabled={disabled}
          onChange={(e) => update('notes', e.target.value)}
        />
        <Button
          aria-label={`Remove ${row.description}`}
          className="size-5"
          disabled={disabled}
          onClick={() => dispatch({ type: 'remove-procedure', id: row.id })}
          size="icon-xs"
          type="button"
          variant="ghost"
        >
          <Trash2Icon aria-hidden="true" />
        </Button>
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
    <div className="bg-background grid gap-0.5 rounded border p-1">
      <div className="grid grid-cols-[1fr_2.5rem_3rem] gap-1">
        <MiniField
          label="Medicine"
          value={row.medicine}
          disabled={disabled}
          onChange={(e) => update('medicine', e.target.value)}
        />
        <MiniField
          label="Unit"
          value={row.unit}
          disabled={disabled}
          onChange={(e) => update('unit', e.target.value)}
        />
        <MiniField
          label="Route"
          value={row.route}
          disabled={disabled}
          onChange={(e) => update('route', e.target.value)}
        />
      </div>
      <div className="grid grid-cols-[2rem_1fr_3rem_2rem_2rem] gap-1">
        <MiniField
          label="Dose"
          value={row.dose}
          disabled={disabled}
          onChange={(e) => update('dose', e.target.value)}
        />
        <MiniField
          label="Frequency"
          value={row.frequency}
          disabled={disabled}
          onChange={(e) => update('frequency', e.target.value)}
        />
        <MiniField
          label="Duration"
          value={row.duration}
          disabled={disabled}
          onChange={(e) => update('duration', e.target.value)}
        />
        <MiniField
          label="Refill"
          value={row.refill}
          disabled={disabled}
          onChange={(e) => update('refill', e.target.value)}
        />
        <MiniField
          label="Qty"
          value={row.quantity}
          disabled={disabled}
          onChange={(e) => update('quantity', e.target.value)}
        />
      </div>
      <div className="grid grid-cols-[3rem_3rem_1fr_auto] items-end gap-1">
        <MiniField
          label="Start"
          value={row.startDate}
          disabled={disabled}
          onChange={(e) => update('startDate', e.target.value)}
        />
        <MiniField
          label="End"
          value={row.endDate}
          disabled={disabled}
          onChange={(e) => update('endDate', e.target.value)}
        />
        <MiniField
          label="Instructions"
          value={row.instruction}
          disabled={disabled}
          onChange={(e) => update('instruction', e.target.value)}
        />
        <Button
          aria-label={`Remove ${row.medicine}`}
          className="size-5"
          disabled={disabled}
          onClick={() => dispatch({ type: 'remove-prescription', id: row.id })}
          size="icon-xs"
          type="button"
          variant="ghost"
        >
          <Trash2Icon aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
