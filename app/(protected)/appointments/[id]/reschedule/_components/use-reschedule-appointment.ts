'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

import { getApiErrorMessage } from '@/app/queries/api-error';
import { useAppointmentQuery } from '@/app/queries/appointments/useAppointment';
import { useDoctorSlotsQuery } from '@/app/queries/appointments/useDoctorSlots';
import { useRescheduleAppointment } from '@/app/queries/appointments/useRescheduleAppointment';
import { useDoctorsQuery } from '@/app/queries/doctors/useDoctors';
import { useCurrentUserQuery } from '@/app/queries/identity-access/useCurrentUser';
import {
  EMPTY_BOOK_APPOINTMENT_FORM_VALUES,
  type BookAppointmentFormValues,
} from '@/app/(protected)/appointments/new/_utils/book-appointment-form-schema';
import { getSlotTimes } from '@/app/(protected)/appointments/new/_utils/appointment-time';
import { rescheduleAppointmentFormSchema } from '../_utils/reschedule-appointment-form-schema';
import { rescheduleAppointmentFormValuesToRequest } from '../_utils/reschedule-appointment-request';

function toIsoDate(value: string) {
  const [day, month, year] = value.split('-');
  return `${year}-${month}-${day}`;
}

export function useRescheduleAppointmentForm(appointmentId: number) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const form = useForm<BookAppointmentFormValues>({
    mode: 'onTouched',
    defaultValues: EMPTY_BOOK_APPOINTMENT_FORM_VALUES,
    resolver: zodResolver(rescheduleAppointmentFormSchema),
  });
  const values = { ...EMPTY_BOOK_APPOINTMENT_FORM_VALUES, ...useWatch({ control: form.control }) };
  const appointmentQuery = useAppointmentQuery(appointmentId);
  const appointment = appointmentQuery.data;
  const isProcedure = appointment?.bookingPath === 'PROCEDURE';
  const currentUserQuery = useCurrentUserQuery();
  const doctorsQuery = useDoctorsQuery(
    { page: 1, limit: 999, status: 'active' },
    { enabled: appointment !== undefined && !isProcedure }
  );
  const doctors = (doctorsQuery.data?.data ?? []).map((doctor) => ({
    id: doctor.id,
    name: doctor.name,
    specialty: doctor.specialtyName ?? 'Specialty not recorded',
  }));
  const doctorId =
    !isProcedure && values.doctorId && values.doctorId !== 'not-applicable'
      ? Number(values.doctorId)
      : null;
  const doctorSlotsQuery = useDoctorSlotsQuery({
    doctorId,
    slotDate: values.slotDate,
    reschedulingAppointmentId: appointmentId,
  });
  const rotas = doctorSlotsQuery.data ?? [];
  const selectedRota = rotas.find((rota) => rota.id === values.doctorRotaId) ?? null;
  const selectedDoctor = doctors.find((doctor) => String(doctor.id) === values.doctorId) ?? null;
  const mutation = useRescheduleAppointment();

  useEffect(() => {
    if (!appointment) return;

    form.reset({
      ...EMPTY_BOOK_APPOINTMENT_FORM_VALUES,
      patientId: String(appointment.patient.id),
      lastName: appointment.patient.lastName,
      firstName: appointment.patient.firstName,
      phone: appointment.patient.phone,
      visitType: appointment.bookingPath,
      doctorId: appointment.doctor ? String(appointment.doctor.id) : 'not-applicable',
      appointmentModeId: appointment.appointmentMode ? String(appointment.appointmentMode.id) : '',
      appointmentTypeId: appointment.appointmentType ? String(appointment.appointmentType.id) : '',
      appointmentReasonId: appointment.appointmentReason
        ? String(appointment.appointmentReason.id)
        : '',
      slotDate: toIsoDate(appointment.slotDate),
      doctorRotaId: appointment.doctorRotaId ? String(appointment.doctorRotaId) : '',
      slotTimes: appointment.slots.map((slot) => slot.slotTime),
      startTime: appointment.startTime ?? '',
      endTime: appointment.endTime ?? '',
      remarks: appointment.remarks ?? '',
    });
  }, [appointment, form]);

  function clearSelectedTime() {
    form.setValue('startTime', '', { shouldDirty: true });
    form.setValue('endTime', '', { shouldDirty: true });
    form.setValue('slotTimes', [], { shouldDirty: true });
  }

  function changeDoctor() {
    setSubmitError(null);
    form.setValue('slotDate', '', { shouldDirty: true });
    form.setValue('doctorRotaId', '', { shouldDirty: true });
    clearSelectedTime();
  }

  function changeScheduleContext() {
    setSubmitError(null);
    form.setValue('doctorRotaId', '', { shouldDirty: true });
    clearSelectedTime();
  }

  function changeRota(value: string) {
    setSubmitError(null);
    form.setValue('doctorRotaId', value, { shouldDirty: true, shouldValidate: true });
    clearSelectedTime();
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

  function changeProcedureDate() {
    setSubmitError(null);
    form.setValue('startTime', '', { shouldDirty: true });
    form.setValue('endTime', '', { shouldDirty: true });
  }

  function changeProcedureStartTime(value: string) {
    setSubmitError(null);
    form.setValue('startTime', value, { shouldDirty: true, shouldValidate: true });
    if (form.getValues('endTime') <= value) {
      form.setValue('endTime', '', { shouldDirty: true, shouldValidate: true });
    }
  }

  function changeProcedureEndTime(value: string) {
    setSubmitError(null);
    form.setValue('endTime', value, { shouldDirty: true, shouldValidate: true });
  }

  const onSubmit = form.handleSubmit(async (submitted) => {
    setSubmitError(null);

    try {
      const response = await mutation.mutateAsync({
        appointmentId,
        request: rescheduleAppointmentFormValuesToRequest(submitted),
      });
      toast.success(`${response.data.bookingNumber} rescheduled.`);
      router.push(
        `/appointments?date=${encodeURIComponent(response.data.slotDate)}&appointment=${response.data.id}`
      );
    } catch (error) {
      const message = getApiErrorMessage(error);
      setSubmitError(message);
      toast.error(message);
    }
  });

  return {
    form,
    values,
    rotas,
    doctors,
    appointment,
    submitError,
    selectedRota,
    selectedDoctor,
    tenant: currentUserQuery.data?.tenant,
    isProcedure,
    isLoading:
      appointmentQuery.isLoading ||
      (!isProcedure && doctorsQuery.isLoading) ||
      currentUserQuery.isLoading,
    error:
      appointmentQuery.error ??
      (!isProcedure ? doctorsQuery.error : null) ??
      currentUserQuery.error,
    isEligible:
      appointment?.appointmentStatus.category === 'scheduled' ||
      appointment?.appointmentStatus.category === 'confirmed',
    isDoctorSlotsLoading: doctorSlotsQuery.isLoading || doctorSlotsQuery.isFetching,
    doctorSlotsError: doctorSlotsQuery.error ? getApiErrorMessage(doctorSlotsQuery.error) : null,
    mutation,
    changeDoctor,
    changeScheduleContext,
    changeRota,
    changeTime,
    changeProcedureDate,
    changeProcedureStartTime,
    changeProcedureEndTime,
    onSubmit,
    retryAppointment: appointmentQuery.refetch,
    retryDoctorSlots: doctorSlotsQuery.refetch,
  };
}
