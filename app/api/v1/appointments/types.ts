import type { Appointment } from '@/app/api/lib/modules/appointment/schemas/appointment-schema';
import type { CreatePatientInput } from '@/app/api/lib/modules/patient/schemas/patient-schema';
import type { Paginated } from '@/app/api/lib/utils/types';

export type ListAppointmentsResponse = Paginated<Appointment>;

export type CreateAppointmentRequest = {
  doctorId: number;
  appointmentModeId: number;
  appointmentTypeId: number;
  appointmentReasonId: number;
  patientId?: number;
  provisionalPatient?: Partial<CreatePatientInput> & {
    firstName: string;
    lastName: string;
    phone: string;
  };
  slotDate: string;
  doctorRotaId: number;
  slotTimes: string[];
  remarks?: string;
};

export type CreateAppointmentResponse = {
  data: Appointment;
};
