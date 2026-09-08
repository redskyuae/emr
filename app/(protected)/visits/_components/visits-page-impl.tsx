'use client';

import { useState } from 'react';
import { useQueryState } from 'nuqs';
import { useDebouncedValue } from '@tanstack/react-pacer';
import { AlertCircle, ChevronLeft, ChevronRight, ClipboardList, Plus, Search } from 'lucide-react';
import { toast } from 'sonner';

import type { Visit } from '@/app/api/lib/modules/visit/schemas/visit-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useDoctorsQuery } from '@/app/queries/doctors/useDoctors';
import { useCompleteVisit } from '@/app/queries/visits/useCompleteVisit';
import { useStartConsultation } from '@/app/queries/visits/useStartConsultation';
import { useVisitsQuery } from '@/app/queries/visits/useVisits';
import { useHasPermission } from '@/app/queries/identity-access/useCurrentUser';
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
import { Input } from '@/components/ui/input';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  VISIT_STATUS_FILTERS,
  toDateInputValue,
  toDisplayDate,
  todayDisplayDate,
} from '../_utils/visit-status';
import { CancelVisitDialog } from './_modals/cancel-visit-dialog';
import { CheckInSheet } from './_sheets/check-in-sheet';
import { VisitsTable, VisitsTableSkeleton } from './visits-table';

const PAGE_SIZE = 20;
const ALL_FILTER = 'all';

export function VisitsPageImpl() {
  const [checkInParam, setCheckInParam] = useQueryState('checkin');
  const [dateParam, setDateParam] = useQueryState('date');
  const [doctorParam, setDoctorParam] = useQueryState('doctor');
  const [statusParam, setStatusParam] = useQueryState('status');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch] = useDebouncedValue(searchTerm, { wait: 300 });
  const [page, setPage] = useState(1);
  const [visitPendingCancel, setVisitPendingCancel] = useState<Visit | null>(null);

  // The board is a day view: the date always resolves to something, defaulting
  // to the browser's today until the user picks another day.
  const visitDate = dateParam ?? todayDisplayDate();
  const doctorId = doctorParam && doctorParam !== ALL_FILTER ? Number(doctorParam) : undefined;
  const status = statusParam && statusParam !== ALL_FILTER ? statusParam : undefined;

  const visitsQuery = useVisitsQuery({
    visitDate,
    doctorId,
    status,
    query: debouncedSearch || undefined,
    page,
    limit: PAGE_SIZE,
  });
  const doctorsQuery = useDoctorsQuery({ page: 1, limit: 100, status: 'active' });

  const startMutation = useStartConsultation();
  const completeMutation = useCompleteVisit();

  const { data: canCreate } = useHasPermission('visit:create');
  const { data: canStart } = useHasPermission('visit:start');
  const { data: canComplete } = useHasPermission('visit:complete');
  const { data: canCancel } = useHasPermission('visit:cancel');

  const visits = visitsQuery.data?.data ?? [];
  const meta = visitsQuery.data?.meta;
  const total = meta?.total ?? 0;
  const totalPages = meta?.totalPages ?? 0;
  const rangeStart = total > 0 ? (page - 1) * PAGE_SIZE + 1 : 0;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);
  const pendingVisitId =
    (startMutation.isPending ? startMutation.variables : undefined) ??
    (completeMutation.isPending ? completeMutation.variables?.valueOf() : undefined) ??
    null;

  async function handleStart(visit: Visit) {
    try {
      await startMutation.mutateAsync(visit.id);
      toast.success(`${visit.visitNumber} is now in consultation.`);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  async function handleComplete(visit: Visit) {
    try {
      await completeMutation.mutateAsync(visit.id);
      toast.success(`${visit.visitNumber} completed.`);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <>
      <div className="space-y-4">
        <Card className="shadow-fluent-2">
          <CardContent className="flex flex-col gap-3 p-3 lg:flex-row lg:items-center">
            <Input
              type="date"
              aria-label="Visit date"
              className="h-9 lg:w-44"
              value={toDateInputValue(visitDate)}
              onChange={(event) => {
                setPage(1);
                void setDateParam(event.target.value ? toDisplayDate(event.target.value) : null);
              }}
            />

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

            <Select
              value={statusParam ?? ALL_FILTER}
              onValueChange={(value) => {
                setPage(1);
                void setStatusParam(value === ALL_FILTER ? null : value);
              }}
            >
              <SelectTrigger className="h-9 lg:w-44" aria-label="Filter by status">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_FILTER}>All statuses</SelectItem>
                {VISIT_STATUS_FILTERS.map((filter) => (
                  <SelectItem key={filter.value} value={filter.value}>
                    {filter.label}
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
                placeholder="Search visit, MRN or name..."
                aria-label="Search visits"
              />
            </InputGroup>

            {canCreate ? (
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end lg:ml-auto">
                <Button type="button" onClick={() => void setCheckInParam('new')}>
                  <Plus className="size-4" />
                  Check in
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {visitsQuery.isError ? (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Could not load Visits</AlertTitle>
            <AlertDescription>{getApiErrorMessage(visitsQuery.error)}</AlertDescription>
          </Alert>
        ) : null}

        {visitsQuery.isLoading ? (
          <VisitsTableSkeleton />
        ) : visits.length === 0 ? (
          <Empty className="bg-card shadow-fluent-2 min-h-80 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ClipboardList />
              </EmptyMedia>
              <EmptyTitle>No Visits for {visitDate}</EmptyTitle>
              <EmptyDescription>
                Check a Patient in to start the queue for this day, from a booked Appointment or as
                a Walk-in.
              </EmptyDescription>
            </EmptyHeader>
            {canCreate ? (
              <EmptyContent>
                <Button type="button" onClick={() => void setCheckInParam('new')}>
                  <Plus className="size-4" />
                  Check in
                </Button>
              </EmptyContent>
            ) : null}
          </Empty>
        ) : (
          <>
            <VisitsTable
              visits={visits}
              pendingVisitId={pendingVisitId as number | null}
              canStart={canStart}
              canComplete={canComplete}
              canCancel={canCancel}
              onStart={(visit) => void handleStart(visit)}
              onComplete={(visit) => void handleComplete(visit)}
              onCancel={setVisitPendingCancel}
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

      <CheckInSheet
        open={checkInParam === 'new' && canCreate}
        onClose={() => void setCheckInParam(null)}
      />

      <CancelVisitDialog visit={visitPendingCancel} onClose={() => setVisitPendingCancel(null)} />
    </>
  );
}
