'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { getApiErrors } from '@/app/queries/api-error';
import { useDiagnosisCodesQuery } from '@/app/queries/clinical-masters/diagnosis-codes/useDiagnosisCodes';
import { useClinicalNoteTypesQuery } from '@/app/queries/clinical-masters/note-types/useClinicalNoteTypes';
import { useCreateClinicalNote } from '@/app/queries/patients/chart/useCreateClinicalNote';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';

import {
  consultationToSoap,
  doctorConsultationFormSchema,
  type DoctorConsultationFormValues,
} from '../../_utils/doctor-consultation-note';

const EMPTY: DoctorConsultationFormValues = {
  chiefComplaint: '',
  hpi: '',
  medicalHistory: '',
  surgicalHistory: '',
  familySocialHistory: '',
  examination: '',
  diagnosisCodeId: '',
  ayurvedicDiagnosis: '',
  prakriti: '',
  vikriti: '',
  precautions: '',
};

const NARRATIVES = [
  ['chiefComplaint', 'Chief complaint'],
  ['hpi', 'Present condition / HPI'],
  ['medicalHistory', 'Past medical history'],
  ['surgicalHistory', 'Past surgical history'],
  ['familySocialHistory', 'Family / social history'],
  ['examination', 'Examination / red flags'],
  ['ayurvedicDiagnosis', 'Ayurvedic diagnosis'],
  ['prakriti', 'Prakriti'],
  ['vikriti', 'Vikriti / body condition'],
  ['precautions', 'Treatment precautions'],
] as const;

