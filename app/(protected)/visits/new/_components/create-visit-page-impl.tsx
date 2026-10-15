'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { AlertCircle, ArrowLeft, CheckCircle2, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';

import { getApiErrors } from '@/app/queries/api-error';
import { useAppointmentsQuery } from '@/app/queries/appointments/useAppointments';
import { useDoctorsQuery } from '@/app/queries/doctors/useDoctors';
import { useHasPermission } from '@/app/queries/identity-access/useCurrentUser';
import { usePatientQuery, usePatientsQuery } from '@/app/queries/patients/usePatients';
import { useVisitTypesQuery } from '@/app/queries/visit-masters/visit-types/useVisitTypes';
import { useCheckInVisit } from '@/app/queries/visits/useCheckInVisit';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

import {
  createVisitFormSchema,
  type CreateVisitFormValues,
} from '../_utils/create-visit-form-schema';
import { PatientRegistrationSection } from './patient-registration-section';
import { AppointmentContextCard, PatientContextCard } from './visit-context-rail';
import { VisitDetailsFields, VisitSourceFields } from './visit-form-fields';

const DEFAULT_VALUES: CreateVisitFormValues = {
  mode: 'appointment',
  appointmentId: '',
  patientId: '',
  doctorId: '',
  visitTypeId: '',
  chiefComplaint: '',
  remarks: '',
};

