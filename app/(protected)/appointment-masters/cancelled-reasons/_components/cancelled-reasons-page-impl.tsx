'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDebouncedValue } from '@tanstack/react-pacer';
import { useRouter } from 'next/navigation';
import { AlertCircle, ChevronLeft, ChevronRight, LayoutGrid, LayoutList, Plus, Search, Table as TableIcon, XCircle, } from 'lucide-react';
import { toast } from 'sonner';
import type { AppointmentCancelledReason } from '@/app/api/lib/modules/appointment-cancelled-reason/schemas/appointment-cancelled-reason-schema';
import { createAppointmentCancelledReasonSchema } from '@/app/api/lib/modules/appointment-cancelled-reason/schemas/appointment-cancelled-reason-schema';
import { getApiErrorMessage, getApiErrors } from '@/app/queries/api-error';
import { useAppointmentCancelledReasonsQuery } from '@/app/queries/appointment-masters/cancelled-reasons/useAppointmentCancelledReasons';
import { useCreateAppointmentCancelledReason } from '@/app/queries/appointment-masters/cancelled-reasons/useCreateAppointmentCancelledReason';
import { useUpdateAppointmentCancelledReason } from '@/app/queries/appointment-masters/cancelled-reasons/useUpdateAppointmentCancelledReason';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle, } from '@/components/ui/empty';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { DeleteCancelledReasonDialog } from './_modals/delete-cancelled-reason-dialog';
import { CancelledReasonFormSheet, type CancelledReasonFormValues, } from './_sheets/cancelled-reason-form-sheet';
import { ViewSkeleton } from './cancelled-reason-skeletons';
import { CancelledReasonCardView, CancelledReasonListView, CancelledReasonTableView, } from './cancelled-reason-views';

type ViewLayout = 'table' | 'card' | 'list';

const PAGE_SIZE = 10;

export function CancelledReasonsPageImpl({
  initialCreateOpen,
}: {
  initialCreateOpen: boolean;
}) {
  const router = useRouter();
  const initialCreateHandledRef = useRef(false);
  const [viewLayout, setViewLayout] = useState<ViewLayout>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch] = useDebouncedValue(searchTerm, { wait: 300 });
  const [page, setPage] = useState(1);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingReason, setEditingReason] = useState<AppointmentCancelledReason | null>(null);
  const [reasonPendingDelete, setReasonPendingDelete] =
    useState<AppointmentCancelledReason | null>(null);
  const [serverErrors, setServerErrors] = useState<string[]>([]);

  const form = useForm<CancelledReasonFormValues>({
    resolver: zodResolver(createAppointmentCancelledReasonSchema),
    defaultValues: { name: '', code: '', description: '' },
    mode: 'onTouched',
  });

  const reasonsQuery = useAppointmentCancelledReasonsQuery({
    query: debouncedSearch || undefined,
    page,
    limit: PAGE_SIZE,
  });

  const createMutation = useCreateAppointmentCancelledReason();
  const updateMutation = useUpdateAppointmentCancelledReason();

  const reasons = reasonsQuery.data?.data ?? [];
  const meta = reasonsQuery.data?.meta;
  const totalPages = meta?.totalPages ?? 0;
  const total = meta?.total ?? 0;
  const rangeStart = total > 0 ? (page - 1) * PAGE_SIZE + 1 : 0;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);
  const isCreating = !editingReason;
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
    setEditingReason(null);
    form.reset({ name: '', code: '', description: '' });
    setServerErrors([]);
    setSheetOpen(true);
  }

  function openEditSheet(reason: AppointmentCancelledReason) {
    setEditingReason(reason);
    form.reset({ name: reason.name, code: reason.code, description: reason.description ?? '' });
    setServerErrors([]);
    setSheetOpen(true);
  }

  function closeSheet() {
    setSheetOpen(false);
    setEditingReason(null);
    form.reset({ name: '', code: '', description: '' });
    setServerErrors([]);
    router.replace('/appointment-masters/cancelled-reasons', { scroll: false });
  }

  const handleSave = form.handleSubmit(async (values) => {
    setServerErrors([]);

    try {
      if (isCreating) {
        await createMutation.mutateAsync({
          name: values.name,
          code: values.code,
          description: values.description || undefined,
        });
        toast.success('Appointment Cancelled Reason created.');
        closeSheet();
      } else {
        await updateMutation.mutateAsync({
          id: editingReason.id,
          request: {
            name: values.name,
            code: values.code,
            description: values.description || undefined,
          },
        });
        toast.success('Appointment Cancelled Reason updated.');
        closeSheet();
      }
    } catch (error) {
      const errors = getApiErrors(error);
      setServerErrors(errors);
      toast.error(getApiErrorMessage(error));
    }
  });

  function handleReasonDeleted(reasonId: number) {
    if (editingReason?.id === reasonId) {
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
                placeholder="Search appointment cancelled reasons..."
                aria-label="Search appointment cancelled reasons"
              />
            </InputGroup>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end lg:ml-auto">
              <Button type="button" size="lg" onClick={openAddSheet}>
                <Plus className="size-4" />
                Add Appointment Cancelled Reason
              </Button>
            </div>
          </CardContent>
        </Card>

        {reasonsQuery.isError ? (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Could not load Appointment Cancelled Reasons</AlertTitle>
            <AlertDescription>{getApiErrorMessage(reasonsQuery.error)}</AlertDescription>
          </Alert>
        ) : null}

        {reasonsQuery.isLoading ? (
          <ViewSkeleton layout={viewLayout} />
        ) : reasons.length === 0 && !debouncedSearch ? (
          <Empty className="bg-card shadow-fluent-2 min-h-80 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <XCircle />
              </EmptyMedia>
              <EmptyTitle>No Appointment Cancelled Reasons yet</EmptyTitle>
              <EmptyDescription>
                Create Appointment Cancelled Reasons to define why Appointments are cancelled in
                this Tenant.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button type="button" onClick={openAddSheet}>
                <Plus className="size-4" />
                Add Appointment Cancelled Reason
              </Button>
            </EmptyContent>
          </Empty>
        ) : reasons.length === 0 && debouncedSearch ? (
          <Empty className="bg-card shadow-fluent-2 min-h-72 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Search />
              </EmptyMedia>
              <EmptyTitle>No results found</EmptyTitle>
              <EmptyDescription>
                No Appointment Cancelled Reasons match &ldquo;{debouncedSearch}&rdquo;. Try a
                different search term.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            {viewLayout === 'table' ? (
              <CancelledReasonTableView
                reasons={reasons}
                onEdit={openEditSheet}
                onDelete={setReasonPendingDelete}
              />
            ) : viewLayout === 'card' ? (
              <CancelledReasonCardView
                reasons={reasons}
                onEdit={openEditSheet}
                onDelete={setReasonPendingDelete}
              />
            ) : (
              <CancelledReasonListView
                reasons={reasons}
                onEdit={openEditSheet}
                onDelete={setReasonPendingDelete}
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

      <CancelledReasonFormSheet
        open={sheetOpen}
        onClose={closeSheet}
        isCreating={isCreating}
        editingName={editingReason?.name ?? null}
        form={form}
        serverErrors={serverErrors}
        isSaving={isSaving}
        onSave={() => void handleSave()}
      />

      <DeleteCancelledReasonDialog
        reason={reasonPendingDelete}
        onClose={() => setReasonPendingDelete(null)}
        onDeleted={handleReasonDeleted}
      />
    </>
  );
}
