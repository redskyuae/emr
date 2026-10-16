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
import { useChargeItemsQuery } from '@/app/queries/billing/charge-items/useChargeItems';
import { useAddInvoiceLine } from '@/app/queries/billing/invoices/useAddInvoiceLine';
import { useCreateInvoice } from '@/app/queries/billing/invoices/useCreateInvoice';
import { useFinalizeInvoice } from '@/app/queries/billing/invoices/useFinalizeInvoice';
import { useRecordPayment } from '@/app/queries/billing/invoices/useRecordPayment';
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
import { checkInInvoiceNotes } from '../_utils/check-in-invoice-notes';
import { PatientRegistrationSection } from './patient-registration-section';
import { VisitBillingFields } from './visit-billing-fields';
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
  createInvoice: false,
  paymentClassification: 'SELF_PAY',
  insurer: '',
  policyReference: '',
  chargeItemId: '',
  chargeAmount: '',
  amountReceived: '0',
  paymentMethod: 'CASH',
  paymentReference: '',
};

export function CreateVisitPageImpl() {
  const router = useRouter();
  const [step, setStep] = useState<'patient' | 'visit'>('patient');
  const [serverErrors, setServerErrors] = useState<string[]>([]);
  const [createdVisit, setCreatedVisit] = useState<{
    id: number;
    patientId: number;
    visitNumber: string;
    visitDate: string;
  } | null>(null);
  const [createdInvoiceId, setCreatedInvoiceId] = useState<number | null>(null);
  const form = useForm<CreateVisitFormValues>({
    resolver: zodResolver(createVisitFormSchema),
    mode: 'onTouched',
    defaultValues: DEFAULT_VALUES,
  });

  const mode = useWatch({ control: form.control, name: 'mode' });
  const appointmentId = useWatch({ control: form.control, name: 'appointmentId' });
  const patientId = useWatch({ control: form.control, name: 'patientId' });
  const includeInvoice = useWatch({ control: form.control, name: 'createInvoice' });
  const amountReceived = useWatch({ control: form.control, name: 'amountReceived' });

  const appointmentsQuery = useAppointmentsQuery({
    statusCategories: ['SCHEDULED', 'CONFIRMED'],
    page: 1,
    limit: 999,
  });
  const patientsQuery = usePatientsQuery({ page: 1, limit: 100, isActive: true });
  const doctorsQuery = useDoctorsQuery({ page: 1, limit: 100, status: 'active' });
  const visitTypesQuery = useVisitTypesQuery({ limit: 100 });
  const chargeItemsQuery = useChargeItemsQuery({ page: 1, limit: 999, isActive: true });
  const { data: canCreate } = useHasPermission('visit:create');
  const { data: canCreateInvoice } = useHasPermission('invoice:create');
  const { data: canReadInvoice } = useHasPermission('invoice:read');
  const { data: canUpdateInvoice } = useHasPermission('invoice:update');
  const { data: canFinalizeInvoice } = useHasPermission('invoice:finalize');
  const { data: canRecordPayment } = useHasPermission('payment:record');
  const { data: canReadChargeItems } = useHasPermission('charge-item:read');
  const checkInMutation = useCheckInVisit();
  const createInvoiceMutation = useCreateInvoice();
  const addInvoiceLineMutation = useAddInvoiceLine();
  const finalizeInvoiceMutation = useFinalizeInvoice();
  const recordPaymentMutation = useRecordPayment();

  const appointments = appointmentsQuery.data?.data ?? [];
  const patients = patientsQuery.data?.data ?? [];
  const doctors = doctorsQuery.data?.data ?? [];
  const visitTypes = visitTypesQuery.data?.data ?? [];
  const chargeItems = chargeItemsQuery.data?.data ?? [];
  const canBill = Boolean(
    canCreateInvoice &&
    canReadInvoice &&
    canUpdateInvoice &&
    canFinalizeInvoice &&
    canRecordPayment &&
    canReadChargeItems
  );
  const billingPending =
    createInvoiceMutation.isPending ||
    addInvoiceLineMutation.isPending ||
    finalizeInvoiceMutation.isPending ||
    recordPaymentMutation.isPending;
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
    if (createdVisit) return;
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

    if (
      values.createInvoice &&
      (!canBill || chargeItemsQuery.isLoading || chargeItemsQuery.isError)
    ) {
      setServerErrors([
        'Billing is not available at Check-in. Create the Visit without an Invoice or retry loading Charge Items.',
      ]);
      return;
    }

    let result;
    try {
      result = await checkInMutation.mutateAsync({
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
    } catch (error) {
      setServerErrors(getApiErrors(error));
      return;
    }

    setCreatedVisit({
      id: result.data.id,
      patientId: result.data.patient.id,
      visitNumber: result.data.visitNumber,
      visitDate: result.data.visitDate,
    });

    if (values.createInvoice) {
      try {
        const invoice = await createInvoiceMutation.mutateAsync({
          patientId: result.data.patient.id,
          visitId: result.data.id,
          notes: checkInInvoiceNotes(values),
        });
        setCreatedInvoiceId(invoice.data.id);
        await addInvoiceLineMutation.mutateAsync({
          id: invoice.data.id,
          request: {
            chargeItemId: Number(values.chargeItemId),
            quantity: 1,
            unitPrice: Number(values.chargeAmount),
          },
        });
        if (Number(values.amountReceived) > 0) {
          await finalizeInvoiceMutation.mutateAsync(invoice.data.id);
          await recordPaymentMutation.mutateAsync({
            id: invoice.data.id,
            request: {
              amount: Number(values.amountReceived),
              method: values.paymentMethod,
              reference: values.paymentReference || undefined,
            },
          });
        }
      } catch (error) {
        setServerErrors(getApiErrors(error));
        return;
      }
    }

    toast.success(
      `${result.data.visitNumber} created${values.createInvoice ? ' with Billing' : ''}.`
    );
    router.push(`/visits?date=${encodeURIComponent(result.data.visitDate)}`);
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
          <AlertTitle>
            {createdVisit ? 'Visit created; Billing needs attention' : 'Could not create Visit'}
          </AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-4">
              {serverErrors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
            {createdVisit ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <Button asChild size="sm" variant="outline">
                  <Link href={`/visits/${createdVisit.id}`}>Open {createdVisit.visitNumber}</Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link
                    href={
                      createdInvoiceId
                        ? `/billing/${createdInvoiceId}`
                        : `/billing?invoice=new&patientId=${createdVisit.patientId}&visitId=${createdVisit.id}`
                    }
                  >
                    {createdInvoiceId ? 'Finish Invoice' : 'Create Invoice in Billing'}
                  </Link>
                </Button>
              </div>
            ) : null}
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
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={checkInMutation.isPending || billingPending || Boolean(createdVisit)}
                onClick={() => setStep('patient')}
              >
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
              <VisitBillingFields
                control={form.control}
                errors={form.formState.errors}
                setValue={form.setValue}
                chargeItems={chargeItems}
                canBill={canBill}
                loading={chargeItemsQuery.isLoading}
                error={chargeItemsQuery.isError}
                onRetry={() => void chargeItemsQuery.refetch()}
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
            <Button
              type="button"
              variant="outline"
              disabled={checkInMutation.isPending || billingPending || Boolean(createdVisit)}
              onClick={() => setStep('patient')}
            >
              Back
            </Button>
            <Button
              type="button"
              disabled={
                !canCreate ||
                !patient ||
                loading ||
                checkInMutation.isPending ||
                billingPending ||
                Boolean(createdVisit)
              }
              aria-busy={checkInMutation.isPending || billingPending}
              onClick={() => void submit()}
            >
              <CheckCircle2 className="size-4" />
              {checkInMutation.isPending || billingPending
                ? billingPending
                  ? 'Completing Billing…'
                  : 'Creating Visit…'
                : createdVisit
                  ? 'Visit created'
                  : includeInvoice && Number(amountReceived) > 0
                    ? 'Create Visit & Record Payment'
                    : includeInvoice
                      ? 'Create Visit & Invoice'
                      : 'Create Visit'}
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
