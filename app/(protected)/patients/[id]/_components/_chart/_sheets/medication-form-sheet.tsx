'use client';

import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import type { PatientMedication } from '@/app/api/lib/modules/patient-medication/schemas/patient-medication-schema';
import { getApiErrors, getApiErrorMessage } from '@/app/queries/api-error';
import { useCreatePatientMedication } from '@/app/queries/patients/chart/useCreatePatientMedication';
import { useUpdatePatientMedication } from '@/app/queries/patients/chart/useUpdatePatientMedication';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useChartFormServerErrors } from '../use-chart-form-server-errors';

import { MEDICATION_STATUS_OPTIONS } from '../../../_utils/chart-value-sets';
import {
  medicationFormDefaults,
  medicationFormSchema,
  type MedicationFormValues,
} from '../../../_utils/medication-form-schema';
import { ChartFormSheetShell } from './chart-form-sheet-shell';

const emptyToUndefined = (value: string) => (value.trim() === '' ? undefined : value.trim());

export function MedicationFormSheet({
  open,
  mode,
  patientId,
  medication,
  onClose,
}: {
  open: boolean;
  mode: 'new' | 'edit';
  patientId: number;
  medication: PatientMedication | null;
  onClose: () => void;
}) {
  const { serverErrors, setServerErrors, clearServerErrors } = useChartFormServerErrors();
  const form = useForm<MedicationFormValues>({
    resolver: zodResolver(medicationFormSchema),
    mode: 'onTouched',
    defaultValues: medicationFormDefaults,
  });

  const {
    control,
    register,
    reset,
    formState: { errors },
  } = form;

  useEffect(() => {
    if (!open) {
      return;
    }
    clearServerErrors();
    if (mode === 'edit' && medication) {
      reset({
        drugName: medication.drugName,
        dose: medication.dose ?? '',
        route: medication.route ?? '',
        frequency: medication.frequency ?? '',
        status: medication.status,
        startDate: medication.startDate ?? '',
        endDate: medication.endDate ?? '',
        notes: medication.notes ?? '',
      });
    } else {
      reset(medicationFormDefaults);
    }
  }, [open, mode, medication, reset, clearServerErrors]);

  const createMutation = useCreatePatientMedication();
  const updateMutation = useUpdatePatientMedication();
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const handleSave = form.handleSubmit(async (values) => {
    clearServerErrors();
    const body = {
      drugName: values.drugName.trim(),
      dose: emptyToUndefined(values.dose),
      route: emptyToUndefined(values.route),
      frequency: emptyToUndefined(values.frequency),
      status: values.status,
      startDate: emptyToUndefined(values.startDate),
      endDate: emptyToUndefined(values.endDate),
      notes: emptyToUndefined(values.notes),
    };

    try {
      if (mode === 'edit' && medication) {
        await updateMutation.mutateAsync({ patientId, medicationId: medication.id, body });
        toast.success('Medication updated.');
      } else {
        await createMutation.mutateAsync({ patientId, body });
        toast.success('Medication added.');
      }
      onClose();
    } catch (error) {
      setServerErrors(getApiErrors(error));
      toast.error(getApiErrorMessage(error));
    }
  });

  return (
    <ChartFormSheetShell
      open={open}
      title={mode === 'edit' ? 'Edit Medication' : 'Add Medication'}
      description={
        mode === 'edit'
          ? 'Update this medication list entry.'
          : "Add a medication to this Patient's list."
      }
      serverErrors={serverErrors}
      isSaving={isSaving}
      onSave={() => void handleSave()}
      onClose={onClose}
    >
      <Field data-invalid={!!errors.drugName}>
        <FieldLabel htmlFor="medication-drug">
          Drug name{' '}
          <span aria-hidden="true" className="text-destructive">
            *
          </span>
        </FieldLabel>
        <Input
          id="medication-drug"
          {...register('drugName')}
          disabled={isSaving}
          maxLength={200}
          placeholder="e.g. Metformin"
          aria-required="true"
          aria-invalid={!!errors.drugName}
        />
        <FieldError errors={[errors.drugName]} />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field data-invalid={!!errors.dose}>
          <FieldLabel htmlFor="medication-dose">Dose</FieldLabel>
          <Input
            id="medication-dose"
            {...register('dose')}
            disabled={isSaving}
            maxLength={100}
            placeholder="e.g. 500 mg"
          />
          <FieldError errors={[errors.dose]} />
        </Field>

        <Field data-invalid={!!errors.route}>
          <FieldLabel htmlFor="medication-route">Route</FieldLabel>
          <Input
            id="medication-route"
            {...register('route')}
            disabled={isSaving}
            maxLength={50}
            placeholder="e.g. oral"
          />
          <FieldError errors={[errors.route]} />
        </Field>

        <Field data-invalid={!!errors.frequency}>
          <FieldLabel htmlFor="medication-frequency">Frequency</FieldLabel>
          <Input
            id="medication-frequency"
            {...register('frequency')}
            disabled={isSaving}
            maxLength={100}
            placeholder="e.g. BID"
          />
          <FieldError errors={[errors.frequency]} />
        </Field>

        <Controller
          control={control}
          name="status"
          render={({ field }) => (
            <Field>
              <FieldLabel htmlFor="medication-status">Status</FieldLabel>
              <Select value={field.value} onValueChange={field.onChange} disabled={isSaving}>
                <SelectTrigger id="medication-status" className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {MEDICATION_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
        />

        <Field data-invalid={!!errors.startDate}>
          <FieldLabel htmlFor="medication-start">Start date</FieldLabel>
          <Input id="medication-start" type="date" {...register('startDate')} disabled={isSaving} />
          <FieldError errors={[errors.startDate]} />
        </Field>

        <Field data-invalid={!!errors.endDate}>
          <FieldLabel htmlFor="medication-end">End date</FieldLabel>
          <Input id="medication-end" type="date" {...register('endDate')} disabled={isSaving} />
          <FieldError errors={[errors.endDate]} />
        </Field>
      </div>

      <Field data-invalid={!!errors.notes}>
        <FieldLabel htmlFor="medication-notes">Notes</FieldLabel>
        <Textarea
          id="medication-notes"
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
