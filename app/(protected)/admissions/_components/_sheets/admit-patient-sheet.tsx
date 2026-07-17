'use client';

import { useState } from 'react';
import { Controller, useForm, useWatch, type Control } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDebouncedValue } from '@tanstack/react-pacer';
import { AlertCircle, BedDouble } from 'lucide-react';
import { toast } from 'sonner';

import { getApiErrorMessage, getApiErrors } from '@/app/queries/api-error';
import { useAdmitPatient } from '@/app/queries/admissions/useAdmitPatient';
import { useDoctorsQuery } from '@/app/queries/doctors/useDoctors';
import { useAdmissionTypesQuery } from '@/app/queries/inpatient-masters/admission-types/useAdmissionTypes';
import { useBedsQuery } from '@/app/queries/inpatient-masters/beds/useBeds';
import { useWardsQuery } from '@/app/queries/inpatient-masters/wards/useWards';
import { usePatientsQuery } from '@/app/queries/patients/usePatients';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
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
import { getBedStatusLabel } from '@/app/(protected)/inpatient-masters/beds/_utils/bed-status';
import { admitFormSchema, type AdmitFormValues } from '../../_utils/admit-form-schema';
import { toDisplayDate } from '../../_utils/admission-status';

export function AdmitPatientSheet({
  open,
  presetWardId,
  presetBedId,
  onClose,
}: {
  open: boolean;
  presetWardId?: number;
  presetBedId?: number;
  onClose: () => void;
}) {
  return (
    <Sheet open={open} onOpenChange={(next) => (!next ? onClose() : undefined)}>
      <SheetContent
        side="right"
        className="shadow-fluent-64 w-full gap-0 p-0 data-[side=right]:w-full sm:max-w-lg"
        style={{ width: 'min(560px, 100vw)', maxWidth: '100vw' }}
      >
        {/* Mounted only while open, so every admit starts from a blank form
            without an effect resetting state after render. */}
        {open ? (
          <AdmitPatientSheetBody
            presetWardId={presetWardId}
            presetBedId={presetBedId}
            onClose={onClose}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function AdmitPatientSheetBody({
  presetWardId,
  presetBedId,
  onClose,
}: {
  presetWardId?: number;
  presetBedId?: number;
  onClose: () => void;
}) {
  const [serverErrors, setServerErrors] = useState<string[]>([]);

  const form = useForm<AdmitFormValues>({
    resolver: zodResolver(admitFormSchema),
    mode: 'onTouched',
    defaultValues: {
      patientId: '',
      doctorId: '',
      admissionTypeId: '',
      wardId: presetWardId ? String(presetWardId) : '',
      bedId: presetBedId ? String(presetBedId) : '',
      admissionReason: '',
      expectedDischargeDate: '',
    },
  });

  const admitMutation = useAdmitPatient();

  const {
    control,
    register,
    setError,
    setValue,
    formState: { errors },
  } = form;

  const handleSave = form.handleSubmit(async (values) => {
    setServerErrors([]);

    try {
      const result = await admitMutation.mutateAsync({
        patientId: Number(values.patientId),
        doctorId: Number(values.doctorId),
        admissionTypeId: Number(values.admissionTypeId),
        bedId: Number(values.bedId),
        admissionReason: values.admissionReason || undefined,
        expectedDischargeDate: values.expectedDischargeDate
          ? toDisplayDate(values.expectedDischargeDate)
          : undefined,
      });
      toast.success(
        `${result.data.patient.firstName} ${result.data.patient.lastName} admitted to ${result.data.bed.bedNumber} — ${result.data.admissionNumber}.`
      );
      onClose();
    } catch (error) {
      const messages = getApiErrors(error);
      setServerErrors(messages);

      for (const message of messages) {
        if (message.startsWith('Patient')) {
          setError('patientId', { message });
        } else if (message.startsWith('Doctor')) {
          setError('doctorId', { message });
        } else if (message.startsWith('Bed')) {
          setError('bedId', { message });
        } else if (message.startsWith('Admission type')) {
          setError('admissionTypeId', { message });
        }
      }

      toast.error(getApiErrorMessage(error));
    }
  });

  return (
    <>
      <SheetHeader className="border-b p-4 pr-12">
        <SheetTitle className="text-xl">Admit Patient</SheetTitle>
        <SheetDescription>
          Choose the Patient, admitting Doctor, and a free Bed. The Bed becomes Occupied and the
          Admission Number is assigned on save.
        </SheetDescription>
      </SheetHeader>

      <form
        className="flex min-h-0 flex-1 flex-col"
        onSubmit={(event) => {
          event.preventDefault();
          void handleSave();
        }}
      >
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <FieldGroup>
            {serverErrors.length > 0 ? (
              <Alert variant="destructive">
                <AlertCircle className="size-4" />
                <AlertTitle>Could not admit the Patient</AlertTitle>
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
              name="doctorId"
              render={({ field }) => (
                <DoctorField
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.doctorId?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="admissionTypeId"
              render={({ field }) => (
                <AdmissionTypeField
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.admissionTypeId?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="wardId"
              render={({ field }) => (
                <WardField
                  value={field.value}
                  onChange={(value) => {
                    field.onChange(value);
                    // A Bed belongs to exactly one Ward, so changing the Ward
                    // invalidates the current Bed choice.
                    setValue('bedId', '');
                  }}
                  error={errors.wardId?.message}
                />
              )}
            />

            <BedField control={control} error={errors.bedId?.message} />

            <Field data-invalid={Boolean(errors.admissionReason)}>
              <FieldLabel htmlFor="admission-reason">Admission reason</FieldLabel>
              <Textarea
                id="admission-reason"
                rows={2}
                placeholder="Chest pain, observation"
                {...register('admissionReason')}
              />
              {errors.admissionReason ? (
                <FieldError>{errors.admissionReason.message}</FieldError>
              ) : null}
            </Field>

            <Field>
              <FieldLabel htmlFor="expected-discharge-date">Expected discharge date</FieldLabel>
              <Input
                id="expected-discharge-date"
                type="date"
                {...register('expectedDischargeDate')}
              />
            </Field>
          </FieldGroup>
        </div>

        <SheetFooter className="flex-row justify-end gap-2 border-t p-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={admitMutation.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={admitMutation.isPending}>
            <BedDouble className="size-4" />
            {admitMutation.isPending ? 'Admitting…' : 'Admit Patient'}
          </Button>
        </SheetFooter>
      </form>
    </>
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
  // Only Registered, active Patients may be admitted, so never offer the rest.
  const patientsQuery = usePatientsQuery({
    page: 1,
    limit: 20,
    isActive: true,
    query: debouncedSearch || undefined,
  });
  const patients = (patientsQuery.data?.data ?? []).filter(
    (patient) => patient.registrationStatus === 'registered'
  );

  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor="admit-patient">
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
        <SelectTrigger id="admit-patient" aria-required className="w-full">
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
      {patients.length === 0 && !patientsQuery.isLoading ? (
        <p className="text-muted-foreground text-xs">
          No Registered, active Patients match. Complete registration first.
        </p>
      ) : null}
      {error ? <FieldError>{error}</FieldError> : null}
    </Field>
  );
}

function DoctorField({
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
  // Search server-side so tenants with more Doctors than one page can still reach
  // every active Doctor, not just the first page.
  const doctorsQuery = useDoctorsQuery({
    page: 1,
    limit: 20,
    status: 'active',
    query: debouncedSearch || undefined,
  });
  const doctors = doctorsQuery.data?.data ?? [];

  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor="admit-doctor">
        Admitting Doctor{' '}
        <span aria-hidden className="text-destructive">
          *
        </span>
      </FieldLabel>
      <Input
        placeholder="Search by name…"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        aria-label="Search doctors"
        className="mb-2"
      />
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="admit-doctor" aria-required className="w-full">
          <SelectValue placeholder="Select a Doctor" />
        </SelectTrigger>
        <SelectContent>
          {doctors.map((doctor) => (
            <SelectItem key={doctor.id} value={String(doctor.id)}>
              {doctor.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {doctors.length === 0 && !doctorsQuery.isLoading ? (
        <p className="text-muted-foreground text-xs">No active Doctors match.</p>
      ) : null}
      {error ? <FieldError>{error}</FieldError> : null}
    </Field>
  );
}

function AdmissionTypeField({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  const admissionTypesQuery = useAdmissionTypesQuery({ limit: 100 });
  const admissionTypes = admissionTypesQuery.data?.data ?? [];

  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor="admit-type">
        Admission type{' '}
        <span aria-hidden className="text-destructive">
          *
        </span>
      </FieldLabel>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="admit-type" aria-required className="w-full">
          <SelectValue placeholder="Select an Admission type" />
        </SelectTrigger>
        <SelectContent>
          {admissionTypes.map((admissionType) => (
            <SelectItem key={admissionType.id} value={String(admissionType.id)}>
              {admissionType.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error ? <FieldError>{error}</FieldError> : null}
    </Field>
  );
}

function WardField({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  const wardsQuery = useWardsQuery({ page: 1, limit: 999 });
  const wards = wardsQuery.data?.data ?? [];

  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor="admit-ward">
        Ward{' '}
        <span aria-hidden className="text-destructive">
          *
        </span>
      </FieldLabel>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="admit-ward" aria-required className="w-full">
          <SelectValue placeholder="Select a Ward" />
        </SelectTrigger>
        <SelectContent>
          {wards.map((ward) => (
            <SelectItem key={ward.id} value={String(ward.id)}>
              {ward.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error ? <FieldError>{error}</FieldError> : null}
    </Field>
  );
}

function BedField({ control, error }: { control: Control<AdmitFormValues>; error?: string }) {
  const wardId = useWatch({ control, name: 'wardId' });

  return (
    <Controller
      control={control}
      name="bedId"
      render={({ field }) => (
        <BedSelect wardId={wardId} value={field.value} onChange={field.onChange} error={error} />
      )}
    />
  );
}

function BedSelect({
  wardId,
  value,
  onChange,
  error,
}: {
  wardId: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  // Only free Beds are offered: Available or Reserved (a reservation exists to
  // be used by the incoming Patient — ADR 0033).
  const bedsQuery = useBedsQuery({
    page: 1,
    limit: 999,
    wardId: wardId ? Number(wardId) : undefined,
  });
  const beds = (bedsQuery.data?.data ?? []).filter(
    (bed) => bed.status === 'AVAILABLE' || bed.status === 'RESERVED'
  );

  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor="admit-bed">
        Bed{' '}
        <span aria-hidden className="text-destructive">
          *
        </span>
      </FieldLabel>
      <Select value={value} onValueChange={onChange} disabled={!wardId}>
        <SelectTrigger id="admit-bed" aria-required className="w-full">
          <SelectValue placeholder={wardId ? 'Select a Bed' : 'Select a Ward first'} />
        </SelectTrigger>
        <SelectContent>
          {beds.map((bed) => (
            <SelectItem key={bed.id} value={String(bed.id)}>
              {bed.bedNumber} · {getBedStatusLabel(bed.status)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {wardId && beds.length === 0 && !bedsQuery.isLoading ? (
        <p className="text-muted-foreground text-xs">No free Beds in this Ward.</p>
      ) : null}
      {error ? <FieldError>{error}</FieldError> : null}
    </Field>
  );
}
