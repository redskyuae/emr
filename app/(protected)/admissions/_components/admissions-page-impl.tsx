'use client';

import { useState } from 'react';
import { useQueryState } from 'nuqs';
import { useDebouncedValue } from '@tanstack/react-pacer';
import { AlertCircle, BedDouble, ChevronLeft, ChevronRight, Plus, Search } from 'lucide-react';

import type { Admission } from '@/app/api/lib/modules/admission/schemas/admission-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useAdmissionsQuery } from '@/app/queries/admissions/useAdmissions';
import { useDoctorsQuery } from '@/app/queries/doctors/useDoctors';
import { useWardsQuery } from '@/app/queries/inpatient-masters/wards/useWards';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ADMISSION_STATUS_FILTERS } from '../_utils/admission-status';
import { CancelAdmissionDialog } from './_modals/cancel-admission-dialog';
import { DischargeDialog } from './_modals/discharge-dialog';
import { TransferBedDialog } from './_modals/transfer-bed-dialog';
import { AdmitPatientSheet } from './_sheets/admit-patient-sheet';
import { AdmissionsTable, AdmissionsTableSkeleton } from './admissions-table';

const PAGE_SIZE = 20;
const ALL_FILTER = 'all';

export function AdmissionsPageImpl() {
  const [admitParam, setAdmitParam] = useQueryState('admit');
  const [wardParam, setWardParam] = useQueryState('ward');
  const [bedParam, setBedParam] = useQueryState('bed');
  const [doctorParam, setDoctorParam] = useQueryState('doctor');
  const [statusParam, setStatusParam] = useQueryState('status');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch] = useDebouncedValue(searchTerm, { wait: 300 });
  const [page, setPage] = useState(1);
  const [admissionPendingTransfer, setAdmissionPendingTransfer] = useState<Admission | null>(null);
  const [admissionPendingDischarge, setAdmissionPendingDischarge] = useState<Admission | null>(
    null
  );
  const [admissionPendingCancel, setAdmissionPendingCancel] = useState<Admission | null>(null);

  // The census defaults to Active Admissions — "who is in the hospital now".
  const status = statusParam && statusParam !== ALL_FILTER ? statusParam : undefined;
  const effectiveStatus = statusParam === null ? 'ADMITTED' : status;
  const wardId = wardParam && wardParam !== ALL_FILTER ? Number(wardParam) : undefined;
  const doctorId = doctorParam && doctorParam !== ALL_FILTER ? Number(doctorParam) : undefined;

  const admissionsQuery = useAdmissionsQuery({
    status: effectiveStatus,
    wardId,
    doctorId,
    query: debouncedSearch || undefined,
    page,
    limit: PAGE_SIZE,
  });
  const wardsQuery = useWardsQuery({ page: 1, limit: 999 });
  const doctorsQuery = useDoctorsQuery({ page: 1, limit: 100, status: 'active' });

  const admissions = admissionsQuery.data?.data ?? [];
  const meta = admissionsQuery.data?.meta;
  const total = meta?.total ?? 0;
  const totalPages = meta?.totalPages ?? 0;
  const rangeStart = total > 0 ? (page - 1) * PAGE_SIZE + 1 : 0;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);

  // ?admit=new opens the sheet; the Bed Board deep-links ?admit=new&ward=…&bed=…
  // with the target Bed preselected.
  const admitOpen = admitParam === 'new';
  const presetWardId =
    admitOpen && wardParam && /^\d+$/.test(wardParam) ? Number(wardParam) : undefined;
  const presetBedId =
    admitOpen && bedParam && /^\d+$/.test(bedParam) ? Number(bedParam) : undefined;

  function closeAdmitSheet() {
    void setAdmitParam(null);
    void setBedParam(null);
  }

  return (
    <>
      <div className="space-y-4">
        <Card className="shadow-fluent-2">
          <CardContent className="flex flex-col gap-3 p-3 lg:flex-row lg:items-center">
            <Select
              value={statusParam ?? 'ADMITTED'}
              onValueChange={(value) => {
                setPage(1);
                void setStatusParam(value === 'ADMITTED' ? null : value);
              }}
            >
              <SelectTrigger className="h-9 lg:w-44" aria-label="Filter by status">
                <SelectValue placeholder="Admitted" />
              </SelectTrigger>
              <SelectContent>
                {ADMISSION_STATUS_FILTERS.map((filter) => (
                  <SelectItem key={filter.value} value={filter.value}>
                    {filter.label}
                  </SelectItem>
                ))}
                <SelectItem value={ALL_FILTER}>All statuses</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={wardParam ?? ALL_FILTER}
              onValueChange={(value) => {
                setPage(1);
                void setWardParam(value === ALL_FILTER ? null : value);
              }}
            >
              <SelectTrigger className="h-9 lg:w-48" aria-label="Filter by ward">
                <SelectValue placeholder="All Wards" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_FILTER}>All Wards</SelectItem>
                {(wardsQuery.data?.data ?? []).map((ward) => (
                  <SelectItem key={ward.id} value={String(ward.id)}>
                    {ward.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={doctorParam ?? ALL_FILTER}
              onValueChange={(value) => {
                setPage(1);
                void setDoctorParam(value === ALL_FILTER ? null : value);
              }}
            >
              <SelectTrigger className="h-9 lg:w-52" aria-label="Filter by doctor">
                <SelectValue placeholder="All doctors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_FILTER}>All doctors</SelectItem>
                {(doctorsQuery.data?.data ?? []).map((doctor) => (
                  <SelectItem key={doctor.id} value={String(doctor.id)}>
                    {doctor.name}
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
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setPage(1);
                }}
                placeholder="Search admission, MRN or name..."
                aria-label="Search admissions"
              />
            </InputGroup>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end lg:ml-auto">
              <Button type="button" onClick={() => void setAdmitParam('new')}>
                <Plus className="size-4" />
                Admit Patient
              </Button>
            </div>
          </CardContent>
        </Card>

        {admissionsQuery.isError ? (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Could not load Admissions</AlertTitle>
            <AlertDescription>{getApiErrorMessage(admissionsQuery.error)}</AlertDescription>
          </Alert>
        ) : null}

        {admissionsQuery.isLoading ? (
          <AdmissionsTableSkeleton />
        ) : admissions.length === 0 ? (
          <Empty className="bg-card shadow-fluent-2 min-h-80 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <BedDouble />
              </EmptyMedia>
              <EmptyTitle>No Admissions match</EmptyTitle>
              <EmptyDescription>
                Admit a Patient to a free Bed to start the inpatient census. Configure Wards and
                Beds under Inpatient Masters first.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button type="button" onClick={() => void setAdmitParam('new')}>
                <Plus className="size-4" />
                Admit Patient
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <>
            <AdmissionsTable
              admissions={admissions}
              onTransfer={setAdmissionPendingTransfer}
              onDischarge={setAdmissionPendingDischarge}
              onCancel={setAdmissionPendingCancel}
            />

            {totalPages > 1 ? (
              <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
                <p className="text-muted-foreground text-sm">
                  Showing {rangeStart}&ndash;{rangeEnd} of {total}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                  >
                    <ChevronLeft className="size-4" />
                    Previous
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((current) => current + 1)}
                  >
                    Next
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>

      <AdmitPatientSheet
        open={admitOpen}
        presetWardId={presetWardId}
        presetBedId={presetBedId}
        onClose={closeAdmitSheet}
      />

      <TransferBedDialog
        admission={admissionPendingTransfer}
        onClose={() => setAdmissionPendingTransfer(null)}
      />

      <DischargeDialog
        admission={admissionPendingDischarge}
        onClose={() => setAdmissionPendingDischarge(null)}
      />

      <CancelAdmissionDialog
        admission={admissionPendingCancel}
        onClose={() => setAdmissionPendingCancel(null)}
      />
    </>
  );
}
