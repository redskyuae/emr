'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDebouncedValue } from '@tanstack/react-pacer';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

import { getApiErrorMessage } from '@/app/queries/api-error';
import { useAppointmentReasonsQuery } from '@/app/queries/appointment-masters/reasons/useAppointmentReasons';
import { useAppointmentTypesQuery } from '@/app/queries/appointment-masters/types/useAppointmentTypes';
import { useAppointmentModesQuery } from '@/app/queries/appointment-masters/useAppointmentModes';
import {
  AppointmentApiError,
  useCreateAppointment,
} from '@/app/queries/appointments/useCreateAppointment';
import { useDoctorSlotsQuery } from '@/app/queries/appointments/useDoctorSlots';
import { useDoctorsQuery } from '@/app/queries/doctors/useDoctors';
import { useHasPermission } from '@/app/queries/identity-access/useCurrentUser';
import { usePatientsQuery } from '@/app/queries/patients/usePatients';
import { usePatientTreatmentPlansQuery } from '@/app/queries/patient-treatment-plans/usePatientTreatmentPlans';
import { useRoomsQuery } from '@/app/queries/rooms/useRooms';
import { useTherapistsQuery } from '@/app/queries/therapists/useTherapists';
import { useTreatmentsQuery } from '@/app/queries/treatments/useTreatments';
import { usePatientVisitsQuery } from '@/app/queries/visits/useVisits';
import {
  getProcedureEndTime,
  getProcedureEndTimeForStartChange,
  getSlotTimes,
} from '../_utils/appointment-time';
import { getAvailableRooms } from '../_utils/room-availability';
import {
  bookAppointmentFormSchema,
  type BookAppointmentFormValues,
} from '../_utils/book-appointment-form-schema';
import type { BookablePatient, BookingPath } from '../_utils/book-appointment-types';
import { getTherapistsForSkill } from '../_utils/therapist-options';
import {
  submitBookAppointmentAndNavigate,
  type BookingConfirmation,
} from '../_utils/submit-book-appointment';
import {
  DEMO_FACILITY,
  getDefaultTreatmentSelection,
  getTreatmentSelectionState,
  toBookingPatientTreatmentPlan,
  toBookingTreatment,
} from './book-appointment-demo-data';
import type { TreatmentSelectionState } from './book-appointment-demo-data';

const initialValues: BookAppointmentFormValues = {
  patientId: '',
  lastName: '',
  firstName: '',
  middleName: '',
  gender: '',
  dateOfBirth: '',
  phone: '',
  email: '',
  patientMode: 'existing',
  facilityId: DEMO_FACILITY.id,
  visitType: '',
  doctorId: '',
  appointmentModeId: '',
  appointmentTypeId: '',
  appointmentReasonId: '',
  slotDate: '',
  doctorRotaId: '',
  slotTimes: [],
  selectionMode: '',
  patientTreatmentPlanId: '',
  patientTreatmentPlanSessionId: '',
  treatmentId: '',
  totalSessions: '',
  sessionId: '',
  startTime: '',
  endTime: '',
  roomId: '',
  therapistId: '',
  consentStatus: 'READY',
  approvalStatus: 'NOT_REQUIRED',
  remarks: '',
};

const masterListParams = { page: 1, limit: 999 };
const staleSlotMessage = 'One or more selected Doctor slots are no longer available.';
const stalePlanSessionMessage =
  'The selected Patient Treatment Plan Session is no longer available.';

function getErrorMessage(error: unknown) {
  return error ? getApiErrorMessage(error) : null;
}

