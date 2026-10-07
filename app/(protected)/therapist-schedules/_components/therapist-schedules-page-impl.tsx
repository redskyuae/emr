'use client';

import { useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { parseAsInteger, useQueryState } from 'nuqs';

import { getApiErrorMessage } from '@/app/queries/api-error';
import { useHasPermission } from '@/app/queries/identity-access/useCurrentUser';
import { useDoctorRotasQuery } from '@/app/queries/rota-management/useDoctorRotas';
import { useTherapistSchedulesQuery } from '@/app/queries/therapist-schedules/useTherapistSchedules';
import { useTherapistsQuery } from '@/app/queries/therapists/useTherapists';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { TherapistScheduleFormSheet } from './_sheets/therapist-schedule-form-sheet';
import { TherapistSchedulesTable } from './therapist-schedules-table';
import { TherapistSchedulesToolbar } from './therapist-schedules-toolbar';

const PAGE_SIZE = 10;
const isDateOnly = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);

export function TherapistSchedulesPageImpl() {
  const [therapistParam, setTherapistParam] = useQueryState('therapist', { defaultValue: '' });
  const [fromDateParam, setFromDateParam] = useQueryState('from', { defaultValue: '' });
  const [toDateParam, setToDateParam] = useQueryState('to', { defaultValue: '' });
  const [pageParam, setPage] = useQueryState('page', parseAsInteger.withDefault(1));
  const [scheduleParam, setScheduleParam] = useQueryState('schedule');
  const {
    data: canCreate,
    isLoading: canCreateLoading,
    isError: canCreateError,
  } = useHasPermission('therapist-schedule:create');
  const {
    data: canUpdate,
    isLoading: canUpdateLoading,
    isError: canUpdateError,
  } = useHasPermission('therapist-schedule:update');

  const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;
  const parsedTherapistId = therapistParam ? Number(therapistParam) : Number.NaN;
  const therapistId =
    Number.isInteger(parsedTherapistId) && parsedTherapistId > 0 ? parsedTherapistId : undefined;
  const therapistsQuery = useTherapistsQuery({ page: 1, limit: 999 });
  const rotasQuery = useDoctorRotasQuery({ page: 1, limit: 999 });
  const schedulesQuery = useTherapistSchedulesQuery({
    page,
    limit: PAGE_SIZE,
    therapistId,
    fromDate: isDateOnly(fromDateParam) ? fromDateParam : undefined,
    toDate: isDateOnly(toDateParam) ? toDateParam : undefined,
  });
  const therapists = therapistsQuery.data?.data ?? [];
  const rotas = rotasQuery.data?.data ?? [];
  const schedules = schedulesQuery.data?.data ?? [];
  const meta = schedulesQuery.data?.meta;

  useEffect(() => {
    if (pageParam !== page) void setPage(page);
    else if (meta?.totalPages && page > meta.totalPages) void setPage(meta.totalPages);
  }, [meta?.totalPages, page, pageParam, setPage]);

  const isCreating = scheduleParam === 'new' && canCreate;
  const editingScheduleId =
    scheduleParam && scheduleParam !== 'new' && /^\d+$/.test(scheduleParam)
      ? Number(scheduleParam)
      : null;
  const editingSchedule =
    editingScheduleId === null
      ? null
      : (schedules.find(({ id }) => id === editingScheduleId) ?? null);
  const sheetOpen =
    isCreating ||
    Boolean(
      canUpdate &&
      editingScheduleId !== null &&
      (schedulesQuery.isLoading || editingSchedule !== null)
    );
  const accessDenied =
    (scheduleParam === 'new' && !canCreateLoading && !canCreateError && !canCreate) ||
    (editingScheduleId !== null && !canUpdateLoading && !canUpdateError && !canUpdate);

  useEffect(() => {
    if (accessDenied) void setScheduleParam(null);
  }, [accessDenied, setScheduleParam]);

  const goToFirstPage = () => void setPage(1);
  const clearFilters = () => {
    void setTherapistParam(null);
    void setFromDateParam(null);
    void setToDateParam(null);
    goToFirstPage();
  };

  return (
    <>
      <div className="space-y-4">
        <TherapistSchedulesToolbar
          therapists={therapists}
          therapistValue={therapistParam}
          toDateValue={toDateParam}
          fromDateValue={fromDateParam}
          therapistsLoading={therapistsQuery.isLoading}
          canCreate={Boolean(canCreate)}
          onAddSchedule={() => void setScheduleParam('new')}
          onClearFilters={clearFilters}
          onTherapistChange={(value) => {
            void setTherapistParam(value || null);
            goToFirstPage();
          }}
          onFromDateChange={(value) => {
            void setFromDateParam(value || null);
            goToFirstPage();
          }}
          onToDateChange={(value) => {
            void setToDateParam(value || null);
            goToFirstPage();
          }}
        />
        {therapistsQuery.isError ? (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Could not load Therapists</AlertTitle>
            <AlertDescription>{getApiErrorMessage(therapistsQuery.error)}</AlertDescription>
          </Alert>
        ) : null}
        {rotasQuery.isError ? (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Could not load Rotas</AlertTitle>
            <AlertDescription>{getApiErrorMessage(rotasQuery.error)}</AlertDescription>
          </Alert>
        ) : null}
        <TherapistSchedulesTable
          page={page}
          meta={meta}
          therapists={therapists}
          schedules={schedules}
          error={schedulesQuery.error}
          isError={schedulesQuery.isError}
          isLoading={schedulesQuery.isLoading}
          isFetching={schedulesQuery.isFetching}
          canEdit={Boolean(canUpdate)}
          onPageChange={(next) => void setPage(next)}
          onEdit={({ id }) => void setScheduleParam(String(id))}
        />
      </div>
      <TherapistScheduleFormSheet
        open={sheetOpen}
        rotas={rotas}
        therapists={therapists}
        schedule={editingSchedule}
        mode={isCreating ? 'new' : 'edit'}
        rotasLoading={rotasQuery.isLoading}
        therapistsLoading={therapistsQuery.isLoading}
        scheduleResolving={sheetOpen && !isCreating && editingSchedule === null}
        onClose={() => void setScheduleParam(null)}
      />
    </>
  );
}
