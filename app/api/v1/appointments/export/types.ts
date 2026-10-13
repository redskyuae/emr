import type { AppointmentExportFormat } from '@/app/api/lib/modules/appointment/export/appointment-export';
import type { AppointmentStatusCategory } from '@/app/api/lib/modules/appointment-status/schemas/appointment-status-schema';

export type DownloadAppointmentsExportRequest = {
  format: AppointmentExportFormat;
  slotDate?: string;
  fromDate?: string;
  doctorId?: number;
  therapistId?: number;
  patientId?: number;
  appointmentStatusId?: number;
  statusCategories?: AppointmentStatusCategory[];
  query?: string;
};

export type { AppointmentExportFormat };
