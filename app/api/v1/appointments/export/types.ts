import type { AppointmentExportFormat } from '@/app/api/lib/modules/appointment/export/appointment-export';

export type DownloadAppointmentsExportRequest = {
  format: AppointmentExportFormat;
  slotDate?: string;
  doctorId?: number;
  therapistId?: number;
  patientId?: number;
  appointmentStatusId?: number;
  query?: string;
};

export type { AppointmentExportFormat };
