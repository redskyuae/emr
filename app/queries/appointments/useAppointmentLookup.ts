import { useQuery } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { LookupAppointmentResponse } from '@/app/api/v1/appointments/lookup/types';

export const appointmentLookupQueryKey = (bookingNumber: string) =>
  ['appointments', 'lookup', bookingNumber] as const;

async function fetchAppointmentByBookingNumber(
  bookingNumber: string
): Promise<LookupAppointmentResponse> {
  const searchParams = new URLSearchParams({ bookingNumber });
  const response = await fetch(`/api/v1/appointments/lookup?${searchParams.toString()}`, {
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not find the Appointment');
  }

  return response.json() as Promise<LookupAppointmentResponse>;
}

function transformAppointmentLookupResponse(response: LookupAppointmentResponse) {
  return response.data;
}

// Non-suspense and disabled until a Booking Number is typed: the check-in sheet
// owns its own resolving/not-found UI while the rest of the form stays put.
export function useAppointmentLookupQuery(bookingNumber: string) {
  return useQuery({
    queryKey: appointmentLookupQueryKey(bookingNumber),
    queryFn: () => fetchAppointmentByBookingNumber(bookingNumber),
    select: transformAppointmentLookupResponse,
    enabled: bookingNumber.length > 0,
    retry: false,
  });
}
