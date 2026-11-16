'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { AlertCircle, Leaf, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';

import { tenantLocalDateTime } from '@/app/api/lib/modules/appointment/schemas/appointment-slot';
import type { VisitType } from '@/app/api/lib/modules/visit-type/schemas/visit-type-schema';
import { getApiErrors } from '@/app/queries/api-error';
import { useAppointmentQuery } from '@/app/queries/appointments/useAppointment';
import { useAppointmentsQuery } from '@/app/queries/appointments/useAppointments';
import { useChargeItemsQuery } from '@/app/queries/billing/charge-items/useChargeItems';
import { useAddInvoiceLine } from '@/app/queries/billing/invoices/useAddInvoiceLine';
import { useCreateInvoice } from '@/app/queries/billing/invoices/useCreateInvoice';
import { useFinalizeInvoice } from '@/app/queries/billing/invoices/useFinalizeInvoice';
import { useRecordPayment } from '@/app/queries/billing/invoices/useRecordPayment';
import { useDoctorsQuery } from '@/app/queries/doctors/useDoctors';
import {
  useCurrentUserQuery,
  useHasPermission,
} from '@/app/queries/identity-access/useCurrentUser';
import { usePatientTreatmentPlanHistoryQuery } from '@/app/queries/patient-treatment-plans/usePatientTreatmentPlans';
import { usePatientQuery } from '@/app/queries/patients/usePatients';
import { useAdmitSourcesQuery } from '@/app/queries/visit-masters/admit-sources/useAdmitSources';
import { useVisitTypesQuery } from '@/app/queries/visit-masters/visit-types/useVisitTypes';
import { useCheckInVisit } from '@/app/queries/visits/useCheckInVisit';
import { useRecentDoctorVisitQuery } from '@/app/queries/visits/useRecentDoctorVisit';
import { useVisitPatientTypeQuery } from '@/app/queries/visits/useVisitPatientType';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';

import {
  createVisitFormSchema,
  type CreateVisitFormValues,
} from '../_utils/create-visit-form-schema';
import { billingTotals } from '../_utils/billing-choice';
import { checkInInvoiceNotes } from '../_utils/check-in-invoice-notes';
import {
  getAppointmentVisitDefaults,
  getWalkInVisitTypeId,
} from '../_utils/appointment-visit-defaults';
import { patientDisplayName } from '../_utils/patient-summary';
import { CheckInActionBar } from './check-in-action-bar';
import { CheckInHeader } from './check-in-header';
import { PatientConfirmation } from './patient-confirmation';
import { PatientTreatmentsCard } from './patient-treatments-card';
import { VisitBillingFields } from './visit-billing-fields';
import { VisitDetailsFields, VisitSourceFields } from './visit-form-fields';
import { useAppointmentVisitPrefill } from './use-appointment-visit-prefill';
import CreateVisitLoader from '../loader';

const DEFAULT_VALUES: CreateVisitFormValues = {
  mode: 'appointment',
  appointmentId: '',
  patientId: '',
  doctorId: '',
  visitTypeId: '',
  admitSourceId: '',
  chiefComplaint: '',
  remarks: '',
  createInvoice: false,
  paymentTiming: 'LATER',
  paymentClassification: 'SELF_PAY',
  insurer: '',
  policyReference: '',
  chargeKind: '',
  chargeItemId: '',
  chargeAmount: '',
  amountReceived: '0',
  paymentMethod: 'CASH',
  paymentReference: '',
};
const EMPTY_VISIT_TYPES: VisitType[] = [];

