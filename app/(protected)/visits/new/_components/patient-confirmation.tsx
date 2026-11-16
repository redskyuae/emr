'use client';

import { useState } from 'react';
import type { Appointment } from '@/app/api/lib/modules/appointment/schemas/appointment-schema';
import type { Patient } from '@/app/api/lib/modules/patient/schemas/patient-schema';
import { AlertCircle, CalendarClock, CheckCircle2, RefreshCcw, UserRound } from 'lucide-react';
import { toast } from 'sonner';

import { PatientForm } from '@/app/(protected)/patients/_components/patient-form';
import {
  formatEmiratesId,
  getPatientGenderLabel,
} from '@/app/(protected)/patients/_utils/patient-value-sets';
import {
  patientFormValuesToRequest,
  patientToFormValues,
} from '@/app/(protected)/patients/_utils/patient-form-values';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useUpdatePatient } from '@/app/queries/patients/useUpdatePatient';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';

import {
  emergencyContactSummary,
  patientAddressSummary,
  patientDisplayName,
  patientInitials,
} from '../_utils/patient-summary';

function PatientConfirmationSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border" aria-label="Loading Patient details">
      <div className="bg-muted/40 flex items-center gap-4 border-b p-4">
        <Skeleton className="size-14 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
      </div>
      <div className="grid gap-4 p-4 sm:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((item) => (
          <div key={item} className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-32" />
          </div>
        ))}
      </div>
    </div>
  );
}

function Detail({ label, value, mono }: { label: string; value: string | null; mono?: boolean }) {
  return (
    <div className="min-w-0 space-y-0.5">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className={mono ? 'font-mono text-sm font-semibold' : 'text-sm font-semibold'}>
        {value || <span className="text-muted-foreground font-normal">Not recorded</span>}
      </dd>
    </div>
  );
}

export function PatientConfirmation({
  patient,
  appointment,
  loading,
  error,
  onRetry,
  confirmed,
  confirming,
  onConfirm,
  onChange,
}: {
  patient: Patient | null;
  appointment: Appointment | null;
  loading: boolean;
  error: unknown;
  onRetry: () => void;
  confirmed: boolean;
  confirming: boolean;
  onConfirm: () => Promise<void> | void;
  onChange: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [formRevision, setFormRevision] = useState(0);
  const updatePatient = useUpdatePatient();

  if (loading) return <PatientConfirmationSkeleton />;

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="size-4" />
        <AlertTitle>Could not load Patient information</AlertTitle>
        <AlertDescription className="space-y-3">
          <p>{getApiErrorMessage(error)}</p>
          <Button type="button" variant="outline" size="sm" onClick={onRetry}>
            <RefreshCcw className="size-4" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!patient) {
    return (
      <Empty className="border border-dashed py-8">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <UserRound className="size-5" />
          </EmptyMedia>
          <EmptyTitle>No Patient selected</EmptyTitle>
          <EmptyDescription>
            Select an Appointment or search for a Patient to confirm their details.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  const registered = patient.registrationStatus === 'registered';
  const editorOpen = editing || !registered;
  const name = patientDisplayName(patient);
  const identity =
    formatEmiratesId(patient.emiratesId) ??
    (patient.passportNumber ? `Passport ${patient.passportNumber}` : null);

  return (
    <div className="space-y-4">
      <section
        aria-labelledby="patient-confirmation-name"
        className="overflow-hidden rounded-xl border"
      >
        <div className="bg-accent/50 flex flex-wrap items-center gap-4 border-b p-4">
          <Avatar className="ring-background size-14 ring-4">
            {patient.photoUrl ? <AvatarImage src={patient.photoUrl} alt="" /> : null}
            <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
              {patientInitials(patient)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 id="patient-confirmation-name" className="text-lg font-bold">
                {name}
              </h3>
              <Badge variant="outline" className="bg-background font-mono">
                {patient.mrn}
              </Badge>
              {registered ? (
                <Badge className="bg-success/10 text-success">Registered</Badge>
              ) : (
                <Badge className="bg-warning/10 text-warning">Provisional</Badge>
              )}
              {patient.isVip ? <Badge>VIP</Badge> : null}
              {!patient.isActive ? <Badge variant="destructive">Inactive</Badge> : null}
            </div>
            {appointment ? (
              <p className="text-muted-foreground flex flex-wrap items-center gap-1.5 text-sm">
                <CalendarClock className="size-4" aria-hidden />
                <span className="font-mono">{appointment.bookingNumber}</span>
                <span aria-hidden>·</span>
                <span className="font-mono">
                  {appointment.slots.map((slot) => slot.slotTime).join(', ') ||
                    appointment.slotDate}
                </span>
                {appointment.doctor ? <span>· {appointment.doctor.name}</span> : null}
                {appointment.appointmentType ? (
                  <span>· {appointment.appointmentType.name}</span>
                ) : null}
              </p>
            ) : (
              <p className="text-muted-foreground text-sm">Walk-in · no Appointment</p>
            )}
          </div>
          {registered ? (
            <Button
              type="button"
              variant="link"
              size="sm"
              aria-expanded={editing}
              onClick={() => setEditing((current) => !current)}
            >
              {editing ? 'Close registration' : 'Edit registration'}
            </Button>
          ) : null}
        </div>

        {confirmed ? (
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <p className="text-muted-foreground text-sm">
              {[
                patient.gender ? getPatientGenderLabel(patient.gender) : null,
                patient.dateOfBirth ? `DOB ${patient.dateOfBirth}` : null,
                patient.phone,
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
            <div className="flex items-center gap-2">
              <Badge className="bg-success/10 text-success gap-1">
                <CheckCircle2 className="size-3.5" aria-hidden />
                Confirmed
              </Badge>
              <Button type="button" variant="ghost" size="sm" onClick={onChange}>
                Change Patient
              </Button>
            </div>
          </div>
        ) : (
          <>
            <dl className="grid gap-x-4 gap-y-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
              <Detail label="Date of birth" value={patient.dateOfBirth} mono />
              <Detail
                label="Gender"
                value={patient.gender ? getPatientGenderLabel(patient.gender) : null}
              />
              <Detail label="Phone" value={patient.phone} mono />
              <Detail label="Address" value={patientAddressSummary(patient)} />
              <Detail label="Emergency contact" value={emergencyContactSummary(patient)} />
              <Detail label="Identity" value={identity} mono />
            </dl>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3">
              <p className="text-muted-foreground text-sm">
                {registered
                  ? 'Check these details with the Patient before continuing.'
                  : 'Complete and save Patient registration before creating the Visit.'}
              </p>
              {registered && !editing ? (
                <Button type="button" disabled={confirming} onClick={() => void onConfirm()}>
                  <CheckCircle2 className="size-4" />
                  {confirming ? 'Checking Visit history…' : 'Details are correct · Continue'}
                </Button>
              ) : null}
            </div>
          </>
        )}
      </section>

      {editorOpen ? (
        <PatientForm
          key={`${patient.id}-${formRevision}`}
          mode="edit"
          mrn={patient.mrn}
          defaultValues={patientToFormValues(patient)}
          isSaving={updatePatient.isPending}
          submitAction="next"
          submitLabel="Save and continue"
          onCancel={() => {
            setFormRevision((current) => current + 1);
            setEditing(false);
          }}
          onSave={async (values) => {
            await updatePatient.mutateAsync({
              patientId: patient.id,
              request: patientFormValuesToRequest(values),
            });
            toast.success('Patient information updated.');
            setEditing(false);
            await onConfirm();
          }}
        />
      ) : null}
    </div>
  );
}