export function CreateVisitPageImpl() {
  const router = useRouter();
  const [step, setStep] = useState<'patient' | 'visit'>('patient');
  const [serverErrors, setServerErrors] = useState<string[]>([]);
  const form = useForm<CreateVisitFormValues>({
    resolver: zodResolver(createVisitFormSchema),
    mode: 'onTouched',
    defaultValues: DEFAULT_VALUES,
  });

  const mode = useWatch({ control: form.control, name: 'mode' });
  const appointmentId = useWatch({ control: form.control, name: 'appointmentId' });
  const patientId = useWatch({ control: form.control, name: 'patientId' });

  const appointmentsQuery = useAppointmentsQuery({
    statusCategories: ['SCHEDULED', 'CONFIRMED'],
    page: 1,
    limit: 999,
  });
  const patientsQuery = usePatientsQuery({ page: 1, limit: 100, isActive: true });
  const doctorsQuery = useDoctorsQuery({ page: 1, limit: 100, status: 'active' });
  const visitTypesQuery = useVisitTypesQuery({ limit: 100 });
  const { data: canCreate } = useHasPermission('visit:create');
  const checkInMutation = useCheckInVisit();

  const appointments = appointmentsQuery.data?.data ?? [];
  const patients = patientsQuery.data?.data ?? [];
  const doctors = doctorsQuery.data?.data ?? [];
  const visitTypes = visitTypesQuery.data?.data ?? [];
  const appointment =
    mode === 'appointment'
      ? (appointments.find((item) => String(item.id) === appointmentId) ?? null)
      : null;
  const selectedPatientId =
    mode === 'appointment'
      ? (appointment?.patient.id ?? null)
      : patientId
        ? Number(patientId)
        : null;
  const patientQuery = usePatientQuery(selectedPatientId);
  const patient = patientQuery.data ?? null;
  const loading =
    appointmentsQuery.isLoading ||
    patientsQuery.isLoading ||
    doctorsQuery.isLoading ||
    visitTypesQuery.isLoading;
  const dependencyError =
    appointmentsQuery.error ?? patientsQuery.error ?? doctorsQuery.error ?? visitTypesQuery.error;

  async function retryDependencies() {
    await Promise.all([
      appointmentsQuery.refetch(),
      patientsQuery.refetch(),
      doctorsQuery.refetch(),
      visitTypesQuery.refetch(),
    ]);
  }

  const submit = form.handleSubmit(async (values) => {
    setServerErrors([]);
    if (!patient) {
      setServerErrors(['Select a Patient or Appointment before creating the Visit.']);
      setStep('patient');
      return;
    }
    if (values.mode === 'appointment' && !appointment) {
      form.setError('appointmentId', { message: 'Select an Appointment scheduled today.' });
      setStep('patient');
      return;
    }
    if (values.mode === 'appointment' && !appointment?.doctor && !values.doctorId) {
      form.setError('doctorId', { message: 'Doctor is required for this Appointment.' });
      return;
    }

    try {
      const result = await checkInMutation.mutateAsync({
        visitTypeId: Number(values.visitTypeId),
        ...(values.mode === 'appointment'
          ? {
              appointmentId: Number(values.appointmentId),
              doctorId: values.doctorId ? Number(values.doctorId) : undefined,
            }
          : { patientId: Number(values.patientId), doctorId: Number(values.doctorId) }),
        chiefComplaint: values.chiefComplaint || undefined,
        remarks: values.remarks || undefined,
      });
      toast.success(
        `${result.data.visitNumber} created for ${result.data.patient.firstName} ${result.data.patient.lastName}.`
      );
      router.push(`/visits?date=${encodeURIComponent(result.data.visitDate)}`);
    } catch (error) {
      setServerErrors(getApiErrors(error));
    }
  });

  return (
    <div className="space-y-4 pb-20">
      <Button type="button" variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/visits">
          <ArrowLeft className="size-4" />
          Visits
        </Link>
      </Button>

      <Card className="shadow-fluent-2 py-3">
        <CardContent className="space-y-3 px-4">
          <div className="flex items-center justify-between gap-4 text-sm font-medium">
            <span className={step === 'patient' ? 'text-primary' : 'text-muted-foreground'}>
              1 · Patient information
            </span>
            <span className={step === 'visit' ? 'text-primary' : 'text-muted-foreground'}>
              2 · Visit details
            </span>
          </div>
          <Progress
            value={step === 'patient' ? 50 : 100}
            aria-label={`Step ${step === 'patient' ? 1 : 2} of 2`}
          />
        </CardContent>
      </Card>

      {dependencyError ? (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Could not load Visit options</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>{getApiErrors(dependencyError)[0]}</p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => void retryDependencies()}
            >
              <RefreshCcw className="size-4" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      {serverErrors.length > 0 ? (
        <Alert variant="destructive" role="alert">
          <AlertCircle className="size-4" />
          <AlertTitle>Could not create Visit</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-4">
              {serverErrors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-4">
          {step === 'patient' ? (
            <>
              <VisitSourceFields
                control={form.control}
                errors={form.formState.errors}
                setValue={form.setValue}
                appointments={appointments}
                patients={patients}
                doctors={doctors}
                visitTypes={visitTypes}
                loading={loading}
              />
              <PatientRegistrationSection
                patient={patient}
                loading={patientQuery.isLoading}
                error={patientQuery.error}
                onRetry={() => void patientQuery.refetch()}
                onContinue={() => setStep('visit')}
              />
            </>
          ) : (
            <>
              <Button type="button" variant="ghost" size="sm" onClick={() => setStep('patient')}>
                <ArrowLeft className="size-4" />
                Patient information
              </Button>
              <VisitDetailsFields
                control={form.control}
                errors={form.formState.errors}
                setValue={form.setValue}
                appointments={appointments}
                patients={patients}
                doctors={doctors}
                visitTypes={visitTypes}
                loading={loading}
              />
            </>
          )}
        </div>
        <aside className="space-y-4 xl:sticky xl:top-20">
          <PatientContextCard patient={patient} loading={patientQuery.isLoading} />
          <AppointmentContextCard appointment={appointment} />
          {patient ? <Badge variant="outline">{patient.mrn}</Badge> : null}
        </aside>
      </div>

      {step === 'visit' ? (
        <Card className="acrylic shadow-fluent-16 fixed right-4 bottom-4 left-4 z-20 py-3 lg:left-[calc(var(--sidebar-width)+1rem)]">
          <CardContent className="flex justify-end gap-2 px-3">
            <Button type="button" variant="outline" onClick={() => setStep('patient')}>
              Back
            </Button>
            <Button
              type="button"
              disabled={!canCreate || !patient || loading || checkInMutation.isPending}
              aria-busy={checkInMutation.isPending}
              onClick={() => void submit()}
            >
              <CheckCircle2 className="size-4" />
              {checkInMutation.isPending ? 'Creating…' : 'Create Visit'}
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
