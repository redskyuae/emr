'use client';

import Link from 'next/link';
import { useState } from 'react';
import { AlertCircle, ArrowLeft, CheckCircle2, RefreshCcw, RotateCcw } from 'lucide-react';

import { useAppointmentModesQuery } from '@/app/queries/appointment-masters/useAppointmentModes';
import { useAppointmentsQuery } from '@/app/queries/appointments/useAppointments';
import { useDoctorsQuery } from '@/app/queries/doctors/useDoctors';
import { usePatientQuery, usePatientsQuery } from '@/app/queries/patients/usePatients';
import { useVisitTypesQuery } from '@/app/queries/visit-masters/visit-types/useVisitTypes';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

import {
  AppointmentContextCard,
  DocumentsCard,
  PatientContextCard,
  PaymentContextCard,
} from './visit-context-rail';
import {
  CardInformationSection,
  VisitDetailsSection,
  VisitSourceSection,
  type CreateVisitUiValues,
} from './visit-dropdown-sections';
import { PatientRegistrationSection } from './patient-registration-section';

function todayDisplayDate() {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, '0');
  const month = String(today.getMonth() + 1).padStart(2, '0');
  return `${day}-${month}-${today.getFullYear()}`;
}

const INITIAL_VALUES: CreateVisitUiValues = {
  mode: 'appointment',
  appointmentId: '',
  patientId: '',
  patientClass: 'outpatient',
  visitTypeId: '',
  department: '',
  doctorId: '',
  patientType: 'existing',
  visitModeId: '',
  chiefComplaint: '',
  remarks: '',
  visitClassification: 'cash',
  visitCard: 'primary',
  payerReceiver: '',
  policy: '',
  policyHolder: '',
  membershipId: '',
  coverageStartDate: '',
  coverageEndDate: '',
  scannerEnabled: false,
};

type CreateVisitStep = 'patient' | 'visit';