export function useBookAppointment() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [patientSearch, setPatientSearch] = useState('');
  const [debouncedPatientSearch] = useDebouncedValue(patientSearch.trim(), { wait: 300 });
  const [treatmentSearch, setTreatmentSearch] = useState('');
  const [debouncedTreatmentSearch] = useDebouncedValue(treatmentSearch.trim(), { wait: 300 });
  const [selectedCatalogueTreatmentSnapshot, setSelectedCatalogueTreatmentSnapshot] =
    useState<ReturnType<typeof toBookingTreatment> | null>(null);
  const [selectedPatientSnapshot, setSelectedPatientSnapshot] = useState<BookablePatient | null>(
    null
  );
  const [patientMatches, setPatientMatches] = useState<BookablePatient[]>([]);
  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isProcedureEndTimeAdjusted, setProcedureEndTimeAdjusted] = useState(false);
  const appliedPlanDefaultKey = useRef<string | null>(null);
  const form = useForm<BookAppointmentFormValues>({
    mode: 'onTouched',
    defaultValues: initialValues,
    resolver: zodResolver(bookAppointmentFormSchema),
  });
  const values = { ...initialValues, ...useWatch({ control: form.control }) };
  const patientMode = values.patientMode ?? 'existing';
  const visitType = values.visitType ?? '';
  const isProcedurePath = visitType === 'PROCEDURE';

  const patientsQuery = usePatientsQuery({
    page: 1,
    limit: 10,
    query: debouncedPatientSearch || undefined,
    isActive: true,
    registrationStatus: 'registered',
  });
  const doctorsQuery = useDoctorsQuery({ page: 1, limit: 999, status: 'active' });
  const modesQuery = useAppointmentModesQuery(masterListParams);
  const typesQuery = useAppointmentTypesQuery(masterListParams);
  const reasonsQuery = useAppointmentReasonsQuery(masterListParams);
  const roomsQuery = useRoomsQuery(masterListParams);
  const therapistsQuery = useTherapistsQuery(
    { ...masterListParams, status: 'active' },
    { enabled: isProcedurePath }
  );

  const doctors = (doctorsQuery.data?.data ?? []).map((doctor) => ({
    id: doctor.id,
    name: doctor.name,
    specialty: doctor.specialtyName ?? 'Specialty not recorded',
  }));
  const selectedDoctor = doctors.find((doctor) => String(doctor.id) === values.doctorId) ?? null;
  const doctorId =
    !isProcedurePath && values.doctorId && values.doctorId !== 'not-applicable'
      ? Number(values.doctorId)
      : null;
  const doctorSlotsQuery = useDoctorSlotsQuery({ doctorId, slotDate: values.slotDate });
  const rotas = doctorSlotsQuery.data ?? [];
  const selectedRota = rotas.find((rota) => rota.id === values.doctorRotaId) ?? null;

  const selectedPatientId = values.patientId ?? '';
  const selectedPatient =
    patientMode === 'existing' && selectedPatientSnapshot?.id === Number(selectedPatientId)
      ? selectedPatientSnapshot
      : null;
  const plansQuery = usePatientTreatmentPlansQuery({
    patientId: selectedPatient?.id ?? null,
    registrationStatus: selectedPatient?.registrationStatus ?? null,
    bookingPath: visitType,
  });
  const assignPermission = useHasPermission('patient-treatment-plan:assign');
  const planOptions = (plansQuery.data ?? []).map(toBookingPatientTreatmentPlan);
  const catalogueEnabled =
    isProcedurePath &&
    selectedPatient !== null &&
    plansQuery.isSuccess &&
    planOptions.length === 0 &&
    assignPermission.data;
  const treatmentsQuery = useTreatmentsQuery(
    {
      page: 1,
      limit: 20,
      query: debouncedTreatmentSearch || undefined,
    },
    { enabled: catalogueEnabled }
  );
  const patientVisitsQuery = usePatientVisitsQuery(selectedPatient?.id ?? null);
  const selectablePatients = [...patientMatches, ...(patientsQuery.data?.data ?? [])].filter(
    (patient, index, patients) =>
      patient.isActive &&
      patient.registrationStatus === 'registered' &&
      patients.findIndex((candidate) => candidate.id === patient.id) === index
  );

  const treatmentOptions = (treatmentsQuery.data?.data ?? []).map(toBookingTreatment);
  const selectedPlan =
    planOptions.find(
      (treatment) => String(treatment.patientTreatmentPlanId) === values.patientTreatmentPlanId
    ) ?? null;
  const selectedCatalogueTreatment =
    selectedCatalogueTreatmentSnapshot?.treatmentId === Number(values.treatmentId)
      ? selectedCatalogueTreatmentSnapshot
      : (treatmentOptions.find(
          (treatment) => String(treatment.treatmentId) === values.treatmentId
        ) ?? null);
  const selectedTreatment = selectedPlan ?? selectedCatalogueTreatment;
  const selectedSession =
    selectedTreatment?.sessions.find((session) =>
      values.selectionMode === 'EXISTING_PLAN'
        ? session.id === values.patientTreatmentPlanSessionId
        : session.id === values.sessionId
    ) ?? null;
  const selectedRoom =
    (roomsQuery.data?.data ?? []).find((room) => String(room.id) === values.roomId) ?? null;
  const selectedTherapist =
    (therapistsQuery.data?.data ?? []).find(
      (therapist) => String(therapist.id) === values.therapistId
    ) ?? null;
  const resourceSession = selectedSession;
  const requiresRoom = isProcedurePath;
  const requiresTherapist = Boolean(resourceSession?.therapistSkill);
  const filteredRooms = getAvailableRooms(roomsQuery.data?.data ?? []);
  const filteredTherapists = getTherapistsForSkill(
    therapistsQuery.data?.data ?? [],
    resourceSession?.therapistSkill
      ? {
          id: resourceSession.therapistSkillId ?? null,
          name: resourceSession.therapistSkill,
        }
      : null
  );
  const createAppointment = useCreateAppointment();

  const treatmentSelectionState: TreatmentSelectionState | 'AWAITING_PATIENT' = selectedPatient
    ? getTreatmentSelectionState({
        isLoading:
          plansQuery.isLoading ||
          (plansQuery.isSuccess && planOptions.length === 0 && assignPermission.isLoading),
        plans: planOptions,
        canAssign: assignPermission.data,
      })
    : 'AWAITING_PATIENT';

  useEffect(() => {
    if (!isProcedurePath || !selectedPatient || !plansQuery.data) {
      appliedPlanDefaultKey.current = null;
      return;
    }

    const resultKey = `${selectedPatient.id}:${plansQuery.data
      .map((plan) =>
        [
          plan.id,
          plan.modifiedOn,
          ...plan.sessions.map((session) => `${session.id}:${session.isBookable}`),
        ].join(':')
      )
      .join('|')}`;
    if (appliedPlanDefaultKey.current === resultKey) return;
    appliedPlanDefaultKey.current = resultKey;

    const currentPlanId = form.getValues('patientTreatmentPlanId');
    const currentSessionId = form.getValues('patientTreatmentPlanSessionId');
    const currentPlan = planOptions.find(
      (plan) => String(plan.patientTreatmentPlanId) === currentPlanId
    );
    if (
      currentPlan?.sessions.some((session) => session.id === currentSessionId && session.isBookable)
    ) {
      return;
    }

    const defaults = getDefaultTreatmentSelection(planOptions, currentPlanId);
    if (!defaults.patientTreatmentPlanId) return;
    const defaultPlan = planOptions.find(
      (plan) => String(plan.patientTreatmentPlanId) === defaults.patientTreatmentPlanId
    );
    const defaultSession = defaultPlan?.sessions.find(
      (session) => session.id === defaults.patientTreatmentPlanSessionId
    );

    form.setValue('selectionMode', 'EXISTING_PLAN', { shouldDirty: false });
    form.setValue('patientTreatmentPlanId', defaults.patientTreatmentPlanId, {
      shouldDirty: false,
    });
    form.setValue('patientTreatmentPlanSessionId', defaults.patientTreatmentPlanSessionId, {
      shouldDirty: false,
      shouldValidate: true,
    });
    form.setValue('sessionId', defaults.patientTreatmentPlanSessionId, { shouldDirty: false });
    form.setValue('roomId', '', { shouldDirty: false });
    form.setValue('therapistId', defaultSession?.therapistSkill ? '' : 'not-required', {
      shouldDirty: false,
    });
  }, [form, isProcedurePath, planOptions, plansQuery.data, selectedPatient]);

  function clearProcedureFields() {
    appliedPlanDefaultKey.current = null;
    setTreatmentSearch('');
    setSelectedCatalogueTreatmentSnapshot(null);
    form.setValue('selectionMode', '', { shouldDirty: true });
    form.setValue('patientTreatmentPlanId', '', { shouldDirty: true });
    form.setValue('patientTreatmentPlanSessionId', '', { shouldDirty: true });
    form.setValue('treatmentId', '', { shouldDirty: true });
    form.setValue('totalSessions', '', { shouldDirty: true });
    form.setValue('sessionId', '', { shouldDirty: true });
    form.setValue('roomId', '', { shouldDirty: true });
    form.setValue('therapistId', '', { shouldDirty: true });
    form.setValue('endTime', '', { shouldDirty: true });
  }

  function clearSchedule() {
    form.setValue('slotDate', '', { shouldDirty: true });
    form.setValue('doctorRotaId', '', { shouldDirty: true });
    form.setValue('startTime', '', { shouldDirty: true });
    form.setValue('endTime', '', { shouldDirty: true });
    form.setValue('slotTimes', [], { shouldDirty: true });
  }

  function changeVisitType(next: BookingPath) {
    if (next === visitType) return;
    form.setValue('visitType', next, { shouldDirty: true, shouldValidate: true });
    setConfirmation(null);
    setSubmitError(null);
    setProcedureEndTimeAdjusted(false);
    form.clearErrors();
    form.setValue('doctorId', next === 'PROCEDURE' ? 'not-applicable' : '', {
      shouldDirty: true,
    });
    form.setValue('appointmentModeId', '', { shouldDirty: true });
    form.setValue('appointmentTypeId', '', { shouldDirty: true });
    form.setValue('appointmentReasonId', '', { shouldDirty: true });
    clearSchedule();
    clearProcedureFields();
  }

  function selectPatient(patient: BookablePatient) {
    if (selectedPatient?.id === patient.id) return;
    form.setValue('patientMode', 'existing', { shouldDirty: true });
    form.setValue('patientId', String(patient.id), { shouldDirty: true, shouldValidate: true });
    setSelectedPatientSnapshot(patient);
    setPatientSearch(`${patient.firstName} ${patient.lastName}`);
    setPatientMatches([]);
    setConfirmation(null);
    setSubmitError(null);
    setProcedureEndTimeAdjusted(false);
    clearProcedureFields();
    clearSchedule();
  }

  function changePatientMode(mode: BookAppointmentFormValues['patientMode']) {
    if (mode === patientMode) return;
    form.setValue('patientMode', mode, { shouldDirty: true, shouldValidate: true });
    form.clearErrors();
    setConfirmation(null);
    setSubmitError(null);
    setProcedureEndTimeAdjusted(false);
    setPatientMatches([]);
    setSelectedPatientSnapshot(null);
    clearProcedureFields();
    clearSchedule();
    if (mode === 'existing') {
      form.setValue('firstName', '', { shouldDirty: true });
      form.setValue('lastName', '', { shouldDirty: true });
      form.setValue('phone', '', { shouldDirty: true });
      form.setValue('email', '', { shouldDirty: true });
    } else {
      form.setValue('patientId', '', { shouldDirty: true });
    }
  }

  function changeTreatment(value: string) {
    setProcedureEndTimeAdjusted(false);
    form.setValue('selectionMode', value === '' ? '' : 'CATALOGUE', { shouldDirty: true });
    form.setValue('patientTreatmentPlanId', '', { shouldDirty: true });
    form.setValue('patientTreatmentPlanSessionId', '', { shouldDirty: true });
    form.setValue('treatmentId', value, { shouldDirty: true, shouldValidate: true });
    const treatment = treatmentOptions.find((candidate) => String(candidate.treatmentId) === value);
    setSelectedCatalogueTreatmentSnapshot(treatment ?? null);
    const firstSession = treatment?.sessions
      .slice()
      .sort((left, right) => left.sessionNumber - right.sessionNumber)[0];
    form.setValue(
      'totalSessions',
      treatment?.sessionStructure === 'REPEATABLE'
        ? String(treatment.defaultTotalSessions ?? 1)
        : '',
      { shouldDirty: true }
    );
    form.setValue('startTime', '');
    form.setValue('endTime', '');
    form.setValue('sessionId', firstSession?.id ?? '', { shouldDirty: true });
    form.setValue('roomId', '', { shouldDirty: true });
    form.setValue('therapistId', firstSession?.therapistSkill ? '' : 'not-required', {
      shouldDirty: true,
    });
  }

  function changeSession(value: string) {
    setProcedureEndTimeAdjusted(false);
    const session = selectedTreatment?.sessions.find((candidate) => candidate.id === value);
    form.setValue('sessionId', value, { shouldDirty: true, shouldValidate: true });
    if (values.selectionMode === 'EXISTING_PLAN') {
      form.setValue('patientTreatmentPlanSessionId', value, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
    form.setValue('startTime', '');
    form.setValue('endTime', '');
    form.setValue('roomId', '', { shouldDirty: true });
    form.setValue('therapistId', session?.therapistSkill ? '' : 'not-required', {
      shouldDirty: true,
    });
  }

  function changePlan(value: string) {
    setProcedureEndTimeAdjusted(false);
    const defaults = getDefaultTreatmentSelection(planOptions, value);
    const plan = planOptions.find(
      (candidate) => String(candidate.patientTreatmentPlanId) === value
    );
    const session = plan?.sessions.find(
      (candidate) => candidate.id === defaults.patientTreatmentPlanSessionId
    );
    form.setValue('selectionMode', value ? 'EXISTING_PLAN' : '', { shouldDirty: true });
    form.setValue('patientTreatmentPlanId', value, {
      shouldDirty: true,
      shouldValidate: true,
    });
    form.setValue('patientTreatmentPlanSessionId', defaults.patientTreatmentPlanSessionId, {
      shouldDirty: true,
      shouldValidate: true,
    });
    form.setValue('treatmentId', '', { shouldDirty: true });
    form.setValue('totalSessions', '', { shouldDirty: true });
    form.setValue('sessionId', defaults.patientTreatmentPlanSessionId, { shouldDirty: true });
    form.setValue('startTime', '', { shouldDirty: true });
    form.setValue('endTime', '', { shouldDirty: true });
    form.setValue('roomId', '', { shouldDirty: true });
    form.setValue('therapistId', session?.therapistSkill ? '' : 'not-required', {
      shouldDirty: true,
    });
  }

  function changeDoctor() {
    setSubmitError(null);
    if (!isProcedurePath) clearSchedule();
  }

  function resetProcedureResources() {
    form.setValue('roomId', '', { shouldDirty: true });
    form.setValue('therapistId', selectedSession?.therapistSkill ? '' : 'not-required', {
      shouldDirty: true,
    });
  }

  function changeProcedureDate() {
    setSubmitError(null);
    setProcedureEndTimeAdjusted(false);
    form.setValue('startTime', '', { shouldDirty: true });
    form.setValue('endTime', '', { shouldDirty: true });
    resetProcedureResources();
  }

  function changeProcedureStartTime(value: string) {
    setSubmitError(null);
    form.setValue('startTime', value, { shouldDirty: true, shouldValidate: true });
    const endTime = isProcedureEndTimeAdjusted
      ? getProcedureEndTimeForStartChange(value, form.getValues('endTime'), selectedSession)
      : getProcedureEndTime(value, selectedSession);
    form.setValue('endTime', endTime, {
      shouldDirty: true,
      shouldValidate: true,
    });
    resetProcedureResources();
  }

  function changeProcedureEndTime(value: string) {
    setSubmitError(null);
    setProcedureEndTimeAdjusted(value !== '');
    form.setValue('endTime', value, { shouldDirty: true, shouldValidate: true });
    resetProcedureResources();
  }

  function changeSchedule() {
    setSubmitError(null);
    form.setValue('startTime', '', { shouldDirty: true });
    form.setValue('endTime', '', { shouldDirty: true });
    form.setValue('slotTimes', [], { shouldDirty: true });
    form.setValue('roomId', '', { shouldDirty: true });
    form.setValue('therapistId', '', { shouldDirty: true });
    form.setValue('doctorRotaId', '', { shouldDirty: true });
  }

  function changeRota(value: string) {
    setSubmitError(null);
    form.setValue('doctorRotaId', value, {
      shouldDirty: true,
      shouldValidate: true,
    });
    form.setValue('startTime', '', { shouldDirty: true });
    form.setValue('endTime', '', { shouldDirty: true });
    form.setValue('slotTimes', [], { shouldDirty: true });
  }

  function changeTime(field: 'startTime' | 'endTime', value: string) {
    setSubmitError(null);
    form.setValue(field, value, { shouldDirty: true, shouldValidate: true });
    form.setValue(
      'slotTimes',
      getSlotTimes(
        form.getValues('startTime'),
        form.getValues('endTime'),
        selectedRota?.duration ?? 15
      ),
      { shouldDirty: true }
    );
  }

  function resetBooking() {
    form.reset(initialValues);
    setStep(1);
    setPatientSearch('');
    setTreatmentSearch('');
    setSelectedCatalogueTreatmentSnapshot(null);
    setPatientMatches([]);
    setSelectedPatientSnapshot(null);
    setConfirmation(null);
    setSubmitError(null);
    setProcedureEndTimeAdjusted(false);
  }

  const firstStepFields: Array<keyof BookAppointmentFormValues> = [
    'patientId',
    'firstName',
    'lastName',
    'phone',
    'email',
    'visitType',
    'doctorId',
    ...(isProcedurePath
      ? ([
          'selectionMode',
          'patientTreatmentPlanId',
          'patientTreatmentPlanSessionId',
          'treatmentId',
          'totalSessions',
        ] as const)
      : []),
  ];

  async function continueToSchedule() {
    if (await form.trigger(firstStepFields, { shouldFocus: true })) setStep(2);
  }

  const onSubmit = form.handleSubmit(
    async (submitted) => {
      setSubmitError(null);

      try {
        await submitBookAppointmentAndNavigate(
          submitted,
          createAppointment.mutateAsync,
          (bookingConfirmation) => {
            setConfirmation(bookingConfirmation);
            toast.success(`${bookingConfirmation.bookingNumber} booked.`);
          },
          router.push
        );
      } catch (error) {
        const message = getApiErrorMessage(error);
        setSubmitError(message);

        if (error instanceof AppointmentApiError && error.patientMatches.length > 0) {
          const registeredMatches = error.patientMatches.filter(
            (patient) => patient.registrationStatus === 'registered' && patient.isActive
          );
          setPatientMatches(registeredMatches);
          form.setValue('patientMode', 'existing', { shouldDirty: true });
          form.setValue('patientId', '', { shouldDirty: true, shouldValidate: true });
          setSelectedPatientSnapshot(null);
          setPatientSearch(`${submitted.firstName} ${submitted.lastName}`.trim());
          setStep(1);
        } else if (message.includes('Provisional Patient')) {
          setStep(1);
        } else if (
          error instanceof AppointmentApiError &&
          error.status === 409 &&
          error.errors.includes(staleSlotMessage)
        ) {
          form.setValue('startTime', '', { shouldDirty: true });
          form.setValue('endTime', '', { shouldDirty: true });
          form.setValue('slotTimes', [], { shouldDirty: true });
          setStep(2);
        } else if (
          error instanceof AppointmentApiError &&
          error.status === 409 &&
          error.errors.includes(stalePlanSessionMessage)
        ) {
          await plansQuery.refetch();
          setStep(1);
        }

        toast.error(message);
      }
    },
    (errors) => {
      if (firstStepFields.some((field) => errors[field])) setStep(1);
    }
  );

  const dependencyErrors = [
    doctorsQuery.error,
    ...(isProcedurePath
      ? [plansQuery.error, treatmentsQuery.error, roomsQuery.error, therapistsQuery.error]
      : [modesQuery.error, typesQuery.error, reasonsQuery.error]),
  ]
    .map(getErrorMessage)
    .filter((message): message is string => message !== null);

  return {
    form,
    step,
    values,
    visitType,
    patientMode,
    confirmation,
    submitError,
    patientSearch,
    selectedPatient,
    selectedTreatment,
    selectedSession,
    selectedRoom,
    selectedTherapist,
    selectedDoctor,
    selectedRota,
    isProcedurePath,
    resourceSession,
    patients: selectablePatients,
    patientVisits: patientVisitsQuery.data ?? [],
    isPatientSearchLoading: patientsQuery.isLoading || patientsQuery.isFetching,
    patientSearchError: getErrorMessage(patientsQuery.error),
    isPatientVisitsLoading: patientVisitsQuery.isLoading,
    patientVisitsError: getErrorMessage(patientVisitsQuery.error),
    doctors,
    appointmentModes: modesQuery.data?.data ?? [],
    appointmentTypes: typesQuery.data?.data ?? [],
    appointmentReasons: reasonsQuery.data?.data ?? [],
    bookingDependenciesLoading:
      doctorsQuery.isLoading ||
      (isProcedurePath
        ? plansQuery.isLoading ||
          treatmentsQuery.isLoading ||
          roomsQuery.isLoading ||
          therapistsQuery.isLoading
        : modesQuery.isLoading || typesQuery.isLoading || reasonsQuery.isLoading),
    bookingDependencyError: dependencyErrors[0] ?? null,
    rotas,
    isDoctorSlotsLoading: doctorSlotsQuery.isLoading || doctorSlotsQuery.isFetching,
    doctorSlotsError: getErrorMessage(doctorSlotsQuery.error),
    filteredRooms,
    isRoomsLoading: roomsQuery.isLoading || roomsQuery.isFetching,
    filteredTherapists,
    isTherapistsLoading: therapistsQuery.isLoading || therapistsQuery.isFetching,
    requiresRoom,
    requiresTherapist,
    planOptions,
    treatmentSelectionState,
    isPlansLoading: plansQuery.isLoading,
    plansError: getErrorMessage(plansQuery.error),
    isTreatmentsLoading: treatmentsQuery.isLoading || treatmentsQuery.isFetching,
    treatmentsError: getErrorMessage(treatmentsQuery.error),
    treatmentOptions,
    treatmentSearch,
    setStep,
    setPatientSearch,
    changeVisitType,
    selectPatient,
    changePatientMode,
    changeTreatment,
    changeSession,
    changePlan,
    setTreatmentSearch,
    changeDoctor,
    changeProcedureDate,
    changeProcedureEndTime,
    changeProcedureStartTime,
    changeSchedule,
    changeRota,
    changeTime,
    resetBooking,
    continueToSchedule,
    onSubmit,
    retryPatientSearch: patientsQuery.refetch,
    retryPatientVisits: patientVisitsQuery.refetch,
    retryDoctorSlots: doctorSlotsQuery.refetch,
    retryPlans: plansQuery.refetch,
    retryTreatments: treatmentsQuery.refetch,
    retryBookingDependencies: () => {
      void doctorsQuery.refetch();
      if (isProcedurePath) {
        void plansQuery.refetch();
        void treatmentsQuery.refetch();
        void roomsQuery.refetch();
        void therapistsQuery.refetch();
      } else {
        void modesQuery.refetch();
        void typesQuery.refetch();
        void reasonsQuery.refetch();
      }
    },
  };
}
