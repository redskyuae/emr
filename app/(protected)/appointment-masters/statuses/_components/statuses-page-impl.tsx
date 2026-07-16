'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDebouncedValue } from '@tanstack/react-pacer';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  LayoutGrid,
  LayoutList,
  Plus,
  Search,
  Table as TableIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import type { AppointmentStatus } from '@/app/api/lib/modules/appointment-status/schemas/appointment-status-schema';
import { createAppointmentStatusSchema } from '@/app/api/lib/modules/appointment-status/schemas/appointment-status-schema';
import { getApiErrorMessage, getApiErrors } from '@/app/queries/api-error';
import { useAppointmentStatusesQuery } from '@/app/queries/appointment-masters/statuses/useAppointmentStatuses';
import { useCreateAppointmentStatus } from '@/app/queries/appointment-masters/statuses/useCreateAppointmentStatus';
import { useUpdateAppointmentStatus } from '@/app/queries/appointment-masters/statuses/useUpdateAppointmentStatus';
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
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { StatusDeleteDialog } from './_modals/delete-status-dialog';
import { StatusFormSheet, type StatusFormValues } from './_sheets/status-form-sheet';
import { ViewSkeleton } from './status-skeletons';
import { StatusCardView, StatusListView, StatusTableView } from './status-views';

type ViewLayout = 'table' | 'card' | 'list';

const PAGE_SIZE = 10;

