'use client';

import { useMutation } from '@tanstack/react-query';

import type { DownloadAppointmentsExportRequest } from '@/app/api/v1/appointments/export/types';
import { parseApiError } from '@/app/queries/api-error';

function filenameFromResponse(
  response: Response,
  format: DownloadAppointmentsExportRequest['format']
) {
  const disposition = response.headers.get('Content-Disposition');
  const match = disposition?.match(/filename="([^"\\/]+)"/i);
  return match?.[1] ?? `appointments.${format === 'excel' ? 'xlsx' : 'pdf'}`;
}

function saveFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

async function downloadAppointmentsExport(request: DownloadAppointmentsExportRequest) {
  const searchParams = new URLSearchParams({ format: request.format });

  if (request.slotDate) searchParams.set('slotDate', request.slotDate);
  if (request.doctorId) searchParams.set('doctorId', String(request.doctorId));
  if (request.therapistId) searchParams.set('therapistId', String(request.therapistId));
  if (request.patientId) searchParams.set('patientId', String(request.patientId));
  if (request.appointmentStatusId) {
    searchParams.set('appointmentStatusId', String(request.appointmentStatusId));
  }
  if (request.query) searchParams.set('query', request.query);

  const response = await fetch(`/api/v1/appointments/export?${searchParams.toString()}`, {
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not download the Appointment export');
  }

  saveFile(await response.blob(), filenameFromResponse(response, request.format));
}

export function useDownloadAppointmentsExport() {
  return useMutation({ mutationFn: downloadAppointmentsExport });
}
