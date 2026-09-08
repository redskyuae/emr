'use client';

import { useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  bookAppointmentFormSchema,
  type BookAppointmentFormValues,
} from '../_utils/book-appointment-form-schema';
import {
  DEMO_DOCTORS,
  DEMO_FACILITY,
  DEMO_PATIENTS,
  DEMO_ROTAS,
  DEMO_ROOMS,
  DEMO_TREATMENT_CATALOG,
  DEMO_THERAPISTS,
  type DemoPatient,
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

export function useBookAppointment() {
  const [step, setStep] = useState<1 | 2>(1);
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatientSnapshot, setSelectedPatientSnapshot] = useState<DemoPatient | null>(null);
  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null);
  const form = useForm<BookAppointmentFormValues>({
    mode: 'onTouched',
    defaultValues: initialValues,
    resolver: zodResolver(bookAppointmentFormSchema),
  });
  const values = { ...initialValues, ...useWatch({ control: form.control }) };
  const patientMode = values.patientMode ?? 'existing';
  const visitType = values.visitType ?? '';
  const selectedPatientId = values.patientId ?? '';
  const selectedPatient =
    patientMode === 'existing' && selectedPatientSnapshot?.id === Number(selectedPatientId)
      ? selectedPatientSnapshot
      : patientMode === 'existing'
        ? (DEMO_PATIENTS.find((patient) => String(patient.id) === selectedPatientId) ?? null)
        : null;
  const treatmentOptions = [...(selectedPatient?.treatments ?? []), ...DEMO_TREATMENT_CATALOG];
  const selectedTreatment =
    treatmentOptions.find((treatment) => String(treatment.id) === values.treatmentId) ?? null;
  const selectedSession =
    selectedTreatment?.sessions.find((session) => session.id === values.sessionId) ?? null;
  const selectedRoom = DEMO_ROOMS.find((room) => String(room.id) === values.roomId) ?? null;
  const selectedTherapist =
    DEMO_THERAPISTS.find((therapist) => String(therapist.id) === values.therapistId) ?? null;
  const selectedDoctor =
    DEMO_DOCTORS.find((doctor) => String(doctor.id) === values.doctorId) ?? null;
  const selectedRota = DEMO_ROTAS.find((rota) => rota.id === values.doctorRotaId) ?? DEMO_ROTAS[0];
  const isProcedurePath = visitType === 'PROCEDURE';
  const isProvisionalTreatment = isProcedurePath && patientMode === 'provisional';
  const resourceSession =
    selectedSession ?? (isProvisionalTreatment ? (selectedTreatment?.sessions[0] ?? null) : null);
  const filteredPatients = useMemo(() => {
    const query = patientSearch.trim().toLowerCase();
    if (!query) return DEMO_PATIENTS;
    return DEMO_PATIENTS.filter((patient) =>
      `${patient.firstName} ${patient.lastName} ${patient.mrn} ${patient.phone}`
        .toLowerCase()
        .includes(query)
    );
  }, [patientSearch]);
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

  function clearAyurvedaFields() {
    form.setValue('treatmentId', '', { shouldDirty: true });
    form.setValue('sessionId', '', { shouldDirty: true });
    form.setValue('roomId', '', { shouldDirty: true });
    form.setValue('therapistId', '', { shouldDirty: true });
    form.setValue('endTime', '', { shouldDirty: true });
  }

  function changeVisitType(next: VisitType) {
    if (next === visitType) return;
    form.setValue('visitType', next, { shouldDirty: true, shouldValidate: true });
    setConfirmation(null);
    form.clearErrors();
    form.setValue('doctorId', '', { shouldDirty: true });
    form.setValue('appointmentModeId', '', { shouldDirty: true });
    form.setValue('appointmentTypeId', '', { shouldDirty: true });
    form.setValue('appointmentReasonId', '', { shouldDirty: true });
    form.setValue('slotDate', '', { shouldDirty: true });
    form.setValue('startTime', '', { shouldDirty: true });
    form.setValue('doctorRotaId', '', { shouldDirty: true });
    form.setValue('slotTimes', [], { shouldDirty: true });
    clearAyurvedaFields();
  }

  function selectPatient(patient: DemoPatient) {
    if (selectedPatient?.id === patient.id) return;
    form.setValue('patientMode', 'existing', { shouldDirty: true });
    form.setValue('patientId', String(patient.id), { shouldDirty: true, shouldValidate: true });
    setSelectedPatientSnapshot(patient);
    setPatientSearch(`${patient.firstName} ${patient.lastName}`);
    setConfirmation(null);
    clearAyurvedaFields();
    form.setValue('slotDate', '', { shouldDirty: true });
    form.setValue('startTime', '', { shouldDirty: true });
    form.setValue('slotTimes', [], { shouldDirty: true });
    form.setValue('doctorRotaId', '', { shouldDirty: true });
  }

  function changePatientMode(mode: BookAppointmentFormValues['patientMode']) {
    if (mode === patientMode) return;
    form.setValue('patientMode', mode, { shouldDirty: true, shouldValidate: true });
    form.clearErrors();
    setConfirmation(null);
    setSelectedPatientSnapshot(null);
    clearAyurvedaFields();
    form.setValue('slotDate', '', { shouldDirty: true });
    form.setValue('startTime', '', { shouldDirty: true });
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
    if (isProcedurePath) {
      form.setValue('roomId', '', { shouldDirty: true });
      form.setValue('therapistId', '', { shouldDirty: true });
    } else {
      form.setValue('doctorRotaId', '');
      form.setValue('slotTimes', []);
    }
  }

  function resetBooking() {
    form.reset(initialValues);
    setStep(1);
    setPatientSearch('');
    setSelectedPatientSnapshot(null);
    setConfirmation(null);
  }

  function toggleSlot(time: string) {
    const next = values.slotTimes?.includes(time)
      ? values.slotTimes.filter((slot) => slot !== time)
      : [...(values.slotTimes ?? []), time];
    const ordered = selectedRota.slots
      .filter((slot) => next.includes(slot.time))
      .map((slot) => slot.time);
    const indexes = selectedRota.slots
      .map((slot, index) => (ordered.includes(slot.time) ? index : -1))
      .filter((index) => index >= 0);
    if (indexes.length > 1 && Math.max(...indexes) - Math.min(...indexes) + 1 !== indexes.length) {
      form.setError('slotTimes', {
        type: 'manual',
        message: 'Selected DoctorSlots must be consecutive.',
      });
      return;
    }
    form.clearErrors('slotTimes');
    form.setValue('slotTimes', ordered, { shouldDirty: true, shouldValidate: true });
  }

  const firstStepFields: Array<keyof BookAppointmentFormValues> = [
    'patientId',
    'firstName',
    'lastName',
    'phone',
    'email',
    'visitType',
    ...(isProcedurePath ? (['treatmentId', 'sessionId'] as const) : []),
  ];

  async function continueToSchedule() {
    if (await form.trigger(firstStepFields, { shouldFocus: true })) setStep(2);
  }

  const onSubmit = form.handleSubmit(
    (submitted) => {
      const patientName = selectedPatient
        ? `${selectedPatient.firstName} ${selectedPatient.lastName}`
        : `${submitted.firstName} ${submitted.lastName}`.trim();
      const bookingPath = submitted.visitType as VisitType;
      const bookingNumber =
        bookingPath === 'CONSULTATION'
          ? 'APT-1001'
          : bookingPath === 'PROCEDURE'
            ? 'APT-1002'
            : 'APT-1003';
      const detail =
        bookingPath === 'CONSULTATION'
          ? `${selectedDoctor?.name ?? 'Doctor'} · ${submitted.slotDate} · ${submitted.slotTimes.join(', ')}`
          : `${selectedSession?.procedure ?? selectedTreatment?.name ?? 'Treatment'} · ${selectedRoom?.name ?? 'Room'} · ${selectedTherapist?.name ?? 'Therapist'}`;
      setConfirmation({ bookingNumber, path: bookingPath, patientName, detail });
      toast.success(`${bookingNumber} ready for review.`);
    },
    (errors) => {
      if (firstStepFields.some((field) => errors[field])) setStep(1);
    }
  );

  return {
    form,
    step,
    values,
    visitType,
    patientMode,
    confirmation,
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
    filteredPatients,
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
    resetBooking,
    toggleSlot,
    continueToSchedule,
    onSubmit,
  };
}
