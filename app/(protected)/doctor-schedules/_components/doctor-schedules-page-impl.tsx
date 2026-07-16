'use client';

import { useEffect } from 'react';
import { parseAsInteger, useQueryState } from 'nuqs';
import { AlertCircle } from 'lucide-react';

import { getApiErrorMessage } from '@/app/queries/api-error';
import { useDoctorSchedulesQuery } from '@/app/queries/doctor-schedules/useDoctorSchedules';
import { useDoctorsQuery } from '@/app/queries/doctors/useDoctors';
import { useDoctorRotasQuery } from '@/app/queries/rota-management/useDoctorRotas';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

import { DoctorScheduleFormSheet } from './_sheets/doctor-schedule-form-sheet';
import { DoctorSchedulesTable } from './doctor-schedules-table';
import { DoctorSchedulesToolbar } from './doctor-schedules-toolbar';

const PAGE_SIZE = 10;

function isDateOnly(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function DoctorSchedulesPageImpl() {
  const [doctorParam, setDoctorParam] = useQueryState('doctor', { defaultValue: '' });
  const [fromDateParam, setFromDateParam] = useQueryState('from', { defaultValue: '' });
  const [toDateParam, setToDateParam] = useQueryState('to', { defaultValue: '' });
  const [pageParam, setPage] = useQueryState('page', parseAsInteger.withDefault(1));
  const [scheduleParam, setScheduleParam] = useQueryState('schedule');

  const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;
  const parsedDoctorId = doctorParam ? Number(doctorParam) : Number.NaN;
  const doctorId =
    Number.isInteger(parsedDoctorId) && parsedDoctorId > 0 ? parsedDoctorId : undefined;
  const fromDate = isDateOnly(fromDateParam) ? fromDateParam : undefined;
  const toDate = isDateOnly(toDateParam) ? toDateParam : undefined;

  const doctorsQuery = useDoctorsQuery({ page: 1, limit: 999 });
  const rotasQuery = useDoctorRotasQuery({ page: 1, limit: 999 });
  const schedulesQuery = useDoctorSchedulesQuery({
    page,
    limit: PAGE_SIZE,
    toDate,
    doctorId,
    fromDate,
  });

  const doctors = doctorsQuery.data?.data ?? [];
  const rotas = rotasQuery.data?.data ?? [];
  const schedules = schedulesQuery.data?.data ?? [];
  const meta = schedulesQuery.data?.meta;

  useEffect(() => {
    if (pageParam !== page) {
      void setPage(page);
      return;
    }

    if (meta?.totalPages && page > meta.totalPages) {
      void setPage(meta.totalPages);
    }
  }, [meta?.totalPages, page, pageParam, setPage]);

  const isCreating = scheduleParam === 'new';
  const editingScheduleId =
    scheduleParam !== null && scheduleParam !== 'new' && /^\d+$/.test(scheduleParam)
      ? Number(scheduleParam)
      : null;
  const editingSchedule =
    editingScheduleId !== null
      ? (schedules.find((schedule) => schedule.id === editingScheduleId) ?? null)
      : null;

  const sheetOpen =
    isCreating ||
    (editingScheduleId !== null && (schedulesQuery.isLoading || editingSchedule !== null));
  const scheduleResolving = sheetOpen && !isCreating && editingSchedule === null;

  function goToFirstPage() {
    void setPage(1);
  }

  function clearFilters() {
    void setDoctorParam(null);
    void setFromDateParam(null);
    void setToDateParam(null);
    goToFirstPage();
  }

  return (
    <>
      <div className="space-y-4">
        <DoctorSchedulesToolbar
          doctors={doctors}
          doctorValue={doctorParam}
          toDateValue={toDateParam}
          fromDateValue={fromDateParam}
          doctorsLoading={doctorsQuery.isLoading}
          onAddSchedule={() => void setScheduleParam('new')}
          onClearFilters={clearFilters}
          onDoctorChange={(value) => {
            void setDoctorParam(value || null);
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

        {doctorsQuery.isError ? (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Could not load Doctors</AlertTitle>
            <AlertDescription>{getApiErrorMessage(doctorsQuery.error)}</AlertDescription>
          </Alert>
        ) : null}

        {rotasQuery.isError ? (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Could not load Doctor Rotas</AlertTitle>
            <AlertDescription>{getApiErrorMessage(rotasQuery.error)}</AlertDescription>
          </Alert>
        ) : null}

        <DoctorSchedulesTable
          page={page}
          doctors={doctors}
          meta={meta}
          schedules={schedules}
          error={schedulesQuery.error}
          isError={schedulesQuery.isError}
          isLoading={schedulesQuery.isLoading}
          isFetching={schedulesQuery.isFetching}
          onPageChange={(next) => void setPage(next)}
          onEdit={(schedule) => void setScheduleParam(String(schedule.id))}
        />
      </div>

      <DoctorScheduleFormSheet
        open={sheetOpen}
        doctors={doctors}
        rotas={rotas}
        schedule={editingSchedule}
        mode={isCreating ? 'new' : 'edit'}
        doctorsLoading={doctorsQuery.isLoading}
        rotasLoading={rotasQuery.isLoading}
        scheduleResolving={scheduleResolving}
        onClose={() => void setScheduleParam(null)}
      />
    </>
  );
}
