'use client';

import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDebouncedValue } from '@tanstack/react-pacer';
import {
  AlertCircle,
  CalendarCheck,
  CheckCircle2,
  FileText,
  Loader2,
  UserPlus,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import type { CheckInVisitRequest } from '@/app/api/v1/visits/types';
import { getApiErrorMessage, getApiErrors } from '@/app/queries/api-error';
import { useAppointmentLookupQuery } from '@/app/queries/appointments/useAppointmentLookup';
import { useDoctorsQuery } from '@/app/queries/doctors/useDoctors';
import { usePatientsQuery } from '@/app/queries/patients/usePatients';
import { useVisitTypesQuery } from '@/app/queries/visit-masters/visit-types/useVisitTypes';
import { useCheckInVisit } from '@/app/queries/visits/useCheckInVisit';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { formatFileSize } from '../../_utils/format-file-size';
import {
  appointmentCheckInFormSchema,
  walkInCheckInFormSchema,
  type AppointmentCheckInFormValues,
  type WalkInCheckInFormValues,
} from '../../_utils/check-in-form-schema';
import { VisitDocumentUploadButton, type UploadedVisitDocument } from '../visit-document-upload';

type CheckInMode = 'appointment' | 'walk-in';

const APPOINTMENT_DEFAULTS: AppointmentCheckInFormValues = {
  bookingNumber: '',
  visitTypeId: '',
  chiefComplaint: '',
  remarks: '',
};

const WALK_IN_DEFAULTS: WalkInCheckInFormValues = {
  patientId: '',
  doctorId: '',
  visitTypeId: '',
  chiefComplaint: '',
  remarks: '',
};

export function CheckInSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onOpenChange={(next) => (!next ? onClose() : undefined)}>
      <SheetContent
        side="right"
        className="shadow-fluent-64 w-full gap-0 p-0 data-[side=right]:w-full sm:max-w-lg"
        style={{ width: 'min(560px, 100vw)', maxWidth: '100vw' }}
      >
        {/* Mounted only while open, so every check-in starts from a blank form
            without an effect resetting state after render. */}
        {open ? <CheckInSheetBody onClose={onClose} /> : null}
      </SheetContent>
    </Sheet>
  );
}

