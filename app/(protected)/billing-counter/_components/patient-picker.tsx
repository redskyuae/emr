import { Badge } from '@/components/ui/badge';
import { NativeSelect } from '@/components/ui/native-select';
import { COUNTER_PATIENTS } from '../_data/counter-seed';
import { formatAed } from '../_utils/money';
import type { CounterPatient } from '../_utils/counter-types';
import { CounterField } from './counter-field';

export function PatientPicker({
  id,
  mrn,
  onChange,
}: {
  id: string;
  mrn: string;
  onChange: (mrn: string) => void;
}) {
  return (
    <CounterField label="Patient" htmlFor={id} required>
      <NativeSelect
        id={id}
        className="w-full"
        aria-required="true"
        value={mrn}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">Select a Patient…</option>
        {COUNTER_PATIENTS.map((patient) => (
          <option key={patient.mrn} value={patient.mrn}>
            {patient.name} · {patient.mrn} · {patient.payer ?? 'Self-pay'}
          </option>
        ))}
      </NativeSelect>
    </CounterField>
  );
}

export function PatientStrip({
  patient,
  advanceBalance,
  visitLabel,
}: {
  patient: CounterPatient;
  advanceBalance: number;
  visitLabel?: string;
}) {
  return (
    <div className="bg-muted/50 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-md border px-3 py-2 text-sm">
      <span className="font-heading font-semibold">{patient.name}</span>
      <span className="text-muted-foreground text-xs">
        MRN <span className="text-foreground font-mono">{patient.mrn}</span>
      </span>
      <span className="text-muted-foreground text-xs">
        Category <span className="text-foreground">{patient.category}</span>
      </span>
      <Badge variant={patient.payer ? 'default' : 'secondary'}>{patient.payer ?? 'Self-pay'}</Badge>
      <span className="text-muted-foreground text-xs">
        Advance{' '}
        <span className="text-foreground font-medium tabular-nums">
          AED {formatAed(advanceBalance)}
        </span>
      </span>
      {patient.memberId ? (
        <span className="text-muted-foreground text-xs">
          Member ID <span className="text-foreground font-mono">{patient.memberId}</span>
        </span>
      ) : null}
      {visitLabel ? <span className="text-muted-foreground text-xs">{visitLabel}</span> : null}
    </div>
  );
}
