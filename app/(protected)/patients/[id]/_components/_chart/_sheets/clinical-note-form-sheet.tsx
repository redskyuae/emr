'use client';

import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import type { ClinicalNote } from '@/app/api/lib/modules/clinical-note/schemas/clinical-note-schema';
import { getApiErrors, getApiErrorMessage } from '@/app/queries/api-error';
import { useCreateClinicalNote } from '@/app/queries/patients/chart/useCreateClinicalNote';
import { useUpdateClinicalNote } from '@/app/queries/patients/chart/useUpdateClinicalNote';
import { useClinicalNoteTypesQuery } from '@/app/queries/clinical-masters/note-types/useClinicalNoteTypes';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useChartFormServerErrors } from '../use-chart-form-server-errors';

import {
  clinicalNoteFormDefaults,
  clinicalNoteFormSchema,
  type ClinicalNoteFormValues,
} from '../../../_utils/clinical-note-form-schema';
import { ChartFormSheetShell } from './chart-form-sheet-shell';

const emptyToUndefined = (value: string) => (value.trim() === '' ? undefined : value.trim());

const SOAP_FIELDS: { name: keyof ClinicalNoteFormValues; label: string; placeholder: string }[] = [
  {
    name: 'subjective',
    label: 'Subjective',
    placeholder: "Patient's reported symptoms and history",
  },
  { name: 'objective', label: 'Objective', placeholder: 'Examination findings, vitals, results' },
  { name: 'assessment', label: 'Assessment', placeholder: 'Diagnosis or clinical impression' },
  { name: 'plan', label: 'Plan', placeholder: 'Treatment plan and follow-up' },
];

export function ClinicalNoteFormSheet({
  open,
  mode,
  patientId,
  note,
  onClose,
}: {
  open: boolean;
  mode: 'new' | 'edit';
  patientId: number;
  note: ClinicalNote | null;
  onClose: () => void;
}) {
  const noteTypesQuery = useClinicalNoteTypesQuery({ limit: 200 });
  const noteTypeOptions = noteTypesQuery.data?.data ?? [];

  const { serverErrors, setServerErrors, clearServerErrors } = useChartFormServerErrors();
  const form = useForm<ClinicalNoteFormValues>({
    resolver: zodResolver(clinicalNoteFormSchema),
    mode: 'onTouched',
    defaultValues: clinicalNoteFormDefaults,
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
    if (mode === 'edit' && note) {
      reset({
        noteTypeId: String(note.noteTypeId),
        subjective: note.subjective ?? '',
        objective: note.objective ?? '',
        assessment: note.assessment ?? '',
        plan: note.plan ?? '',
      });
    } else {
      reset(clinicalNoteFormDefaults);
    }
  }, [open, mode, note, reset, clearServerErrors]);

  const createMutation = useCreateClinicalNote();
  const updateMutation = useUpdateClinicalNote();
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const handleSave = form.handleSubmit(async (values) => {
    clearServerErrors();
    const body = {
      noteTypeId: Number(values.noteTypeId),
      subjective: emptyToUndefined(values.subjective),
      objective: emptyToUndefined(values.objective),
      assessment: emptyToUndefined(values.assessment),
      plan: emptyToUndefined(values.plan),
    };

    try {
      if (mode === 'edit' && note) {
        await updateMutation.mutateAsync({ patientId, noteId: note.id, body });
        toast.success('Clinical note updated.');
      } else {
        await createMutation.mutateAsync({ patientId, body });
        toast.success('Clinical note created.');
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
      title={mode === 'edit' ? 'Edit Clinical Note' : 'New Clinical Note'}
      description={
        mode === 'edit'
          ? 'Update this draft clinical note. Signed notes cannot be edited.'
          : 'Write a SOAP-structured clinical note. At least one section is required.'
      }
      serverErrors={serverErrors}
      isSaving={isSaving}
      onSave={() => void handleSave()}
      onClose={onClose}
    >
      <Controller
        control={control}
        name="noteTypeId"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="note-type">
              Note type{' '}
              <span aria-hidden="true" className="text-destructive">
                *
              </span>
            </FieldLabel>
            <Select
              value={field.value === '' ? undefined : field.value}
              onValueChange={field.onChange}
              disabled={isSaving}
            >
              <SelectTrigger
                id="note-type"
                className="w-full"
                aria-required="true"
                aria-invalid={fieldState.invalid}
              >
                <SelectValue placeholder="Select a note type" />
              </SelectTrigger>
              <SelectContent>
                {noteTypeOptions.map((option) => (
                  <SelectItem key={option.id} value={String(option.id)}>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />

      {SOAP_FIELDS.map((soap) => (
        <Field key={soap.name} data-invalid={!!errors[soap.name]}>
          <FieldLabel htmlFor={`note-${soap.name}`}>{soap.label}</FieldLabel>
          <Textarea
            id={`note-${soap.name}`}
            {...register(soap.name)}
            disabled={isSaving}
            rows={3}
            placeholder={soap.placeholder}
            aria-invalid={!!errors[soap.name]}
          />
          <FieldError errors={[errors[soap.name]]} />
        </Field>
      ))}
    </ChartFormSheetShell>
  );
}