export function CreateVisitPageImpl({
  initialAppointmentId = null,
}: {
  initialAppointmentId?: number | null;
}) {
  const router = useRouter();
  const [confirmedPatientId, setConfirmedPatientId] = useState<number | null>(null);
  const [checkingHistory, setCheckingHistory] = useState(false);
  const [historyError, setHistoryError] = useState(false);
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
    defaultValues: {
      ...DEFAULT_VALUES,
      appointmentId: initialAppointmentId ? String(initialAppointmentId) : '',
    },
  });

  const mode = useWatch({ control: form.control, name: 'mode' });
  const appointmentId = useWatch({ control: form.control, name: 'appointmentId' });
  const patientId = useWatch({ control: form.control, name: 'patientId' });
  const includeInvoice = useWatch({ control: form.control, name: 'createInvoice' });
  const amountReceived = useWatch({ control: form.control, name: 'amountReceived' });
  const paymentTiming = useWatch({ control: form.control, name: 'paymentTiming' });
  const chargeAmount = useWatch({ control: form.control, name: 'chargeAmount' });
  const visitTypeId = useWatch({ control: form.control, name: 'visitTypeId' });
  const doctorId = useWatch({ control: form.control, name: 'doctorId' });

  const appointmentsQuery = useAppointmentsQuery({
    statusCategories: ['SCHEDULED', 'CONFIRMED'],
    page: 1,
    limit: 999,
  });
  const initialAppointmentQuery = useAppointmentQuery(initialAppointmentId);
  const doctorsQuery = useDoctorsQuery({ page: 1, limit: 100, status: 'active' });
  const visitTypesQuery = useVisitTypesQuery({ limit: 100 });
  const admitSourcesQuery = useAdmitSourcesQuery({ limit: 100 });
  const chargeItemsQuery = useChargeItemsQuery({ page: 1, limit: 999, isActive: true });
  const currentUserQuery = useCurrentUserQuery();
  const { data: canCreate } = useHasPermission('visit:create');
  const { data: canCreateInvoice } = useHasPermission('invoice:create');
  const { data: canReadInvoice } = useHasPermission('invoice:read');
  const { data: canUpdateInvoice } = useHasPermission('invoice:update');
  const { data: canFinalizeInvoice } = useHasPermission('invoice:finalize');
  const { data: canRecordPayment } = useHasPermission('payment:record');
  const { data: canReadChargeItems } = useHasPermission('charge-item:read');
  const { data: canReadTreatmentPlans } = useHasPermission('patient-treatment-plan:read');
  const checkInMutation = useCheckInVisit();
  const createInvoiceMutation = useCreateInvoice();
  const addInvoiceLineMutation = useAddInvoiceLine();
  const finalizeInvoiceMutation = useFinalizeInvoice();
  const recordPaymentMutation = useRecordPayment();

  const listedAppointments = appointmentsQuery.data?.data ?? [];
  const initialAppointment = initialAppointmentQuery.data;
  const appointments = initialAppointment
    ? [
        initialAppointment,
        ...listedAppointments.filter((item) => item.id !== initialAppointment.id),
      ]
    : listedAppointments;
  const doctors = doctorsQuery.data?.data ?? [];
  const visitTypes = visitTypesQuery.data?.data ?? EMPTY_VISIT_TYPES;
  const admitSources = admitSourcesQuery.data?.data ?? [];
  const chargeItems = chargeItemsQuery.data?.data ?? [];
  const canBill = Boolean(
    canCreateInvoice &&
    canReadInvoice &&
    canUpdateInvoice &&
    canFinalizeInvoice &&
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
  useAppointmentVisitPrefill({
    form,
    selectedAppointmentId: appointmentId,
    initialAppointmentId,
    initialAppointment,
    visitTypes,
  });
  const selectedPatientId =
    mode === 'appointment'
      ? (appointment?.patient.id ?? null)
      : patientId
        ? Number(patientId)
        : null;
  const patientQuery = usePatientQuery(selectedPatientId);
  const patient = patientQuery.data ?? null;
  const patientTypeQuery = useVisitPatientTypeQuery(selectedPatientId);
  const treatmentPlansQuery = usePatientTreatmentPlanHistoryQuery(
    selectedPatientId,
    Boolean(canReadTreatmentPlans)
  );
  const selectedVisitType = visitTypes.find((type) => String(type.id) === visitTypeId);
  const referenceDate = currentUserQuery.data?.tenant.timeZone
    ? tenantLocalDateTime(new Date(), currentUserQuery.data.tenant.timeZone).date
    : null;
  const recentDoctorVisitQuery = useRecentDoctorVisitQuery(selectedPatientId, referenceDate);
  const loading =
    appointmentsQuery.isLoading ||
    initialAppointmentQuery.isLoading ||
    doctorsQuery.isLoading ||
    visitTypesQuery.isLoading ||
    admitSourcesQuery.isLoading ||
    currentUserQuery.isLoading;
  const dependencyError =
    appointmentsQuery.error ??
    initialAppointmentQuery.error ??
    doctorsQuery.error ??
    visitTypesQuery.error ??
    admitSourcesQuery.error ??
    currentUserQuery.error;

  async function retryDependencies() {
    await Promise.all([
      appointmentsQuery.refetch(),
      initialAppointmentId ? initialAppointmentQuery.refetch() : Promise.resolve(),
      doctorsQuery.refetch(),
      visitTypesQuery.refetch(),
      admitSourcesQuery.refetch(),
      currentUserQuery.refetch(),
    ]);
  }

  // Confirmation belongs to one Patient: choosing another Patient or Appointment
  // for a different Patient re-locks the Visit and Billing sections.
  const confirmed = selectedPatientId !== null && confirmedPatientId === selectedPatientId;
  const stepRef = useRef<HTMLDivElement>(null);

  // Moving between the Patient step and the Visit step swaps the page content,
  // so bring the new step into view instead of leaving staff mid-scroll.
  useEffect(() => {
    stepRef.current?.scrollIntoView?.({ block: 'start' });
  }, [confirmed]);

  async function confirmPatient() {
    setCheckingHistory(true);

    try {
      const history = referenceDate ? await recentDoctorVisitQuery.refetch() : null;
      const hasRecentDoctorVisit = Boolean(history?.data);
      setHistoryError(!referenceDate || Boolean(history?.isError));

      if (!form.getFieldState('visitTypeId').isDirty) {
        const visitTypeId =
          mode === 'appointment'
            ? getAppointmentVisitDefaults(
                appointment ?? undefined,
                visitTypes,
                hasRecentDoctorVisit
              ).visitTypeId
            : getWalkInVisitTypeId(visitTypes, hasRecentDoctorVisit);
        form.setValue('visitTypeId', visitTypeId, { shouldValidate: true });
      }

      setConfirmedPatientId(selectedPatientId);
    } finally {
      setCheckingHistory(false);
    }
  }

  const submit = form.handleSubmit(async (values) => {
    setServerErrors([]);
    let paymentReceiptPath: string | null = null;
    if (createdVisit) return;
    if (!patient || !confirmed) {
      setServerErrors(['Select a Patient or Appointment before creating the Visit.']);
      setConfirmedPatientId(null);
      return;
    }
    const patientTypeCheck = await patientTypeQuery.refetch();
    if (!patientTypeCheck.isSuccess) {
      setServerErrors(['Patient type could not be verified. Retry before creating the Visit.']);
      return;
    }
    if (values.mode === 'appointment' && !appointment) {
      form.setError('appointmentId', { message: 'Select an Appointment scheduled today.' });
      setConfirmedPatientId(null);
      return;
    }
    if (values.mode === 'appointment' && !appointment?.doctor && !values.doctorId) {
      form.setError('doctorId', { message: 'Doctor is required for this Appointment.' });
      return;
    }

    if (
      values.createInvoice &&
      (!canBill ||
        (values.paymentTiming === 'NOW' && !canRecordPayment) ||
        chargeItemsQuery.isLoading ||
        chargeItemsQuery.isError)
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
        admitSourceId: values.admitSourceId ? Number(values.admitSourceId) : undefined,
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
        await finalizeInvoiceMutation.mutateAsync(invoice.data.id);
        if (values.paymentTiming === 'NOW') {
          const recordedPayment = await recordPaymentMutation.mutateAsync({
            id: invoice.data.id,
            request: {
              amount: Number(values.amountReceived),
              method: values.paymentMethod,
              reference: values.paymentReference || undefined,
            },
          });
          paymentReceiptPath = `/billing/${invoice.data.id}?receipt=${recordedPayment.data.payment.id}`;
        }
      } catch (error) {
        setServerErrors(getApiErrors(error));
        return;
      }
    }

    toast.success(
      `${result.data.visitNumber} created${values.createInvoice ? ' with Billing' : ''}.`
    );
    router.push(paymentReceiptPath ?? `/visits?date=${encodeURIComponent(result.data.visitDate)}`);
  });

  const submitting = checkInMutation.isPending || billingPending;
  const assignedDoctorName =
    appointment?.doctor?.name ?? doctors.find((doctor) => String(doctor.id) === doctorId)?.name;
  const primaryLabel = submitting
    ? billingPending
      ? 'Completing Billing…'
      : 'Creating Visit…'
    : createdVisit
      ? 'Visit created'
      : !confirmed
        ? checkingHistory
          ? 'Checking Visit history…'
          : 'Confirm Patient'
        : includeInvoice && paymentTiming === 'NOW' && Number(amountReceived) > 0
          ? 'Create Visit & Record Payment'
          : includeInvoice
            ? 'Create Visit & Invoice'
            : 'Create Visit';
  const primaryDisabled = !confirmed
    ? !patient || patient.registrationStatus !== 'registered' || checkingHistory || loading
    : !canCreate || loading || submitting || Boolean(createdVisit);

  if (loading) return <CreateVisitLoader />;

  return (
    <div className="space-y-4 pb-28">
      <CheckInHeader referenceDate={referenceDate} confirmed={confirmed} />

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
        <div ref={stepRef} className="scroll-mt-20 space-y-4">
          {confirmed ? (
            <div className="space-y-4" inert={Boolean(createdVisit)}>
              <div className="bg-card shadow-fluent-2 rounded-xl">
                <PatientConfirmation
                  key={patient?.id ?? 'none'}
                  patient={patient}
                  appointment={appointment}
                  loading={patientQuery.isLoading}
                  error={patientQuery.error}
                  onRetry={() => void patientQuery.refetch()}
                  confirmed
                  confirming={checkingHistory}
                  onConfirm={confirmPatient}
                  onChange={() => setConfirmedPatientId(null)}
                />
              </div>
              <VisitDetailsFields
                control={form.control}
                errors={form.formState.errors}
                setValue={form.setValue}
                resetField={form.resetField}
                appointments={appointments}
                selectedPatient={patient}
                doctors={doctors}
                visitTypes={visitTypes}
                admitSources={admitSources}
                loading={loading}
                historyError={historyError}
                recentDoctorVisit={recentDoctorVisitQuery.data}
                patientType={patientTypeQuery.data ?? null}
                patientTypeLoading={patientTypeQuery.isLoading || patientTypeQuery.isFetching}
                patientTypeError={patientTypeQuery.isError}
                onRetryPatientType={() => void patientTypeQuery.refetch()}
              />
              <VisitBillingFields
                control={form.control}
                errors={form.formState.errors}
                setValue={form.setValue}
                chargeItems={chargeItems}
                canBill={canBill}
                canCollectPayment={Boolean(canRecordPayment)}
                visitTypeCode={selectedVisitType?.code.toUpperCase() ?? null}
                patientType={patientTypeQuery.data?.patientType ?? null}
                visitDate={referenceDate}
                hasRecentDoctorVisit={Boolean(recentDoctorVisitQuery.data)}
                loading={chargeItemsQuery.isLoading}
                error={chargeItemsQuery.isError}
                onRetry={() => void chargeItemsQuery.refetch()}
              />
            </div>
          ) : (
            <VisitSourceFields
              control={form.control}
              errors={form.formState.errors}
              setValue={form.setValue}
              resetField={form.resetField}
              appointments={appointments}
              selectedPatient={patient}
              doctors={doctors}
              visitTypes={visitTypes}
              admitSources={admitSources}
              loading={loading}
            >
              <PatientConfirmation
                key={patient?.id ?? 'none'}
                patient={patient}
                appointment={appointment}
                loading={patientQuery.isLoading}
                error={patientQuery.error}
                onRetry={() => void patientQuery.refetch()}
                confirmed={false}
                confirming={checkingHistory}
                onConfirm={confirmPatient}
                onChange={() => setConfirmedPatientId(null)}
              />
            </VisitSourceFields>
          )}
        </div>
        <aside
          aria-label="Patient context"
          className="space-y-4 xl:sticky xl:top-20 xl:-mx-1 xl:max-h-[calc(100svh-10rem)] xl:overflow-y-auto xl:px-1 xl:pb-1"
        >
          {selectedPatientId !== null && canReadTreatmentPlans ? (
            <PatientTreatmentsCard
              plans={treatmentPlansQuery.data ?? []}
              loading={treatmentPlansQuery.isLoading}
              error={treatmentPlansQuery.isError}
              onRetry={() => void treatmentPlansQuery.refetch()}
              linkedBookingNumber={appointment?.bookingNumber ?? null}
            />
          ) : (
            <Empty className="bg-card shadow-fluent-2 border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Leaf className="size-5" />
                </EmptyMedia>
                <EmptyTitle>Treatment Plans</EmptyTitle>
                <EmptyDescription>
                  {selectedPatientId === null
                    ? "The Patient's Treatment Plans appear here once a Patient is selected."
                    : 'You do not have permission to view Treatment Plans.'}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </aside>
      </div>

      <CheckInActionBar
        patientName={patient ? patientDisplayName(patient) : null}
        visitSummary={
          confirmed
            ? [selectedVisitType?.name, assignedDoctorName].filter(Boolean).join(' · ') || null
            : null
        }
        totals={billingTotals({
          createInvoice: includeInvoice,
          paymentTiming,
          chargeAmount,
          amountReceived,
        })}
        showTotals={confirmed}
        primaryLabel={primaryLabel}
        primaryDisabled={primaryDisabled}
        busy={checkInMutation.isPending || billingPending || checkingHistory}
        backDisabled={checkInMutation.isPending || billingPending || Boolean(createdVisit)}
        onBack={confirmed ? () => setConfirmedPatientId(null) : undefined}
        onPrimary={() => (confirmed ? void submit() : void confirmPatient())}
      />
    </div>
  );
}
