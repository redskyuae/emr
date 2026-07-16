'use client';

import { useEffect } from 'react';
import { useForm, type UseFormRegister } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import type { PatientVitalSign } from '@/app/api/lib/modules/patient-vital-sign/schemas/patient-vital-sign-schema';
import { getApiErrors, getApiErrorMessage } from '@/app/queries/api-error';
import { useCreatePatientVitalSign } from '@/app/queries/patients/chart/useCreatePatientVitalSign';
import { useUpdatePatientVitalSign } from '@/app/queries/patients/chart/useUpdatePatientVitalSign';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useChartFormServerErrors } from '../use-chart-form-server-errors';

import {
  vitalsFormDefaults,
  vitalsFormSchema,
  type VitalsFormValues,
} from '../../../_utils/vitals-form-schema';
import { ChartFormSheetShell } from './chart-form-sheet-shell';

type NumericKey = Exclude<keyof VitalsFormValues, 'recordedAt' | 'notes'>;

const NUMERIC_KEYS: NumericKey[] = [
  'systolic',
  'diastolic',
  'pulseBpm',
  'respRate',
  'temperatureC',
  'spo2',
  'heightCm',
  'weightKg',
  'painScore',
];

const emptyToUndefined = (value: string) => (value.trim() === '' ? undefined : value.trim());
const emptyToNumber = (value: string) => (value.trim() === '' ? undefined : Number(value));

function VitalNumberField({
  id,
  label,
  unit,
  register,
  error,
  disabled,
}: {
  id: NumericKey;
  label: string;
  unit?: string;
  register: UseFormRegister<VitalsFormValues>;
  error?: string;
  disabled: boolean;
}) {
  return (
    <Field data-invalid={!!error}>
      <FieldLabel htmlFor={`vital-${id}`}>
        {label}
        {unit ? <span className="text-muted-foreground"> ({unit})</span> : null}
      </FieldLabel>
      <Input
        id={`vital-${id}`}
        inputMode="decimal"
        {...register(id)}
        disabled={disabled}
        aria-invalid={!!error}
      />
      <FieldError errors={error ? [{ message: error }] : []} />
    </Field>
  );
}

export function VitalsFormSheet({
  open,
  mode,
  patientId,
  vitalSign,
  onClose,
}: {
  open: boolean;
  mode: 'new' | 'edit';
  patientId: number;
  vitalSign: PatientVitalSign | null;
  onClose: () => void;
}) {
  const { serverErrors, setServerErrors, clearServerErrors } = useChartFormServerErrors();
  const form = useForm<VitalsFormValues>({
    resolver: zodResolver(vitalsFormSchema),
    mode: 'onTouched',
    defaultValues: vitalsFormDefaults,
  });

  const {
    register,
    reset,
    formState: { errors },
  } = form;

  useEffect(() => {
    if (!open) {
      return;
    }
    clearServerErrors();
    if (mode === 'edit' && vitalSign) {
      const num = (value: number | null) => (value === null ? '' : String(value));
      reset({
        recordedAt: vitalSign.recordedAt ? String(vitalSign.recordedAt).slice(0, 16) : '',
        heightCm: num(vitalSign.heightCm),
        weightKg: num(vitalSign.weightKg),
        systolic: num(vitalSign.systolic),
        diastolic: num(vitalSign.diastolic),
        pulseBpm: num(vitalSign.pulseBpm),
        respRate: num(vitalSign.respRate),
        temperatureC: num(vitalSign.temperatureC),
        spo2: num(vitalSign.spo2),
        painScore: num(vitalSign.painScore),
        notes: vitalSign.notes ?? '',
      });
    } else {
      reset(vitalsFormDefaults);
    }
  }, [open, mode, vitalSign, reset, clearServerErrors]);

  const createMutation = useCreatePatientVitalSign();
  const updateMutation = useUpdatePatientVitalSign();
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const handleSave = form.handleSubmit(async (values) => {
    clearServerErrors();
    const body = {
      recordedAt: emptyToUndefined(values.recordedAt),
      heightCm: emptyToNumber(values.heightCm),
      weightKg: emptyToNumber(values.weightKg),
      systolic: emptyToNumber(values.systolic),
      diastolic: emptyToNumber(values.diastolic),
      pulseBpm: emptyToNumber(values.pulseBpm),
      respRate: emptyToNumber(values.respRate),
      temperatureC: emptyToNumber(values.temperatureC),
      spo2: emptyToNumber(values.spo2),
      painScore: emptyToNumber(values.painScore),
      notes: emptyToUndefined(values.notes),
    };

    try {
      if (mode === 'edit' && vitalSign) {
        await updateMutation.mutateAsync({ patientId, vitalId: vitalSign.id, body });
        toast.success('Vital signs updated.');
      } else {
        await createMutation.mutateAsync({ patientId, body });
        toast.success('Vital signs recorded.');
      }
      onClose();
    } catch (error) {
      setServerErrors(getApiErrors(error));
      toast.error(getApiErrorMessage(error));
    }
  });

  const labels: Record<NumericKey, { label: string; unit?: string }> = {
    systolic: { label: 'Systolic', unit: 'mmHg' },
    diastolic: { label: 'Diastolic', unit: 'mmHg' },
    pulseBpm: { label: 'Pulse', unit: 'bpm' },
    respRate: { label: 'Resp. rate', unit: '/min' },
    temperatureC: { label: 'Temperature', unit: '°C' },
    spo2: { label: 'SpO₂', unit: '%' },
    heightCm: { label: 'Height', unit: 'cm' },
    weightKg: { label: 'Weight', unit: 'kg' },
    painScore: { label: 'Pain score', unit: '0–10' },
  };

  return (
    <ChartFormSheetShell
      open={open}
      title={mode === 'edit' ? 'Edit Vital Signs' : 'Record Vital Signs'}
      description={
        mode === 'edit'
          ? 'Update this set of Vital Signs. BMI is recomputed from height and weight.'
          : 'Record a set of Vital Signs. Enter at least one measurement; BMI is computed automatically.'
      }
      serverErrors={serverErrors}
      isSaving={isSaving}
      onSave={() => void handleSave()}
      onClose={onClose}
    >
      <Field data-invalid={!!errors.recordedAt}>
        <FieldLabel htmlFor="vital-recordedAt">Recorded at</FieldLabel>
        <Input
          id="vital-recordedAt"
          type="datetime-local"
          {...register('recordedAt')}
          disabled={isSaving}
        />
        <FieldError errors={[errors.recordedAt]} />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        {NUMERIC_KEYS.map((key) => (
          <VitalNumberField
            key={key}
            id={key}
            label={labels[key].label}
            unit={labels[key].unit}
            register={register}
            error={errors[key]?.message}
            disabled={isSaving}
          />
        ))}
      </div>

      <Field data-invalid={!!errors.notes}>
        <FieldLabel htmlFor="vital-notes">Notes</FieldLabel>
        <Textarea
          id="vital-notes"
          {...register('notes')}
          disabled={isSaving}
          rows={3}
          maxLength={2000}
        />
        <FieldError errors={[errors.notes]} />
      </Field>
    </ChartFormSheetShell>
  );
}
