'use client';

import { useMemo, useState } from 'react';
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
import { usePatientsQuery } from '@/app/queries/patients/usePatients';
import { usePatientVisitsQuery } from '@/app/queries/visits/useVisits';
import { getSlotTimes } from '../_utils/appointment-time';
import {
  bookAppointmentFormSchema,
  type BookAppointmentFormValues,
} from '../_utils/book-appointment-form-schema';
import { bookAppointmentFormValuesToRequest } from '../_utils/book-appointment-request';
import type { BookablePatient } from '../_utils/book-appointment-types';
import {
  DEMO_DOCTORS,
  DEMO_FACILITY,
  DEMO_ROOMS,
  DEMO_ROTAS,
  DEMO_TREATMENT_CATALOG,
  DEMO_THERAPISTS,
  type VisitType,
} from './book-appointment-demo-data';

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
  treatmentId: '',
  sessionId: '',
  startTime: '',
  endTime: '',
  roomId: '',
  therapistId: '',
  consentStatus: 'READY',
  approvalStatus: 'NOT_REQUIRED',
  remarks: '',
};

type BookingConfirmation = {
  bookingNumber: string;
  path: VisitType;
  patientName: string;
  detail: string;
};

const masterListParams = { page: 1, limit: 999 };
const staleSlotMessage = 'One or more selected Doctor slots are no longer available.';

function getErrorMessage(error: unknown) {
  return error ? getApiErrorMessage(error) : null;
}