export function StatusesPageImpl({ initialCreateOpen }: { initialCreateOpen: boolean }) {
  const router = useRouter();
  const initialCreateHandledRef = useRef(false);
  const [viewLayout, setViewLayout] = useState<ViewLayout>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch] = useDebouncedValue(searchTerm, { wait: 300 });
  const [page, setPage] = useState(1);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<AppointmentStatus | null>(null);
  const [statusPendingDelete, setStatusPendingDelete] = useState<AppointmentStatus | null>(null);
  const [serverErrors, setServerErrors] = useState<string[]>([]);

  const form = useForm<StatusFormValues>({
    resolver: zodResolver(createAppointmentStatusSchema),
    defaultValues: { name: '', code: '', category: 'SCHEDULED', description: '' },
  });

  const statusesQuery = useAppointmentStatusesQuery({
    query: debouncedSearch || undefined,
    page,
    limit: PAGE_SIZE,
  });

  const createMutation = useCreateAppointmentStatus();
  const updateMutation = useUpdateAppointmentStatus();

  const statuses = statusesQuery.data?.data ?? [];
  const meta = statusesQuery.data?.meta;
  const totalPages = meta?.totalPages ?? 0;
  const total = meta?.total ?? 0;
  const rangeStart = total > 0 ? (page - 1) * PAGE_SIZE + 1 : 0;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);
  const isCreating = !editingStatus;
  const isSaving = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (!initialCreateOpen || initialCreateHandledRef.current) {
      return;
    }

    initialCreateHandledRef.current = true;
    openAddSheet();
  }, [initialCreateOpen]);

  const previousDebouncedRef = useRef(debouncedSearch);
  if (previousDebouncedRef.current !== debouncedSearch) {
    previousDebouncedRef.current = debouncedSearch;
    if (page !== 1) {
      setPage(1);
    }
  }

  function openAddSheet() {
    setEditingStatus(null);
    form.reset({ name: '', code: '', category: 'SCHEDULED', description: '' });
    setServerErrors([]);
    setSheetOpen(true);
  }

  function openEditSheet(status: AppointmentStatus) {
    setEditingStatus(status);
    form.reset({
      name: status.name,
      code: status.code,
      category: status.category,
      description: status.description ?? '',
    });
    setServerErrors([]);
    setSheetOpen(true);
  }

  function closeSheet() {
    setSheetOpen(false);
    setEditingStatus(null);
    form.reset({ name: '', code: '', category: 'SCHEDULED', description: '' });
    setServerErrors([]);
    router.replace('/appointment-masters/statuses', { scroll: false });
  }

  const handleSave = form.handleSubmit(async (values) => {
    setServerErrors([]);

    try {
      if (isCreating) {
        await createMutation.mutateAsync({
          name: values.name,
          code: values.code,
          category: values.category,
          description: values.description || undefined,
        });
        toast.success('Appointment Status created.');
        closeSheet();
      } else {
        await updateMutation.mutateAsync({
          id: editingStatus.id,
          request: {
            name: values.name,
            code: values.code,
            category: values.category,
            description: values.description || undefined,
          },
        });
        toast.success('Appointment Status updated.');
        closeSheet();
      }
    } catch (error) {
      const errors = getApiErrors(error);
      setServerErrors(errors);
      toast.error(getApiErrorMessage(error));
    }
  });

  function handleStatusDeleted(statusId: number) {
    if (editingStatus?.id === statusId) {
      closeSheet();
    }
  }

  return (
    <>
      <div className="space-y-4">
        <Card className="shadow-fluent-2">
          <CardContent className="flex flex-col gap-3 p-3 lg:flex-row lg:items-center">
            <ToggleGroup
              type="single"
              value={viewLayout}
              onValueChange={(value) => {
                if (value) setViewLayout(value as ViewLayout);
              }}
              variant="outline"
              size="lg"
              spacing={0}
            >
              <ToggleGroupItem value="table" aria-label="Table view">
                <TableIcon className="size-4" />
                Table
              </ToggleGroupItem>
              <ToggleGroupItem value="card" aria-label="Card view">
                <LayoutGrid className="size-4" />
                Card
              </ToggleGroupItem>
              <ToggleGroupItem value="list" aria-label="List view">
                <LayoutList className="size-4" />
                List
              </ToggleGroupItem>
            </ToggleGroup>

            <InputGroup className="bg-background shadow-fluent-2 h-9 lg:max-w-sm">
              <InputGroupAddon>
                <Search className="size-4" />
              </InputGroupAddon>
              <InputGroupInput
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search appointment statuses..."
                aria-label="Search appointment statuses"
              />
            </InputGroup>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end lg:ml-auto">
              <Button type="button" size="lg" onClick={openAddSheet}>
                <Plus className="size-4" />
                Add Appointment Status
              </Button>
            </div>
          </CardContent>
        </Card>

        {statusesQuery.isError ? (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Could not load Appointment Statuses</AlertTitle>
            <AlertDescription>{getApiErrorMessage(statusesQuery.error)}</AlertDescription>
          </Alert>
        ) : null}

        {statusesQuery.isLoading ? (
          <ViewSkeleton layout={viewLayout} />
        ) : statuses.length === 0 && !debouncedSearch ? (
          <Empty className="bg-card shadow-fluent-2 min-h-80 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ClipboardList />
              </EmptyMedia>
              <EmptyTitle>No Appointment Statuses yet</EmptyTitle>
              <EmptyDescription>
                Create Appointment Statuses to define lifecycle states for Appointments in this
                Tenant.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button type="button" onClick={openAddSheet}>
                <Plus className="size-4" />
                Add Appointment Status
              </Button>
            </EmptyContent>
          </Empty>
        ) : statuses.length === 0 && debouncedSearch ? (
          <Empty className="bg-card shadow-fluent-2 min-h-72 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Search />
              </EmptyMedia>
              <EmptyTitle>No results found</EmptyTitle>
              <EmptyDescription>
                No Appointment Statuses match &ldquo;{debouncedSearch}&rdquo;. Try a different
                search term.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            {viewLayout === 'table' ? (
              <StatusTableView
                statuses={statuses}
                onEdit={openEditSheet}
                onDelete={setStatusPendingDelete}
              />
            ) : viewLayout === 'card' ? (
              <StatusCardView
                statuses={statuses}
                onEdit={openEditSheet}
                onDelete={setStatusPendingDelete}
              />
            ) : (
              <StatusListView
                statuses={statuses}
                onEdit={openEditSheet}
                onDelete={setStatusPendingDelete}
              />
            )}

            {totalPages > 0 ? (
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
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="size-4" />
                    Previous
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
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

      <StatusFormSheet
        open={sheetOpen}
        onClose={closeSheet}
        isCreating={isCreating}
        editingName={editingStatus?.name ?? null}
        form={form}
        serverErrors={serverErrors}
        isSaving={isSaving}
        onSave={() => void handleSave()}
      />

      <StatusDeleteDialog
        status={statusPendingDelete}
        onClose={() => setStatusPendingDelete(null)}
        onDeleted={handleStatusDeleted}
      />
    </>
  );
}
