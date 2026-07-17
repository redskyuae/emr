'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import type {
  Appointment,
  PotentialPatientMatch,
} from '@/app/api/lib/modules/appointment/schemas/appointment-schema';
import type {
  CreateAppointmentRequest,
  CreateAppointmentResponse,
} from '@/app/api/v1/appointments/types';
import { ApiError } from '@/app/queries/api-error';
import { doctorSlotsQueryKey } from '@/app/queries/appointments/useDoctorSlots';
import { patientsBaseKey } from '@/app/queries/patients/usePatients';

type AppointmentErrorBody = {
  message?: unknown;
  errors?: unknown;
  patientMatches?: unknown;
};

export class AppointmentApiError extends ApiError {
  patientMatches: PotentialPatientMatch[];

  constructor(
    message: string,
    errors: string[],
    status: number,
    patientMatches: PotentialPatientMatch[]
  ) {
    super(message, errors, status);
    this.name = 'AppointmentApiError';
    this.patientMatches = patientMatches;
  }
}

export const appointmentsBaseKey = ['appointments'] as const;

function getStringErrors(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((error): error is string => typeof error === 'string' && error.length > 0);
}

function isPatientMatch(value: unknown): value is PotentialPatientMatch {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const match = value as Partial<PotentialPatientMatch>;

  return (
    typeof match.id === 'number' &&
    typeof match.mrn === 'string' &&
    typeof match.phone === 'string' &&
    typeof match.isActive === 'boolean' &&
    typeof match.lastName === 'string' &&
    typeof match.firstName === 'string' &&
    (match.registrationStatus === 'registered' || match.registrationStatus === 'provisional')
  );
}

async function parseAppointmentApiError(response: Response, fallbackMessage: string) {
  let body: AppointmentErrorBody | undefined;

  try {
    body = (await response.json()) as AppointmentErrorBody;
  } catch {
    // Ignore invalid error payloads and fall back to the response status.
  }

  const message =
    typeof body?.message === 'string' && body.message.length > 0 ? body.message : fallbackMessage;
  const errors = getStringErrors(body?.errors);
  const patientMatches = Array.isArray(body?.patientMatches)
    ? body.patientMatches.filter(isPatientMatch)
    : [];

  return new AppointmentApiError(
    message,
    errors.length > 0 ? errors : [message],
    response.status,
    patientMatches
  );
}

async function createAppointment(
  request: CreateAppointmentRequest
): Promise<CreateAppointmentResponse> {
  const response = await fetch('/api/v1/appointments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseAppointmentApiError(response, 'Could not book Appointment');
  }

  return response.json() as Promise<CreateAppointmentResponse>;
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAppointment,
    onSettled: (response) => {
      void queryClient.invalidateQueries({ queryKey: appointmentsBaseKey });
      void queryClient.invalidateQueries({ queryKey: patientsBaseKey });

      if (response?.data) {
        void queryClient.invalidateQueries({
          queryKey: doctorSlotsQueryKey({
            doctorId: response.data.doctor.id,
            slotDate: toIsoSlotDate(response.data),
          }),
        });
      }
    },
  });
}

function toIsoSlotDate(appointment: Appointment) {
  const [day, month, year] = appointment.slotDate.split('-');
  return `${year}-${month}-${day}`;
}
