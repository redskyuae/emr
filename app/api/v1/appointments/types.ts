import type { Appointment } from '@/app/api/lib/modules/appointment/schemas/appointment-schema';
import type { createAppointmentSchema } from '@/app/api/lib/modules/appointment/schemas/appointment-schema';
import type { Paginated } from '@/app/api/lib/utils/types';
import type { z } from 'zod';

export type ListAppointmentsResponse = Paginated<Appointment>;

export type CreateAppointmentRequest = z.input<typeof createAppointmentSchema>;

export type CreateAppointmentResponse = {
  data: Appointment;
};
