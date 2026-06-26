'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDebouncedValue } from '@tanstack/react-pacer';
import { useRouter } from 'next/navigation';
import { AlertCircle, ChevronLeft, ChevronRight, ClipboardList, LayoutGrid, LayoutList, Plus, Search, Table as TableIcon, } from 'lucide-react';
import { toast } from 'sonner';
import type { AppointmentMode } from '@/app/api/lib/modules/appointment-mode/schemas/appointment-mode-schema';
import { createAppointmentModeSchema } from '@/app/api/lib/modules/appointment-mode/schemas/appointment-mode-schema';
import { getApiErrorMessage, getApiErrors } from '@/app/queries/api-error';
import { useAppointmentModesQuery } from '@/app/queries/appointment-masters/useAppointmentModes';
import { useCreateAppointmentMode } from '@/app/queries/appointment-masters/useCreateAppointmentMode';
import { useDeleteAppointmentMode } from '@/app/queries/appointment-masters/useDeleteAppointmentMode';
import { useUpdateAppointmentMode } from '@/app/queries/appointment-masters/useUpdateAppointmentMode';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle, } from '@/components/ui/empty';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ModeDeleteDialog, ModeFormSheet, type ModeFormValues } from './mode-form-sheet';
import { ViewSkeleton } from './mode-skeletons';
import { ModeCardView, ModeListView, ModeTableView } from './mode-views';

type ViewLayout = 'table' | 'card' | 'list';

const PAGE_SIZE = 10;

export function ModesPageImpl({ initialCreateOpen }: { initialCreateOpen: boolean }) {
  const router = useRouter();
  const initialCreateHandledRef = useRef(false);
  const [viewLayout, setViewLayout] = useState<ViewLayout>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch] = useDebouncedValue(searchTerm, { wait: 300 });
  const [page, setPage] = useState(1);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingMode, setEditingMode] = useState<AppointmentMode | null>(null);
  const [modePendingDelete, setModePendingDelete] = useState<AppointmentMode | null>(null);
  const [serverErrors, setServerErrors] = useState<string[]>([]);

  const form = useForm<ModeFormValues>({
    resolver: zodResolver(createAppointmentModeSchema),
    defaultValues: { name: '', code: '', description: '' },
  });

  const modesQuery = useAppointmentModesQuery({
    query: debouncedSearch || undefined,
    page,
    limit: PAGE_SIZE,
  });

  const createMutation = useCreateAppointmentMode();
  const updateMutation = useUpdateAppointmentMode();
  const deleteMutation = useDeleteAppointmentMode();

  const modes = modesQuery.data?.data ?? [];
  const meta = modesQuery.data?.meta;
  const totalPages = meta?.totalPages ?? 0;
  const total = meta?.total ?? 0;
  const rangeStart = total > 0 ? (page - 1) * PAGE_SIZE + 1 : 0;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);
  const isCreating = !editingMode;
  const isSaving = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (!initialCreateOpen || initialCreateHandledRef.current) {
      return;
    }

    initialCreateHandledRef.current = true;
    openAddSheet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCreateOpen]);

  const previousDebouncedRef = useRef(debouncedSearch);
  if (previousDebouncedRef.current !== debouncedSearch) {
    previousDebouncedRef.current = debouncedSearch;
    if (page !== 1) {
      setPage(1);
    }
  }

  function openAddSheet() {
    setEditingMode(null);
    form.reset({ name: '', code: '', description: '' });
    setServerErrors([]);
    setSheetOpen(true);
  }

  function openEditSheet(mode: AppointmentMode) {
    setEditingMode(mode);
    form.reset({ name: mode.name, code: mode.code, description: mode.description ?? '' });
    setServerErrors([]);
    setSheetOpen(true);
  }

  function closeSheet() {
    setSheetOpen(false);
    setEditingMode(null);
    form.reset({ name: '', code: '', description: '' });
    setServerErrors([]);
    router.replace('/appointment-masters/modes', { scroll: false });
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
        toast.success('Appointment Mode created.');
        closeSheet();
      } else {
        await updateMutation.mutateAsync({
          id: editingMode.id,
          request: {
            name: values.name,
            code: values.code,
            description: values.description || undefined,
          },
        });
        toast.success('Appointment Mode updated.');
        closeSheet();
      }
    } catch (error) {
      const errors = getApiErrors(error);
      setServerErrors(errors);
      toast.error(getApiErrorMessage(error));
    }
  });

  async function handleConfirmDelete() {
    if (!modePendingDelete) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(modePendingDelete.id);
      toast.success('Appointment Mode deleted.');

      if (editingMode?.id === modePendingDelete.id) {
        closeSheet();
      }

      setModePendingDelete(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
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
                placeholder="Search appointment modes..."
                aria-label="Search appointment modes"
              />
            </InputGroup>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end lg:ml-auto">
              <Button type="button" size="lg" onClick={openAddSheet}>
                <Plus className="size-4" />
                Add Appointment Mode
              </Button>
            </div>
          </CardContent>
        </Card>

        {modesQuery.isError ? (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Could not load Appointment Modes</AlertTitle>
            <AlertDescription>{getApiErrorMessage(modesQuery.error)}</AlertDescription>
          </Alert>
        ) : null}

        {modesQuery.isLoading ? (
          <ViewSkeleton layout={viewLayout} />
        ) : modes.length === 0 && !debouncedSearch ? (
          <Empty className="bg-card shadow-fluent-2 min-h-80 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ClipboardList />
              </EmptyMedia>
              <EmptyTitle>No Appointment Modes yet</EmptyTitle>
              <EmptyDescription>
                Create Appointment Modes to define delivery channels or formats for Appointments in
                this Tenant.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button type="button" onClick={openAddSheet}>
                <Plus className="size-4" />
                Add Appointment Mode
              </Button>
            </EmptyContent>
          </Empty>
        ) : modes.length === 0 && debouncedSearch ? (
          <Empty className="bg-card shadow-fluent-2 min-h-72 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Search />
              </EmptyMedia>
              <EmptyTitle>No results found</EmptyTitle>
              <EmptyDescription>
                No Appointment Modes match &ldquo;{debouncedSearch}&rdquo;. Try a different search
                term.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            {viewLayout === 'table' ? (
              <ModeTableView
                modes={modes}
                onEdit={openEditSheet}
                onDelete={setModePendingDelete}
              />
            ) : viewLayout === 'card' ? (
              <ModeCardView
                modes={modes}
                onEdit={openEditSheet}
                onDelete={setModePendingDelete}
              />
            ) : (
              <ModeListView
                modes={modes}
                onEdit={openEditSheet}
                onDelete={setModePendingDelete}
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

      <ModeFormSheet
        open={sheetOpen}
        onClose={closeSheet}
        isCreating={isCreating}
        editingName={editingMode?.name ?? null}
        form={form}
        serverErrors={serverErrors}
        isSaving={isSaving}
        onSave={() => void handleSave()}
      />

      <ModeDeleteDialog
        mode={modePendingDelete}
        isDeleting={deleteMutation.isPending}
        onCancel={() => setModePendingDelete(null)}
        onConfirm={() => void handleConfirmDelete()}
      />
    </>
  );
}