export function useBookAppointment() {
  const [step, setStep] = useState<1 | 2>(1);
  const [patientSearch, setPatientSearch] = useState('');
  const [debouncedPatientSearch] = useDebouncedValue(patientSearch.trim(), { wait: 300 });
  const [selectedPatientSnapshot, setSelectedPatientSnapshot] = useState<BookablePatient | null>(
    null
  );
  const [patientMatches, setPatientMatches] = useState<BookablePatient[]>([]);
  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
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

  const consultationDoctors = (doctorsQuery.data?.data ?? []).map((doctor) => ({
    id: doctor.id,
    name: doctor.name,
    specialty: doctor.specialtyName ?? 'Specialty not recorded',
  }));
  const doctors = isProcedurePath ? DEMO_DOCTORS : consultationDoctors;
  const selectedDoctor = doctors.find((doctor) => String(doctor.id) === values.doctorId) ?? null;
  const doctorId = !isProcedurePath && values.doctorId ? Number(values.doctorId) : null;
  const doctorSlotsQuery = useDoctorSlotsQuery({ doctorId, slotDate: values.slotDate });
  const rotas = isProcedurePath ? DEMO_ROTAS : (doctorSlotsQuery.data ?? []);
  const selectedRota = rotas.find((rota) => rota.id === values.doctorRotaId) ?? null;

  const selectedPatientId = values.patientId ?? '';
  const selectedPatient =
    patientMode === 'existing' && selectedPatientSnapshot?.id === Number(selectedPatientId)
      ? selectedPatientSnapshot
      : null;
  const patientVisitsQuery = usePatientVisitsQuery(selectedPatient?.id ?? null);
  const selectablePatients = [...patientMatches, ...(patientsQuery.data?.data ?? [])].filter(
    (patient, index, patients) =>
      patient.isActive &&
      patient.registrationStatus === 'registered' &&
      patients.findIndex((candidate) => candidate.id === patient.id) === index
  );

  const treatmentOptions = DEMO_TREATMENT_CATALOG;
  const selectedTreatment =
    treatmentOptions.find((treatment) => String(treatment.id) === values.treatmentId) ?? null;
  const selectedSession =
    selectedTreatment?.sessions.find((session) => session.id === values.sessionId) ?? null;
  const selectedRoom = DEMO_ROOMS.find((room) => String(room.id) === values.roomId) ?? null;
  const selectedTherapist =
    DEMO_THERAPISTS.find((therapist) => String(therapist.id) === values.therapistId) ?? null;
  const isProvisionalTreatment = isProcedurePath && patientMode === 'provisional';
  const resourceSession =
    selectedSession ?? (isProvisionalTreatment ? (selectedTreatment?.sessions[0] ?? null) : null);
  const filteredRooms = useMemo(
    () =>
      resourceSession
        ? DEMO_ROOMS.filter((room) => room.roomType === resourceSession.roomType)
        : [],
    [resourceSession]
  );
  const filteredTherapists = useMemo(
    () =>
      resourceSession
        ? DEMO_THERAPISTS.filter((therapist) => therapist.skill === resourceSession.therapistSkill)
        : [],
    [resourceSession]
  );
  const createAppointment = useCreateAppointment();

  function clearProcedureFields() {
    form.setValue('treatmentId', '', { shouldDirty: true });
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

  function changeVisitType(next: VisitType) {
    if (next === visitType) return;
    form.setValue('visitType', next, { shouldDirty: true, shouldValidate: true });
    setConfirmation(null);
    setSubmitError(null);
    form.clearErrors();
    form.setValue('doctorId', '', { shouldDirty: true });
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
    clearProcedureFields();
    clearSchedule();
  }

  function changePatientMode(mode: BookAppointmentFormValues['patientMode']) {
    if (mode === patientMode) return;
    form.setValue('patientMode', mode, { shouldDirty: true, shouldValidate: true });
    form.clearErrors();
    setConfirmation(null);
    setSubmitError(null);
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
    form.setValue('treatmentId', value, { shouldDirty: true, shouldValidate: true });
    form.setValue('startTime', '');
    form.setValue('endTime', '');
    form.setValue('sessionId', '', { shouldDirty: true });
    form.setValue('roomId', '', { shouldDirty: true });
    form.setValue('therapistId', '', { shouldDirty: true });
  }

  function changeSession(value: string) {
    form.setValue('sessionId', value, { shouldDirty: true, shouldValidate: true });
    form.setValue('startTime', '');
    form.setValue('endTime', '');
    form.setValue('roomId', '', { shouldDirty: true });
    form.setValue('therapistId', '', { shouldDirty: true });
  }

  function changeSchedule() {
    setSubmitError(null);
    form.setValue('startTime', '', { shouldDirty: true });
    form.setValue('endTime', '', { shouldDirty: true });
    form.setValue('slotTimes', [], { shouldDirty: true });
    form.setValue('roomId', '', { shouldDirty: true });
    form.setValue('therapistId', '', { shouldDirty: true });
    if (!isProcedurePath) {
      form.setValue('doctorRotaId', '', { shouldDirty: true });
    }
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
    if (isProcedurePath) {
      form.setValue('roomId', '', { shouldDirty: true });
      form.setValue('therapistId', '', { shouldDirty: true });
    }
  }

  function resetBooking() {
    form.reset(initialValues);
    setStep(1);
    setPatientSearch('');
    setPatientMatches([]);
    setSelectedPatientSnapshot(null);
    setConfirmation(null);
    setSubmitError(null);
  }

  const firstStepFields: Array<keyof BookAppointmentFormValues> = [
    'patientId',
    'firstName',
    'lastName',
    'phone',
    'email',
    'visitType',
    'doctorId',
    ...(isProcedurePath ? (['treatmentId', 'sessionId'] as const) : []),
  ];

  async function continueToSchedule() {
    if (await form.trigger(firstStepFields, { shouldFocus: true })) setStep(2);
  }

  const onSubmit = form.handleSubmit(
    async (submitted) => {
      if (submitted.visitType === 'PROCEDURE') return;

      setSubmitError(null);

      try {
        const response = await createAppointment.mutateAsync(
          bookAppointmentFormValuesToRequest(submitted)
        );
        const appointment = response.data;
        const firstSlot = appointment.slots[0]?.slotTime ?? submitted.startTime;

        setConfirmation({
          bookingNumber: appointment.bookingNumber,
          path: 'CONSULTATION',
          patientName: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
          detail: `${appointment.doctor.name} · ${appointment.slotDate} · ${firstSlot}–${submitted.endTime}`,
        });
        toast.success(`${appointment.bookingNumber} booked.`);
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
    modesQuery.error,
    typesQuery.error,
    reasonsQuery.error,
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
    isProvisionalTreatment,
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
    consultationDependenciesLoading:
      doctorsQuery.isLoading ||
      modesQuery.isLoading ||
      typesQuery.isLoading ||
      reasonsQuery.isLoading,
    consultationDependencyError: dependencyErrors[0] ?? null,
    rotas,
    isDoctorSlotsLoading: doctorSlotsQuery.isLoading || doctorSlotsQuery.isFetching,
    doctorSlotsError: getErrorMessage(doctorSlotsQuery.error),
    filteredRooms,
    filteredTherapists,
    treatmentOptions,
    setStep,
    setPatientSearch,
    changeVisitType,
    selectPatient,
    changePatientMode,
    changeTreatment,
    changeSession,
    changeSchedule,
    changeRota,
    changeTime,
    resetBooking,
    continueToSchedule,
    onSubmit,
    retryPatientSearch: patientsQuery.refetch,
    retryPatientVisits: patientVisitsQuery.refetch,
    retryDoctorSlots: doctorSlotsQuery.refetch,
    retryConsultationDependencies: () => {
      void doctorsQuery.refetch();
      void modesQuery.refetch();
      void typesQuery.refetch();
      void reasonsQuery.refetch();
    },
  };
}
