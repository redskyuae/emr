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

type ExistingPlanSelection = {
  treatmentId?: never;
  totalSessions?: never;
  patientTreatmentPlanId: number;
  patientTreatmentPlanSessionId: number;
};

type CatalogueAssignment = {
  treatmentId: number;
  totalSessions?: number;
  patientTreatmentPlanId?: never;
  patientTreatmentPlanSessionId?: never;
};

type ConsultationAppointmentInput = Extract<
  CreateAppointmentInput,
  { bookingPath: 'CONSULTATION' }
>;
type ProcedureAppointmentInput = Extract<CreateAppointmentInput, { bookingPath: 'PROCEDURE' }>;
type ProcedureAppointmentBase = Omit<
  ProcedureAppointmentInput,
  'treatmentId' | 'totalSessions' | 'patientTreatmentPlanId' | 'patientTreatmentPlanSessionId'
>;

export type CreateAppointmentRequest =
  | (WithoutPatientSelector<ConsultationAppointmentInput> & AppointmentPatientRequest)
  | (ProcedureAppointmentBase & (ExistingPlanSelection | CatalogueAssignment));

export type CreateAppointmentResponse = {
  data: Appointment;
};
