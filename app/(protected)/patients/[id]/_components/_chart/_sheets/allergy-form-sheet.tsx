'use client';

import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import type { PatientAllergy } from '@/app/api/lib/modules/patient-allergy/schemas/patient-allergy-schema';
import { getApiErrors, getApiErrorMessage } from '@/app/queries/api-error';
import { useCreatePatientAllergy } from '@/app/queries/patients/chart/useCreatePatientAllergy';
import { useUpdatePatientAllergy } from '@/app/queries/patients/chart/useUpdatePatientAllergy';
import { useAllergensQuery } from '@/app/queries/clinical-masters/allergens/useAllergens';
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

import { ALLERGY_SEVERITY_OPTIONS, ALLERGY_STATUS_OPTIONS } from '../../../_utils/chart-value-sets';
import {
  allergyFormDefaults,
  allergyFormSchema,
  type AllergyFormValues,
} from '../../../_utils/allergy-form-schema';
import { ChartFormSheetShell } from './chart-form-sheet-shell';

const emptyToUndefined = (value: string) => (value.trim() === '' ? undefined : value.trim());

export function AllergyFormSheet({
  open,
  mode,
  patientId,
  allergy,
  onClose,
}: {
  open: boolean;
  mode: 'new' | 'edit';
  patientId: number;
  allergy: PatientAllergy | null;
  onClose: () => void;
}) {
  const allergensQuery = useAllergensQuery({ limit: 200 });
  const allergenOptions = allergensQuery.data?.data ?? [];

  const { serverErrors, setServerErrors, clearServerErrors } = useChartFormServerErrors();
  const form = useForm<AllergyFormValues>({
    resolver: zodResolver(allergyFormSchema),
    mode: 'onTouched',
    defaultValues: allergyFormDefaults,
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
    if (mode === 'edit' && allergy) {
      reset({
        allergenId: allergy.allergenId ? String(allergy.allergenId) : '',
        substance: allergy.substance ?? '',
        reaction: allergy.reaction ?? '',
        severity: allergy.severity,
        status: allergy.status,
        notedOn: allergy.notedOn ?? '',
        notes: allergy.notes ?? '',
      });
    } else {
      reset(allergyFormDefaults);
    }
  }, [open, mode, allergy, reset, clearServerErrors]);

  const createMutation = useCreatePatientAllergy();
  const updateMutation = useUpdatePatientAllergy();
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const handleSave = form.handleSubmit(async (values) => {
    clearServerErrors();
    const body = {
      allergenId: values.allergenId === '' ? undefined : Number(values.allergenId),
      substance: emptyToUndefined(values.substance),
      reaction: emptyToUndefined(values.reaction),
      severity: values.severity,
      status: values.status,
      notedOn: emptyToUndefined(values.notedOn),
      notes: emptyToUndefined(values.notes),
    };

    try {
      if (mode === 'edit' && allergy) {
        await updateMutation.mutateAsync({ patientId, allergyId: allergy.id, body });
        toast.success('Allergy updated.');
      } else {
        await createMutation.mutateAsync({ patientId, body });
        toast.success('Allergy recorded.');
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
      title={mode === 'edit' ? 'Edit Allergy' : 'Record Allergy'}
      description={
        mode === 'edit'
          ? 'Update this Patient Allergy.'
          : 'Record a new Allergy for this Patient. Provide a catalogued allergen or a free-text substance.'
      }
      serverErrors={serverErrors}
      isSaving={isSaving}
      onSave={() => void handleSave()}
      onClose={onClose}
    >
      <Controller
        control={control}
        name="allergenId"
        render={({ field }) => (
          <Field>
            <FieldLabel htmlFor="allergy-allergen">Allergen</FieldLabel>
            <Select
              value={field.value === '' ? undefined : field.value}
              onValueChange={field.onChange}
              disabled={isSaving}
            >
              <SelectTrigger id="allergy-allergen" className="w-full">
                <SelectValue placeholder="Select a catalogued allergen (optional)" />
              </SelectTrigger>
              <SelectContent>
                {allergenOptions.map((option) => (
                  <SelectItem key={option.id} value={String(option.id)}>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        )}
      />

      <Field data-invalid={!!errors.substance}>
        <FieldLabel htmlFor="allergy-substance">Substance (free text)</FieldLabel>
        <Input
          id="allergy-substance"
          {...register('substance')}
          disabled={isSaving}
          maxLength={150}
          placeholder="e.g. Shellfish"
          aria-invalid={!!errors.substance}
        />
        <FieldError errors={[errors.substance]} />
      </Field>

      <Field data-invalid={!!errors.reaction}>
        <FieldLabel htmlFor="allergy-reaction">Reaction</FieldLabel>
        <Input
          id="allergy-reaction"
          {...register('reaction')}
          disabled={isSaving}
          maxLength={255}
          placeholder="e.g. Hives, swelling"
          aria-invalid={!!errors.reaction}
        />
        <FieldError errors={[errors.reaction]} />
      </Field>

      <Controller
        control={control}
        name="severity"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="allergy-severity">
              Severity{' '}
              <span aria-hidden="true" className="text-destructive">
                *
              </span>
            </FieldLabel>
            <Select value={field.value} onValueChange={field.onChange} disabled={isSaving}>
              <SelectTrigger
                id="allergy-severity"
                className="w-full"
                aria-required="true"
                aria-invalid={fieldState.invalid}
              >
                <SelectValue placeholder="Select severity" />
              </SelectTrigger>
              <SelectContent>
                {ALLERGY_SEVERITY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />

      <Controller
        control={control}
        name="status"
        render={({ field }) => (
          <Field>
            <FieldLabel htmlFor="allergy-status">Status</FieldLabel>
            <Select value={field.value} onValueChange={field.onChange} disabled={isSaving}>
              <SelectTrigger id="allergy-status" className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {ALLERGY_STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        )}
      />

      <Field data-invalid={!!errors.notedOn}>
        <FieldLabel htmlFor="allergy-noted-on">Noted on</FieldLabel>
        <Input id="allergy-noted-on" type="date" {...register('notedOn')} disabled={isSaving} />
        <FieldError errors={[errors.notedOn]} />
      </Field>

      <Field data-invalid={!!errors.notes}>
        <FieldLabel htmlFor="allergy-notes">Notes</FieldLabel>
        <Textarea
          id="allergy-notes"
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
