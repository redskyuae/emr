'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryState } from 'nuqs';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDebouncedValue } from '@tanstack/react-pacer';
import { AlertCircle, Save } from 'lucide-react';
import { toast } from 'sonner';

import type { CreateInvoiceRequest } from '@/app/api/v1/invoices/types';
import { getApiErrorMessage, getApiErrors } from '@/app/queries/api-error';
import { useAdmissionsQuery } from '@/app/queries/admissions/useAdmissions';
import { useCreateInvoice } from '@/app/queries/billing/invoices/useCreateInvoice';
import { usePatientsQuery } from '@/app/queries/patients/usePatients';
import { useVisitsQuery } from '@/app/queries/visits/useVisits';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import {
  createInvoiceFormSchema,
  type CreateInvoiceFormValues,
} from '../../_utils/create-invoice-form-schema';

const EMPTY_FORM: CreateInvoiceFormValues = {
  patientId: '',
  encounterKind: 'none',
  visitId: '',
  admissionId: '',
  notes: '',
};

export function CreateInvoiceSheet({ open }: { open: boolean }) {
  const router = useRouter();
  const [, setInvoiceParam] = useQueryState('invoice');
  const [patientIdParam, setPatientIdParam] = useQueryState('patientId');
  const [visitIdParam, setVisitIdParam] = useQueryState('visitId');
  const [admissionIdParam, setAdmissionIdParam] = useQueryState('admissionId');

  const form = useForm<CreateInvoiceFormValues>({
    resolver: zodResolver(createInvoiceFormSchema),
    mode: 'onTouched',
    defaultValues: EMPTY_FORM,
  });
  const createMutation = useCreateInvoice();

  const {
    control,
    reset,
    setError,
    formState: { errors },
  } = form;

  useEffect(() => {
    if (!open) {
      return;
    }

    const encounterKind = visitIdParam ? 'visit' : admissionIdParam ? 'admission' : 'none';
    reset({
      patientId: patientIdParam ?? '',
      encounterKind,
      visitId: visitIdParam ?? '',
      admissionId: admissionIdParam ?? '',
      notes: '',
    });
  }, [open, patientIdParam, visitIdParam, admissionIdParam, reset]);

  function closeSheet() {
    void setInvoiceParam(null);
    void setPatientIdParam(null);
    void setVisitIdParam(null);
    void setAdmissionIdParam(null);
  }

  const patientId = useWatch({ control, name: 'patientId' });
  const encounterKind = useWatch({ control, name: 'encounterKind' });

  const handleSave = form.handleSubmit(async (values) => {
    const request: CreateInvoiceRequest = {
      patientId: Number(values.patientId),
      visitId: values.encounterKind === 'visit' ? Number(values.visitId) : undefined,
      admissionId: values.encounterKind === 'admission' ? Number(values.admissionId) : undefined,
      notes: values.notes || undefined,
    };

    try {
      const created = await createMutation.mutateAsync(request);
      toast.success(`Invoice ${created.data.invoiceNumber} created.`);
      void setInvoiceParam(null);
      void setPatientIdParam(null);
      void setVisitIdParam(null);
      void setAdmissionIdParam(null);
      router.push(`/billing/${created.data.id}`);
    } catch (error) {
      for (const message of getApiErrors(error)) {
        if (message.startsWith('Patient')) {
          setError('patientId', { message });
        } else if (message.startsWith('Visit')) {
          setError('visitId', { message });
        } else if (message.startsWith('Admission')) {
          setError('admissionId', { message });
        }
      }

      toast.error(getApiErrorMessage(error));
    }
  });

  const serverErrors = getApiErrors(createMutation.error);

  return (
    <Sheet open={open} onOpenChange={(next) => (!next ? closeSheet() : undefined)}>
      <SheetContent
        side="right"
        className="shadow-fluent-64 w-full gap-0 p-0 data-[side=right]:w-full sm:max-w-lg"
        style={{ width: 'min(512px, 100vw)', maxWidth: '100vw' }}
      >
        <SheetHeader className="border-b p-4 pr-12">
          <SheetTitle className="text-xl">New Invoice</SheetTitle>
          <SheetDescription>
            Raise a Draft Invoice for a Patient, optionally linked to a Visit or Admission.
          </SheetDescription>
        </SheetHeader>

        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(event) => {
            event.preventDefault();
            void handleSave();
          }}
        >
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
            {serverErrors.length > 0 ? (
              <Alert variant="destructive">
                <AlertCircle className="size-4" />
                <AlertTitle>Could not create the Invoice</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc pl-4">
                    {serverErrors.map((message) => (
                      <li key={message}>{message}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            ) : null}

            <Controller
              control={control}
              name="patientId"
              render={({ field }) => (
                <PatientField
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.patientId?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="encounterKind"
              render={({ field }) => (
                <Field>
                  <FieldLabel>Link to encounter</FieldLabel>
                  <RadioGroup
                    value={field.value}
                    onValueChange={field.onChange}
                    className="flex flex-col gap-2"
                  >
                    <label className="flex items-center gap-2 text-sm">
                      <RadioGroupItem value="none" /> No encounter
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <RadioGroupItem value="visit" /> Visit
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <RadioGroupItem value="admission" /> Admission
                    </label>
                  </RadioGroup>
                </Field>
              )}
            />

            {encounterKind === 'visit' ? (
              <Controller
                control={control}
                name="visitId"
                render={({ field }) => (
                  <VisitField
                    patientId={patientId}
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.visitId?.message}
                  />
                )}
              />
            ) : null}

            {encounterKind === 'admission' ? (
              <Controller
                control={control}
                name="admissionId"
                render={({ field }) => (
                  <AdmissionField
                    patientId={patientId}
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.admissionId?.message}
                  />
                )}
              />
            ) : null}

            <Field data-invalid={Boolean(errors.notes)}>
              <FieldLabel htmlFor="invoice-notes">Notes</FieldLabel>
              <Textarea
                id="invoice-notes"
                rows={3}
                placeholder="Optional billing notes"
                {...form.register('notes')}
              />
              {errors.notes ? <FieldError>{errors.notes.message}</FieldError> : null}
            </Field>
          </div>

          <SheetFooter className="flex-row justify-end gap-2 border-t p-4">
            <Button
              type="button"
              variant="outline"
              onClick={closeSheet}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              <Save className="size-4" />
              {createMutation.isPending ? 'Creating…' : 'Create Invoice'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function PatientField({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search, { wait: 300 });
  const patientsQuery = usePatientsQuery({
    page: 1,
    limit: 20,
    isActive: true,
    query: debouncedSearch || undefined,
  });
  const patients = patientsQuery.data?.data ?? [];

  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor="invoice-patient">
        Patient{' '}
        <span aria-hidden className="text-destructive">
          *
        </span>
      </FieldLabel>
      <Input
        placeholder="Search by name or MRN…"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        aria-label="Search patients"
        className="mb-2"
      />
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="invoice-patient" aria-required className="w-full">
          <SelectValue placeholder="Select a Patient" />
        </SelectTrigger>
        <SelectContent>
          {patients.map((patient) => (
            <SelectItem key={patient.id} value={String(patient.id)}>
              {patient.firstName} {patient.lastName} · {patient.mrn}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error ? <FieldError>{error}</FieldError> : null}
    </Field>
  );
}

function VisitField({
  patientId,
  value,
  onChange,
  error,
}: {
  patientId: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  const visitsQuery = useVisitsQuery({
    page: 1,
    limit: 50,
    patientId: patientId ? Number(patientId) : undefined,
  });
  const visits = patientId ? (visitsQuery.data?.data ?? []) : [];

  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor="invoice-visit">Visit</FieldLabel>
      <Select value={value} onValueChange={onChange} disabled={!patientId}>
        <SelectTrigger id="invoice-visit" className="w-full">
          <SelectValue placeholder={patientId ? 'Select a Visit' : 'Choose a Patient first'} />
        </SelectTrigger>
        <SelectContent>
          {visits.map((visit) => (
            <SelectItem key={visit.id} value={String(visit.id)}>
              {visit.visitNumber} · {visit.visitDate}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error ? <FieldError>{error}</FieldError> : null}
    </Field>
  );
}

function AdmissionField({
  patientId,
  value,
  onChange,
  error,
}: {
  patientId: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  const admissionsQuery = useAdmissionsQuery({
    page: 1,
    limit: 50,
    patientId: patientId ? Number(patientId) : undefined,
  });
  const admissions = patientId ? (admissionsQuery.data?.data ?? []) : [];

  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor="invoice-admission">Admission</FieldLabel>
      <Select value={value} onValueChange={onChange} disabled={!patientId}>
        <SelectTrigger id="invoice-admission" className="w-full">
          <SelectValue placeholder={patientId ? 'Select an Admission' : 'Choose a Patient first'} />
        </SelectTrigger>
        <SelectContent>
          {admissions.map((admission) => (
            <SelectItem key={admission.id} value={String(admission.id)}>
              {admission.admissionNumber}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error ? <FieldError>{error}</FieldError> : null}
    </Field>
  );
}
