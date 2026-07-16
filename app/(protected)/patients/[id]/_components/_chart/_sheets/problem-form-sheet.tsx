'use client';

import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import type { PatientProblem } from '@/app/api/lib/modules/patient-problem/schemas/patient-problem-schema';
import { getApiErrors, getApiErrorMessage } from '@/app/queries/api-error';
import { useCreatePatientProblem } from '@/app/queries/patients/chart/useCreatePatientProblem';
import { useUpdatePatientProblem } from '@/app/queries/patients/chart/useUpdatePatientProblem';
import { useDiagnosisCodesQuery } from '@/app/queries/clinical-masters/diagnosis-codes/useDiagnosisCodes';
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

import { PROBLEM_STATUS_OPTIONS } from '../../../_utils/chart-value-sets';
import {
  problemFormDefaults,
  problemFormSchema,
  type ProblemFormValues,
} from '../../../_utils/problem-form-schema';
import { ChartFormSheetShell } from './chart-form-sheet-shell';

const emptyToUndefined = (value: string) => (value.trim() === '' ? undefined : value.trim());

export function ProblemFormSheet({
  open,
  mode,
  patientId,
  problem,
  onClose,
}: {
  open: boolean;
  mode: 'new' | 'edit';
  patientId: number;
  problem: PatientProblem | null;
  onClose: () => void;
}) {
  const diagnosisCodesQuery = useDiagnosisCodesQuery({ limit: 200 });
  const diagnosisCodeOptions = diagnosisCodesQuery.data?.data ?? [];

  const { serverErrors, setServerErrors, clearServerErrors } = useChartFormServerErrors();
  const form = useForm<ProblemFormValues>({
    resolver: zodResolver(problemFormSchema),
    mode: 'onTouched',
    defaultValues: problemFormDefaults,
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
    if (mode === 'edit' && problem) {
      reset({
        diagnosisCodeId: problem.diagnosisCodeId ? String(problem.diagnosisCodeId) : '',
        title: problem.title,
        clinicalStatus: problem.clinicalStatus,
        onsetDate: problem.onsetDate ?? '',
        resolvedDate: problem.resolvedDate ?? '',
        notes: problem.notes ?? '',
      });
    } else {
      reset(problemFormDefaults);
    }
  }, [open, mode, problem, reset, clearServerErrors]);

  const createMutation = useCreatePatientProblem();
  const updateMutation = useUpdatePatientProblem();
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const handleSave = form.handleSubmit(async (values) => {
    clearServerErrors();
    const body = {
      diagnosisCodeId: values.diagnosisCodeId === '' ? undefined : Number(values.diagnosisCodeId),
      title: emptyToUndefined(values.title),
      clinicalStatus: values.clinicalStatus,
      onsetDate: emptyToUndefined(values.onsetDate),
      resolvedDate: emptyToUndefined(values.resolvedDate),
      notes: emptyToUndefined(values.notes),
    };

    try {
      if (mode === 'edit' && problem) {
        await updateMutation.mutateAsync({ patientId, problemId: problem.id, body });
        toast.success('Problem updated.');
      } else {
        await createMutation.mutateAsync({ patientId, body });
        toast.success('Problem added.');
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
      title={mode === 'edit' ? 'Edit Problem' : 'Add Problem'}
      description={
        mode === 'edit'
          ? 'Update this Problem List entry.'
          : 'Add a Problem for this Patient. Choose a diagnosis code or enter a free-text title.'
      }
      serverErrors={serverErrors}
      isSaving={isSaving}
      onSave={() => void handleSave()}
      onClose={onClose}
    >
      <Controller
        control={control}
        name="diagnosisCodeId"
        render={({ field }) => (
          <Field>
            <FieldLabel htmlFor="problem-code">Diagnosis code</FieldLabel>
            <Select
              value={field.value === '' ? undefined : field.value}
              onValueChange={field.onChange}
              disabled={isSaving}
            >
              <SelectTrigger id="problem-code" className="w-full">
                <SelectValue placeholder="Select a diagnosis code (optional)" />
              </SelectTrigger>
              <SelectContent>
                {diagnosisCodeOptions.map((option) => (
                  <SelectItem key={option.id} value={String(option.id)}>
                    {option.code} — {option.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        )}
      />

      <Field data-invalid={!!errors.title}>
        <FieldLabel htmlFor="problem-title">Title (free text)</FieldLabel>
        <Input
          id="problem-title"
          {...register('title')}
          disabled={isSaving}
          maxLength={255}
          placeholder="e.g. Essential hypertension"
          aria-invalid={!!errors.title}
        />
        <FieldError errors={[errors.title]} />
      </Field>

      <Controller
        control={control}
        name="clinicalStatus"
        render={({ field }) => (
          <Field>
            <FieldLabel htmlFor="problem-status">Clinical status</FieldLabel>
            <Select value={field.value} onValueChange={field.onChange} disabled={isSaving}>
              <SelectTrigger id="problem-status" className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {PROBLEM_STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        )}
      />

      <Field data-invalid={!!errors.onsetDate}>
        <FieldLabel htmlFor="problem-onset">Onset date</FieldLabel>
        <Input id="problem-onset" type="date" {...register('onsetDate')} disabled={isSaving} />
        <FieldError errors={[errors.onsetDate]} />
      </Field>

      <Field data-invalid={!!errors.resolvedDate}>
        <FieldLabel htmlFor="problem-resolved">Resolved date</FieldLabel>
        <Input
          id="problem-resolved"
          type="date"
          {...register('resolvedDate')}
          disabled={isSaving}
        />
        <FieldError errors={[errors.resolvedDate]} />
      </Field>

      <Field data-invalid={!!errors.notes}>
        <FieldLabel htmlFor="problem-notes">Notes</FieldLabel>
        <Textarea
          id="problem-notes"
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