function CreateVisitProgress({ step }: { step: CreateVisitStep }) {
  return (
    <Card className="shadow-fluent-2 py-3">
      <CardContent className="space-y-3 px-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex min-w-0 items-center gap-2">
            <span
              className={cn(
                'flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold',
                step === 'patient'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-primary/10 text-primary border-primary/20'
              )}
            >
              1
            </span>
            <span className="min-w-0 text-sm font-medium">Patient information</span>
          </div>
          <div className="flex min-w-0 items-center gap-2">
            <span
              className={cn(
                'flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold',
                step === 'visit'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              2
            </span>
            <span className="min-w-0 text-sm font-medium">Visit and card details</span>
          </div>
        </div>
        <Progress
          value={step === 'patient' ? 50 : 100}
          aria-label={`Step ${step === 'patient' ? 1 : 2} of 2`}
        />
      </CardContent>
    </Card>
  );
}

export function CreateVisitPageImpl() {
  const [values, setValues] = useState<CreateVisitUiValues>(INITIAL_VALUES);
  const [step, setStep] = useState<CreateVisitStep>('patient');

  const appointmentsQuery = useAppointmentsQuery({
    slotDate: todayDisplayDate(),
    page: 1,
    limit: 100,
  });
  const patientsQuery = usePatientsQuery({ page: 1, limit: 100, isActive: true });
  const doctorsQuery = useDoctorsQuery({ page: 1, limit: 100, status: 'active' });
  const visitTypesQuery = useVisitTypesQuery({ page: 1, limit: 100 });
  const visitModesQuery = useAppointmentModesQuery({ page: 1, limit: 100 });

  const appointments = appointmentsQuery.data?.data ?? [];
  const patients = patientsQuery.data?.data ?? [];
  const doctors = doctorsQuery.data?.data ?? [];
  const visitTypes = visitTypesQuery.data?.data ?? [];
  const visitModes = visitModesQuery.data?.data ?? [];

  const selectedAppointment =
    values.mode === 'appointment'
      ? (appointments.find((appointment) => String(appointment.id) === values.appointmentId) ??
        null)
      : null;
  const selectedPatientId = (selectedAppointment?.patient.id ?? Number(values.patientId)) || null;
  const patientQuery = usePatientQuery(selectedPatientId);
  const selectedPatient = patientQuery.data ?? null;

  function changeValue<K extends keyof CreateVisitUiValues>(key: K, value: CreateVisitUiValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  const hasDependencyError =
    appointmentsQuery.isError ||
    patientsQuery.isError ||
    doctorsQuery.isError ||
    visitTypesQuery.isError ||
    visitModesQuery.isError;

  async function retryDependencies() {
    await Promise.all([
      appointmentsQuery.refetch(),
      patientsQuery.refetch(),
      doctorsQuery.refetch(),
      visitTypesQuery.refetch(),
      visitModesQuery.refetch(),
    ]);
  }

  function resetVisit() {
    setValues(INITIAL_VALUES);
    setStep('patient');
  }

  return (
    <div className={cn('space-y-4', step === 'visit' && 'pb-24')}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button type="button" variant="ghost" size="sm" asChild className="-ml-2 w-fit">
          <Link href="/visits">
            <ArrowLeft className="size-4" />
            Visits
          </Link>
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">
            {values.mode === 'appointment' ? 'From Appointment' : 'Walk-in'}
          </Badge>
        </div>
      </div>

      <CreateVisitProgress step={step} />

      {hasDependencyError ? (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Some dropdown options could not be loaded</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>One or more Visit dependencies are unavailable.</p>
            <Button type="button" size="sm" variant="outline" onClick={retryDependencies}>
              <RefreshCcw className="size-4" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-4">
          {step === 'patient' ? (
            <>
              <VisitSourceSection
                values={values}
                appointments={appointments}
                patients={patients}
                appointmentsLoading={appointmentsQuery.isLoading}
                patientsLoading={patientsQuery.isLoading}
                onChange={changeValue}
              />
              <PatientRegistrationSection
                patient={selectedPatient}
                loading={patientQuery.isLoading}
                error={patientQuery.isError ? patientQuery.error : null}
                onRetry={() => void patientQuery.refetch()}
                onContinue={() => setStep('visit')}
              />
            </>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3">
                <Button type="button" variant="ghost" size="sm" onClick={() => setStep('patient')}>
                  <ArrowLeft className="size-4" />
                  Patient information
                </Button>
                <Badge variant="secondary" className="hidden sm:inline-flex">
                  {selectedPatient?.mrn}
                </Badge>
              </div>
              <VisitDetailsSection
                values={values}
                doctors={doctors}
                visitTypes={visitTypes}
                visitModes={visitModes}
                selectedAppointment={selectedAppointment}
                dependenciesLoading={
                  doctorsQuery.isLoading || visitTypesQuery.isLoading || visitModesQuery.isLoading
                }
                onChange={changeValue}
              />
              <CardInformationSection values={values} onChange={changeValue} />
            </>
          )}
        </div>

        <aside className="space-y-4 xl:sticky xl:top-20">
          <PatientContextCard patient={selectedPatient} loading={patientQuery.isLoading} />
          <AppointmentContextCard appointment={selectedAppointment} />
          {step === 'visit' ? (
            <>
              <PaymentContextCard patient={selectedPatient} />
              <DocumentsCard />
            </>
          ) : null}
        </aside>
      </div>

      {step === 'visit' ? (
        <Card className="acrylic shadow-fluent-16 fixed right-4 bottom-4 left-4 z-20 py-3 lg:left-[calc(var(--sidebar-width)+1rem)]">
          <CardContent className="flex items-center justify-end gap-2 px-3 sm:justify-between">
            <Badge variant="secondary" className="hidden w-fit sm:inline-flex">
              {values.mode === 'appointment' ? 'Appointment Visit' : 'Walk-in Visit'}
            </Badge>
            <div className="flex gap-2 sm:justify-end">
              <Button type="button" variant="ghost" onClick={() => setStep('patient')}>
                <ArrowLeft className="size-4" />
                Back
              </Button>
              <Button type="button" variant="outline" onClick={resetVisit}>
                <RotateCcw className="size-4" />
                Reset
              </Button>
              <Button type="button" disabled={!selectedPatient}>
                <CheckCircle2 className="size-4" />
                Create Visit
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
