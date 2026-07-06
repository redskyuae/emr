'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDebouncedValue } from '@tanstack/react-pacer';
import { useQueryState } from 'nuqs';
import { AlertCircle, ChevronLeft, ChevronRight, ClipboardList, LayoutGrid, LayoutList, Plus, Search, Table as TableIcon, } from 'lucide-react';
import { toast } from 'sonner';
import type { AppointmentReason } from '@/app/api/lib/modules/appointment-reason/schemas/appointment-reason-schema';
import { createAppointmentReasonSchema } from '@/app/api/lib/modules/appointment-reason/schemas/appointment-reason-schema';
import { getApiErrorMessage, getApiErrors } from '@/app/queries/api-error';
import { useAppointmentReasonsQuery } from '@/app/queries/appointment-masters/reasons/useAppointmentReasons';
import { useCreateAppointmentReason } from '@/app/queries/appointment-masters/reasons/useCreateAppointmentReason';
import { useUpdateAppointmentReason } from '@/app/queries/appointment-masters/reasons/useUpdateAppointmentReason';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle, } from '@/components/ui/empty';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ReasonDeleteDialog } from './_modals/delete-reason-dialog';
import { ReasonFormSheet, type ReasonFormValues } from './_sheets/reason-form-sheet';
import { ViewSkeleton } from './reason-skeletons';
import { ReasonCardView, ReasonListView, ReasonTableView } from './reason-views';

type ViewLayout = 'table' | 'card' | 'list';

const PAGE_SIZE = 10;

export function ReasonsPageImpl() {
  const [reasonParam, setReasonParam] = useQueryState('reason');
  const [viewLayout, setViewLayout] = useState<ViewLayout>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch] = useDebouncedValue(searchTerm, { wait: 300 });
  const [page, setPage] = useState(1);

  const [reasonPendingDelete, setReasonPendingDelete] = useState<AppointmentReason | null>(null);
  const [serverErrors, setServerErrors] = useState<string[]>([]);

  const form = useForm<ReasonFormValues>({
    resolver: zodResolver(createAppointmentReasonSchema),
    defaultValues: { name: '', code: '', description: '' },
  });

  const reasonsQuery = useAppointmentReasonsQuery({
    query: debouncedSearch || undefined,
    page,
    limit: PAGE_SIZE,
  });

  const createMutation = useCreateAppointmentReason();
  const updateMutation = useUpdateAppointmentReason();

  const reasons = reasonsQuery.data?.data ?? [];
  const meta = reasonsQuery.data?.meta;
  const totalPages = meta?.totalPages ?? 0;
  const total = meta?.total ?? 0;
  const rangeStart = total > 0 ? (page - 1) * PAGE_SIZE + 1 : 0;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);
  const isSaving = createMutation.isPending || updateMutation.isPending;

 
  const isCreating = reasonParam === 'new';
  const editingReasonId =
    reasonParam !== null && reasonParam !== 'new' && /^\d+$/.test(reasonParam)
      ? Number(reasonParam)
      : null;
  const editingReason =
    editingReasonId !== null
      ? (reasons.find((reason) => reason.id === editingReasonId) ?? null)
      : null;
  const sheetOpen =
    isCreating || (editingReasonId !== null && (reasonsQuery.isLoading || editingReason !== null));

  const previousDebouncedRef = useRef(debouncedSearch);
  useEffect(() => {
    if (previousDebouncedRef.current !== debouncedSearch) {
      previousDebouncedRef.current = debouncedSearch;
      setPage(1);
    }
  }, [debouncedSearch]);

  const sessionKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (!sheetOpen) {
      sessionKeyRef.current = null;
      return;
    }

    if (!isCreating && editingReason === null) {
      return;
    }

    const sessionKey = isCreating ? 'new' : String(editingReasonId);

    if (sessionKeyRef.current === sessionKey) {
      return;
    }

    sessionKeyRef.current = sessionKey;
    form.reset({
      name: editingReason?.name ?? '',
      code: editingReason?.code ?? '',
      description: editingReason?.description ?? '',
    });
    setServerErrors([]);
  }, [sheetOpen, isCreating, editingReasonId, editingReason, form]);

  function openAddSheet() {
    void setReasonParam('new');
  }

  function openEditSheet(reason: AppointmentReason) {
    void setReasonParam(String(reason.id));
  }

  function closeSheet() {
    void setReasonParam(null);
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
        toast.success('Appointment Reason created.');
        closeSheet();
      } else if (editingReasonId !== null) {
        await updateMutation.mutateAsync({
          id: editingReasonId,
          request: {
            name: values.name,
            code: values.code,
            description: values.description || undefined,
          },
        });
        toast.success('Appointment Reason updated.');
        closeSheet();
      }
    } catch (error) {
      const errors = getApiErrors(error);
      setServerErrors(errors);
      toast.error(getApiErrorMessage(error));
    }
  });

  function handleReasonDeleted(reasonId: number) {
    if (editingReasonId === reasonId) {
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
                placeholder="Search appointment reasons..."
                aria-label="Search appointment reasons"
              />
            </InputGroup>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end lg:ml-auto">
              <Button type="button" size="lg" onClick={openAddSheet}>
                <Plus className="size-4" />
                Add Appointment Reason
              </Button>
            </div>
          </CardContent>
        </Card>

        {reasonsQuery.isError ? (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Could not load Appointment Reasons</AlertTitle>
            <AlertDescription>{getApiErrorMessage(reasonsQuery.error)}</AlertDescription>
          </Alert>
        ) : null}

        {reasonsQuery.isLoading ? (
          <ViewSkeleton layout={viewLayout} />
        ) : reasons.length === 0 && !debouncedSearch ? (
          <Empty className="bg-card shadow-fluent-2 min-h-80 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ClipboardList />
              </EmptyMedia>
              <EmptyTitle>No Appointment Reasons yet</EmptyTitle>
              <EmptyDescription>
                Create Appointment Reasons to define booking reasons for Appointments in this
                Tenant.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button type="button" onClick={openAddSheet}>
                <Plus className="size-4" />
                Add Appointment Reason
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
                No Appointment Reasons match &ldquo;{debouncedSearch}&rdquo;. Try a different search
                term.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            {viewLayout === 'table' ? (
              <ReasonTableView
                reasons={reasons}
                onEdit={openEditSheet}
                onDelete={setReasonPendingDelete}
              />
            ) : viewLayout === 'card' ? (
              <ReasonCardView
                reasons={reasons}
                onEdit={openEditSheet}
                onDelete={setReasonPendingDelete}
              />
            ) : (
              <ReasonListView
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

      <ReasonFormSheet
        open={sheetOpen}
        onClose={closeSheet}
        isCreating={isCreating}
        editingName={editingReason?.name ?? null}
        form={form}
        serverErrors={serverErrors}
        isSaving={isSaving}
        onSave={() => void handleSave()}
      />

      <ReasonDeleteDialog
        reason={reasonPendingDelete}
        onClose={() => setReasonPendingDelete(null)}
        onDeleted={handleReasonDeleted}
      />
    </>
  );
}
