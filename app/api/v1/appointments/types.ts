import type {
  Appointment,
  CreateAppointmentInput,
} from '@/app/api/lib/modules/appointment/schemas/appointment-schema';
import type { Paginated } from '@/app/api/lib/utils/types';

export type ListAppointmentsResponse = Paginated<Appointment>;

type AppointmentPatientRequest =
  | { patientId: number; provisionalPatient?: never }
  | {
      patientId?: never;
      provisionalPatient: NonNullable<CreateAppointmentInput['provisionalPatient']>;
    };

type WithoutPatientSelector<T> = T extends unknown
  ? Omit<T, 'patientId' | 'provisionalPatient'>
  : never;

export type CreateAppointmentRequest = WithoutPatientSelector<CreateAppointmentInput> &
  AppointmentPatientRequest;

export type CreateAppointmentResponse = {
  data: Appointment;
};