export function DoctorConsultationSheet({
  open,
  patientId,
  visitId,
  chiefComplaint,
  onClose,
}: {
  open: boolean;
  patientId: number;
  visitId: number;
  chiefComplaint: string | null;
  onClose: () => void;
}) {
  const form = useForm<DoctorConsultationFormValues>({
    resolver: zodResolver(doctorConsultationFormSchema),
    mode: 'onTouched',
    defaultValues: EMPTY,
  });
  const noteTypes = useClinicalNoteTypesQuery({ limit: 100 });
  const [selectedNoteTypeId, setSelectedNoteTypeId] = useState<number | null>(null);
  const diagnosisCodes = useDiagnosisCodesQuery({ limit: 100 });
  const createNote = useCreateClinicalNote();
  const consultationType = noteTypes.data?.data.find((type) => type.code === 'CONS');
  const availableNoteTypes = noteTypes.data?.data ?? [];
  const noteTypeId = selectedNoteTypeId ?? consultationType?.id ?? availableNoteTypes[0]?.id;

  useEffect(() => {
    if (open) form.reset({ ...EMPTY, chiefComplaint: chiefComplaint ?? '' });
  }, [open, chiefComplaint, form]);

  const submit = form.handleSubmit(async (values) => {
    if (!noteTypeId) return;
    const diagnosis = diagnosisCodes.data?.data.find(
      (item) => String(item.id) === values.diagnosisCodeId
    );
    try {
      await createNote.mutateAsync({
        patientId,
        body: {
          noteTypeId,
          visitId,
          ...consultationToSoap(values, diagnosis),
        },
      });
      toast.success('Doctor consultation saved as a draft Clinical Note.');
      onClose();
    } catch (error) {
      form.setError('root', { message: getApiErrors(error).join(' ') });
    }
  });

  return (
    <Sheet open={open} onOpenChange={(next) => (!next ? onClose() : undefined)}>
      <SheetContent
        side="right"
        className="shadow-fluent-64 w-full gap-0 p-0 data-[side=right]:w-full sm:max-w-2xl"
        style={{ width: 'min(720px, 100vw)', maxWidth: '100vw' }}
      >
        <SheetHeader className="border-b p-4 pr-12">
          <SheetTitle>Doctor consultation</SheetTitle>
          <SheetDescription>
            Creates a Visit-linked Consultation Clinical Note. Review and sign it from the Patient
            Chart.
          </SheetDescription>
        </SheetHeader>
        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
            {noteTypes.isLoading ? (
              <div className="space-y-2" aria-label="Loading Clinical Note Types">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : null}
            {noteTypes.isError ? (
              <Alert variant="destructive">
                <AlertTitle>Clinical Note Types could not be loaded</AlertTitle>
                <AlertDescription>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => void noteTypes.refetch()}
                  >
                    Retry
                  </Button>
                </AlertDescription>
              </Alert>
            ) : null}
            {availableNoteTypes.length === 0 && !noteTypes.isLoading && !noteTypes.isError ? (
              <Alert variant="destructive">
                <AlertTitle>No Clinical Note Types configured</AlertTitle>
                <AlertDescription>
                  <Link href="/clinical-masters/note-types" className="underline">
                    Configure a Clinical Note Type
                  </Link>{' '}
                  before saving.
                </AlertDescription>
              </Alert>
            ) : null}
            {availableNoteTypes.length > 0 ? (
              <Field>
                <FieldLabel htmlFor="consult-note-type">Clinical Note Type</FieldLabel>
                <NativeSelect
                  id="consult-note-type"
                  value={String(noteTypeId)}
                  onChange={(event) => setSelectedNoteTypeId(Number(event.target.value))}
                >
                  {availableNoteTypes.map((type) => (
                    <NativeSelectOption key={type.id} value={String(type.id)}>
                      {type.name}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>
            ) : null}
            {form.formState.errors.root ? (
              <Alert variant="destructive">
                <AlertTitle>Could not save consultation</AlertTitle>
                <AlertDescription>{form.formState.errors.root.message}</AlertDescription>
              </Alert>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2">
              {NARRATIVES.map(([name, label]) => (
                <Field
                  key={name}
                  data-invalid={Boolean(form.formState.errors[name])}
                  className={
                    name === 'chiefComplaint' ||
                    name === 'hpi' ||
                    name === 'examination' ||
                    name === 'precautions'
                      ? 'sm:col-span-2'
                      : undefined
                  }
                >
                  <FieldLabel htmlFor={`consult-${name}`}>
                    {label}
                    {name === 'chiefComplaint' ? (
                      <span aria-hidden="true" className="text-destructive">
                        {' '}
                        *
                      </span>
                    ) : null}
                  </FieldLabel>
                  {['prakriti', 'vikriti'].includes(name) ? (
                    <Input id={`consult-${name}`} {...form.register(name)} />
                  ) : (
                    <Textarea
                      id={`consult-${name}`}
                      rows={name === 'hpi' || name === 'examination' ? 3 : 2}
                      {...form.register(name)}
                    />
                  )}
                  {form.formState.errors[name] ? (
                    <FieldError>{form.formState.errors[name]?.message}</FieldError>
                  ) : null}
                </Field>
              ))}
            </div>
            <Field>
              <FieldLabel htmlFor="consult-diagnosis-code">Modern diagnosis code</FieldLabel>
              {diagnosisCodes.isLoading ? (
                <Skeleton className="h-10 w-full" aria-label="Loading Diagnosis Codes" />
              ) : (
                <NativeSelect
                  id="consult-diagnosis-code"
                  className="w-full"
                  {...form.register('diagnosisCodeId')}
                >
                  <NativeSelectOption value="">
                    Select from Tenant Diagnosis Codes
                  </NativeSelectOption>
                  {(diagnosisCodes.data?.data ?? []).map((item) => (
                    <NativeSelectOption key={item.id} value={String(item.id)}>
                      {item.code} · {item.title}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              )}
              {diagnosisCodes.isError ? (
                <p className="text-destructive text-sm">Diagnosis Codes could not be loaded.</p>
              ) : null}
            </Field>
            <p className="text-muted-foreground text-xs">
              Ayurvedic terms are clinician-entered narrative until a validated terminology
              catalogue is configured.
            </p>
          </div>
          <SheetFooter className="flex-row justify-end gap-2 border-t p-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={createNote.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                createNote.isPending || noteTypes.isLoading || noteTypes.isError || !noteTypeId
              }
            >
              {createNote.isPending ? 'Saving…' : 'Save consultation'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