function CheckInSheetBody({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<CheckInMode>('appointment');
  const [serverErrors, setServerErrors] = useState<string[]>([]);
  const [documents, setDocuments] = useState<UploadedVisitDocument[]>([]);

  const visitTypesQuery = useVisitTypesQuery({ limit: 100 });
  const visitTypes = visitTypesQuery.data?.data ?? [];

  const appointmentForm = useForm<AppointmentCheckInFormValues>({
    resolver: zodResolver(appointmentCheckInFormSchema),
    mode: 'onTouched',
    defaultValues: APPOINTMENT_DEFAULTS,
  });
  const walkInForm = useForm<WalkInCheckInFormValues>({
    resolver: zodResolver(walkInCheckInFormSchema),
    mode: 'onTouched',
    defaultValues: WALK_IN_DEFAULTS,
  });

  const bookingNumber = useWatch({ control: appointmentForm.control, name: 'bookingNumber' });
  const [debouncedBookingNumber] = useDebouncedValue((bookingNumber ?? '').trim(), { wait: 350 });
  const appointmentLookup = useAppointmentLookupQuery(debouncedBookingNumber);
  const appointment = appointmentLookup.data ?? null;

  const checkInMutation = useCheckInVisit();

  async function submitCheckIn(request: CheckInVisitRequest) {
    setServerErrors([]);

    try {
      const result = await checkInMutation.mutateAsync(request);
      toast.success(
        `${result.data.patient.firstName} ${result.data.patient.lastName} checked in — token ${result.data.queueToken}.`
      );
      onClose();
    } catch (error) {
      setServerErrors(getApiErrors(error));
      toast.error(getApiErrorMessage(error));
    }
  }

  const handleAppointmentSubmit = appointmentForm.handleSubmit(async (values) => {
    if (!appointment) {
      setServerErrors(['Enter a Booking Number for an Appointment scheduled today.']);
      return;
    }

    await submitCheckIn({
      appointmentId: appointment.id,
      visitTypeId: Number(values.visitTypeId),
      chiefComplaint: values.chiefComplaint || undefined,
      remarks: values.remarks || undefined,
      documents: documents.length > 0 ? documents : undefined,
    });
  });

  const handleWalkInSubmit = walkInForm.handleSubmit(async (values) => {
    await submitCheckIn({
      patientId: Number(values.patientId),
      doctorId: Number(values.doctorId),
      visitTypeId: Number(values.visitTypeId),
      chiefComplaint: values.chiefComplaint || undefined,
      remarks: values.remarks || undefined,
      documents: documents.length > 0 ? documents : undefined,
    });
  });

  const isSaving = checkInMutation.isPending;

  return (
    <>
      <SheetHeader className="border-b p-4 pr-12">
        <SheetTitle className="text-xl">Check in a Patient</SheetTitle>
        <SheetDescription>
          Fulfil a booked Appointment, or start a Walk-in Visit. A Queue Token is issued
          automatically for the Doctor.
        </SheetDescription>
      </SheetHeader>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {serverErrors.length > 0 ? (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="size-4" />
            <AlertTitle>Could not check the Patient in</AlertTitle>
            <AlertDescription>
              <ul className="list-disc pl-4">
                {serverErrors.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        ) : null}

        <Tabs value={mode} onValueChange={(value) => setMode(value as CheckInMode)}>
          <TabsList className="w-full">
            <TabsTrigger value="appointment" className="flex-1">
              <CalendarCheck className="size-4" />
              From Appointment
            </TabsTrigger>
            <TabsTrigger value="walk-in" className="flex-1">
              <UserPlus className="size-4" />
              Walk-in
            </TabsTrigger>
          </TabsList>

          <TabsContent value="appointment" className="pt-4">
            <form
              id="appointment-check-in-form"
              onSubmit={(event) => {
                event.preventDefault();
                void handleAppointmentSubmit();
              }}
            >
              <FieldGroup>
                <Field data-invalid={Boolean(appointmentForm.formState.errors.bookingNumber)}>
                  <FieldLabel htmlFor="booking-number">
                    Booking Number{' '}
                    <span aria-hidden className="text-destructive">
                      *
                    </span>
                  </FieldLabel>
                  <Input
                    id="booking-number"
                    aria-required
                    placeholder="APT-1042"
                    autoComplete="off"
                    {...appointmentForm.register('bookingNumber')}
                  />
                  {appointmentForm.formState.errors.bookingNumber ? (
                    <FieldError>
                      {appointmentForm.formState.errors.bookingNumber.message}
                    </FieldError>
                  ) : null}
                </Field>

                {debouncedBookingNumber.length > 0 ? (
                  <AppointmentPreview
                    isLoading={appointmentLookup.isLoading}
                    error={appointmentLookup.error}
                    appointment={appointment}
                  />
                ) : null}

                <Controller
                  control={appointmentForm.control}
                  name="visitTypeId"
                  render={({ field }) => (
                    <VisitTypeField
                      value={field.value}
                      onChange={field.onChange}
                      visitTypes={visitTypes}
                      error={appointmentForm.formState.errors.visitTypeId?.message}
                    />
                  )}
                />

                <Field>
                  <FieldLabel htmlFor="appointment-chief-complaint">Purpose of visit</FieldLabel>
                  <Textarea
                    id="appointment-chief-complaint"
                    rows={2}
                    placeholder="Fever for 3 days"
                    {...appointmentForm.register('chiefComplaint')}
                  />
                  {appointmentForm.formState.errors.chiefComplaint ? (
                    <FieldError>
                      {appointmentForm.formState.errors.chiefComplaint.message}
                    </FieldError>
                  ) : null}
                </Field>

                <Field>
                  <FieldLabel htmlFor="appointment-remarks">Remarks</FieldLabel>
                  <Textarea
                    id="appointment-remarks"
                    rows={2}
                    {...appointmentForm.register('remarks')}
                  />
                </Field>
              </FieldGroup>
            </form>
          </TabsContent>

          <TabsContent value="walk-in" className="pt-4">
            <form
              id="walk-in-check-in-form"
              onSubmit={(event) => {
                event.preventDefault();
                void handleWalkInSubmit();
              }}
            >
              <FieldGroup>
                <Controller
                  control={walkInForm.control}
                  name="patientId"
                  render={({ field }) => (
                    <PatientField
                      value={field.value}
                      onChange={field.onChange}
                      error={walkInForm.formState.errors.patientId?.message}
                    />
                  )}
                />

                <Controller
                  control={walkInForm.control}
                  name="doctorId"
                  render={({ field }) => (
                    <DoctorField
                      value={field.value}
                      onChange={field.onChange}
                      error={walkInForm.formState.errors.doctorId?.message}
                    />
                  )}
                />

                <Controller
                  control={walkInForm.control}
                  name="visitTypeId"
                  render={({ field }) => (
                    <VisitTypeField
                      value={field.value}
                      onChange={field.onChange}
                      visitTypes={visitTypes}
                      error={walkInForm.formState.errors.visitTypeId?.message}
                    />
                  )}
                />

                <Field>
                  <FieldLabel htmlFor="walk-in-chief-complaint">Purpose of visit</FieldLabel>
                  <Textarea
                    id="walk-in-chief-complaint"
                    rows={2}
                    placeholder="Chest pain since morning"
                    {...walkInForm.register('chiefComplaint')}
                  />
                  {walkInForm.formState.errors.chiefComplaint ? (
                    <FieldError>{walkInForm.formState.errors.chiefComplaint.message}</FieldError>
                  ) : null}
                </Field>

                <Field>
                  <FieldLabel htmlFor="walk-in-remarks">Remarks</FieldLabel>
                  <Textarea id="walk-in-remarks" rows={2} {...walkInForm.register('remarks')} />
                </Field>
              </FieldGroup>
            </form>
          </TabsContent>
        </Tabs>

        <div className="mt-4 border-t pt-4">
          <CheckInDocumentsField
            documents={documents}
            onChange={setDocuments}
            disabled={isSaving}
          />
        </div>
      </div>

      <SheetFooter className="flex-row justify-end gap-2 border-t p-4">
        <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>
        <Button
          type="submit"
          form={mode === 'appointment' ? 'appointment-check-in-form' : 'walk-in-check-in-form'}
          disabled={isSaving}
        >
          <CheckCircle2 className="size-4" />
          {isSaving ? 'Checking in…' : 'Check in'}
        </Button>
      </SheetFooter>
    </>
  );
}

function CheckInDocumentsField({
  documents,
  onChange,
  disabled,
}: {
  documents: UploadedVisitDocument[];
  onChange: (documents: UploadedVisitDocument[]) => void;
  disabled?: boolean;
}) {
  return (
    <Field>
      <FieldLabel>Documents</FieldLabel>
      <p className="text-muted-foreground text-xs">
        Attach referrals, prior reports, or scans — PDF or image, up to 4.5MB each. Optional.
      </p>

      {documents.length > 0 ? (
        <ul className="mt-1 space-y-1">
          {documents.map((document, index) => (
            <li
              key={document.fileUrl}
              className="bg-muted/40 flex items-center gap-2 rounded-md border p-2 text-sm"
            >
              <FileText className="text-muted-foreground size-4 shrink-0" />
              <span className="min-w-0 flex-1 truncate">{document.fileName}</span>
              <span className="text-muted-foreground shrink-0 text-xs">
                {formatFileSize(document.fileSize)}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-6 shrink-0"
                aria-label={`Remove ${document.fileName}`}
                disabled={disabled}
                onClick={() => onChange(documents.filter((_, position) => position !== index))}
              >
                <X className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-1">
        <VisitDocumentUploadButton
          disabled={disabled}
          label="Add document"
          onUploaded={(document) => onChange([...documents, document])}
        />
      </div>
    </Field>
  );
}

function AppointmentPreview({
  isLoading,
  error,
  appointment,
}: {
  isLoading: boolean;
  error: unknown;
  appointment: {
    bookingNumber: string;
    slotDate: string;
    patient: { firstName: string; lastName: string; mrn: string };
    doctor: { name: string };
    appointmentStatus: { name: string };
  } | null;
}) {
  if (isLoading) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 rounded-md border p-3 text-sm">
        <Loader2 className="size-4 animate-spin" />
        Looking up the Appointment…
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="size-4" />
        <AlertTitle>Appointment not found</AlertTitle>
        <AlertDescription>{getApiErrorMessage(error)}</AlertDescription>
      </Alert>
    );
  }

  if (!appointment) {
    return null;
  }

  return (
    <div className="bg-muted/40 space-y-1 rounded-md border p-3 text-sm">
      <p className="font-medium">
        {appointment.patient.firstName} {appointment.patient.lastName}
      </p>
      <p className="text-muted-foreground">
        {appointment.patient.mrn} · {appointment.doctor.name}
      </p>
      <p className="text-muted-foreground">
        {appointment.slotDate} · {appointment.appointmentStatus.name}
      </p>
    </div>
  );
}

function VisitTypeField({
  value,
  onChange,
  visitTypes,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  visitTypes: { id: number; name: string; code: string }[];
  error?: string;
}) {
  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor="visit-type">
        Visit type{' '}
        <span aria-hidden className="text-destructive">
          *
        </span>
      </FieldLabel>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="visit-type" aria-required className="w-full">
          <SelectValue placeholder="Select a Visit type" />
        </SelectTrigger>
        <SelectContent>
          {visitTypes.map((visitType) => (
            <SelectItem key={visitType.id} value={String(visitType.id)}>
              {visitType.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error ? <FieldError>{error}</FieldError> : null}
    </Field>
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
  // Only Registered, active Patients may be checked in, so never offer the rest.
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
      <FieldLabel htmlFor="walk-in-patient">
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
        <SelectTrigger id="walk-in-patient" aria-required className="w-full">
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
  const doctorsQuery = useDoctorsQuery({ page: 1, limit: 100, status: 'active' });
  const doctors = doctorsQuery.data?.data ?? [];

  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor="walk-in-doctor">
        Doctor{' '}
        <span aria-hidden className="text-destructive">
          *
        </span>
      </FieldLabel>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="walk-in-doctor" aria-required className="w-full">
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
      {error ? <FieldError>{error}</FieldError> : null}
    </Field>
  );
}
