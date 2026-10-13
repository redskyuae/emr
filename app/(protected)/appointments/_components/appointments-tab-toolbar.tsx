'use client';

import { Search } from 'lucide-react';

import type { DownloadAppointmentsExportRequest } from '@/app/api/v1/appointments/export/types';
import { Card, CardContent } from '@/components/ui/card';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AppointmentExportActions } from './appointment-export-actions';

const ALL_FILTER = 'all';

type FilterOption = {
  id: number;
  name: string;
};

export function AppointmentsTabToolbar({
  appointmentStatusId,
  appointmentStatuses,
  disabled,
  doctorId,
  doctors,
  exportFilters,
  hasAppointments,
  onAppointmentStatusChange,
  onDoctorChange,
  onSearchChange,
  onTherapistChange,
  searchTerm,
  therapistId,
  therapists,
}: {
  appointmentStatusId: string | null;
  appointmentStatuses: FilterOption[];
  disabled: boolean;
  doctorId: string | null;
  doctors: FilterOption[];
  exportFilters: Omit<DownloadAppointmentsExportRequest, 'format'>;
  hasAppointments: boolean;
  onAppointmentStatusChange: (value: string | null) => void;
  onDoctorChange: (value: string | null) => void;
  onSearchChange: (value: string) => void;
  onTherapistChange: (value: string | null) => void;
  searchTerm: string;
  therapistId: string | null;
  therapists: FilterOption[];
}) {
  return (
    <Card className="shadow-fluent-2">
      <CardContent className="flex flex-col gap-3 p-3 lg:flex-row lg:flex-wrap lg:items-center">
        <Select
          value={doctorId ?? ALL_FILTER}
          onValueChange={(value) => onDoctorChange(value === ALL_FILTER ? null : value)}
        >
          <SelectTrigger className="h-9 lg:w-52" aria-label="Filter by doctor">
            <SelectValue placeholder="All doctors" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_FILTER}>All doctors</SelectItem>
            {doctors.map((doctor) => (
              <SelectItem key={doctor.id} value={String(doctor.id)}>
                {doctor.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={therapistId ?? ALL_FILTER}
          onValueChange={(value) => onTherapistChange(value === ALL_FILTER ? null : value)}
        >
          <SelectTrigger className="h-9 lg:w-52" aria-label="Filter by Therapist">
            <SelectValue placeholder="All Therapists" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_FILTER}>All Therapists</SelectItem>
            {therapists.map((therapist) => (
              <SelectItem key={therapist.id} value={String(therapist.id)}>
                {therapist.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={appointmentStatusId ?? ALL_FILTER}
          onValueChange={(value) => onAppointmentStatusChange(value === ALL_FILTER ? null : value)}
        >
          <SelectTrigger className="h-9 lg:w-48" aria-label="Filter by status">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_FILTER}>All statuses</SelectItem>
            {appointmentStatuses.map((status) => (
              <SelectItem key={status.id} value={String(status.id)}>
                {status.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <InputGroup className="bg-background shadow-fluent-2 h-9 lg:max-w-xs">
          <InputGroupAddon>
            <Search className="size-4" />
          </InputGroupAddon>
          <InputGroupInput
            type="search"
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search booking, MRN, patient or doctor..."
            aria-label="Search appointments"
          />
        </InputGroup>

        <div className="flex flex-wrap gap-2 lg:ml-auto">
          <AppointmentExportActions
            filters={exportFilters}
            hasAppointments={hasAppointments}
            disabled={disabled}
          />
        </div>
      </CardContent>
    </Card>
  );
}
