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
import type { AppointmentType } from '@/app/api/lib/modules/appointment-type/schemas/appointment-type-schema';
import { createAppointmentTypeSchema } from '@/app/api/lib/modules/appointment-type/schemas/appointment-type-schema';
import { getApiErrorMessage, getApiErrors } from '@/app/queries/api-error';
import { useAppointmentTypesQuery } from '@/app/queries/appointment-masters/types/useAppointmentTypes';
import { useCreateAppointmentType } from '@/app/queries/appointment-masters/types/useCreateAppointmentType';
import { useDeleteAppointmentType } from '@/app/queries/appointment-masters/types/useDeleteAppointmentType';
import { useUpdateAppointmentType } from '@/app/queries/appointment-masters/types/useUpdateAppointmentType';
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
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { TypeDeleteDialog } from './_modals/delete-type-dialog';
import { TypeFormSheet, type TypeFormValues } from './_sheets/type-form-sheet';
import { ViewSkeleton } from './type-skeletons';
import { TypeCardView, TypeListView, TypeTableView } from './type-views';

type ViewLayout = 'table' | 'card' | 'list';

const PAGE_SIZE = 10;

export function TypesPageImpl({ initialCreateOpen }: { initialCreateOpen: boolean }) {
  const router = useRouter();
  const initialCreateHandledRef = useRef(false);
  const [viewLayout, setViewLayout] = useState<ViewLayout>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch] = useDebouncedValue(searchTerm, { wait: 300 });
  const [page, setPage] = useState(1);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingType, setEditingType] = useState<AppointmentType | null>(null);
  const [typePendingDelete, setTypePendingDelete] = useState<AppointmentType | null>(null);
  const [serverErrors, setServerErrors] = useState<string[]>([]);

  const form = useForm<TypeFormValues>({
    resolver: zodResolver(createAppointmentTypeSchema),
    defaultValues: { name: '', code: '', description: '' },
  });

  const typesQuery = useAppointmentTypesQuery({
    query: debouncedSearch || undefined,
    page,
    limit: PAGE_SIZE,
  });

  const createMutation = useCreateAppointmentType();
  const updateMutation = useUpdateAppointmentType();
  const deleteMutation = useDeleteAppointmentType();

  const { data: canCreate } = useHasPermission('appointment-type:create');
  const { data: canUpdate } = useHasPermission('appointment-type:update');
  const { data: canDelete } = useHasPermission('appointment-type:delete');

  const types = typesQuery.data?.data ?? [];
  const meta = typesQuery.data?.meta;
  const totalPages = meta?.totalPages ?? 0;
  const total = meta?.total ?? 0;
  const rangeStart = total > 0 ? (page - 1) * PAGE_SIZE + 1 : 0;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);
  const isCreating = !editingType;
  const isSaving = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (!initialCreateOpen || initialCreateHandledRef.current || !canCreate) {
      return;
    }

    initialCreateHandledRef.current = true;
    openAddSheet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCreateOpen, canCreate]);

  const previousDebouncedRef = useRef(debouncedSearch);
  if (previousDebouncedRef.current !== debouncedSearch) {
    previousDebouncedRef.current = debouncedSearch;
    if (page !== 1) {
      setPage(1);
    }
  }

  function openAddSheet() {
    setEditingType(null);
    form.reset({ name: '', code: '', description: '' });
    setServerErrors([]);
    setSheetOpen(true);
  }

  function openEditSheet(type: AppointmentType) {
    setEditingType(type);
    form.reset({ name: type.name, code: type.code, description: type.description ?? '' });
    setServerErrors([]);
    setSheetOpen(true);
  }

  function closeSheet() {
    setSheetOpen(false);
    setEditingType(null);
    form.reset({ name: '', code: '', description: '' });
    setServerErrors([]);
    router.replace('/appointment-masters/types', { scroll: false });
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
        toast.success('Appointment Type created.');
        closeSheet();
      } else {
        await updateMutation.mutateAsync({
          id: editingType.id,
          request: {
            name: values.name,
            code: values.code,
            description: values.description || undefined,
          },
        });
        toast.success('Appointment Type updated.');
        closeSheet();
      }
    } catch (error) {
      const errors = getApiErrors(error);
      setServerErrors(errors);
      toast.error(getApiErrorMessage(error));
    }
  });

  async function handleConfirmDelete() {
    if (!typePendingDelete) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(typePendingDelete.id);
      toast.success('Appointment Type deleted.');

      if (editingType?.id === typePendingDelete.id) {
        closeSheet();
      }

      setTypePendingDelete(null);
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
                placeholder="Search appointment types..."
                aria-label="Search appointment types"
              />
            </InputGroup>

            {canCreate ? (
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end lg:ml-auto">
                <Button type="button" size="lg" onClick={openAddSheet}>
                  <Plus className="size-4" />
                  Add Appointment Type
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {typesQuery.isError ? (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Could not load Appointment Types</AlertTitle>
            <AlertDescription>{getApiErrorMessage(typesQuery.error)}</AlertDescription>
          </Alert>
        ) : null}

        {typesQuery.isLoading ? (
          <ViewSkeleton layout={viewLayout} />
        ) : types.length === 0 && !debouncedSearch ? (
          <Empty className="bg-card shadow-fluent-2 min-h-80 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ClipboardList />
              </EmptyMedia>
              <EmptyTitle>No Appointment Types yet</EmptyTitle>
              <EmptyDescription>
                Create Appointment Types to define clinical categories or visit types for
                Appointments in this Tenant.
              </EmptyDescription>
            </EmptyHeader>
            {canCreate ? (
              <EmptyContent>
                <Button type="button" onClick={openAddSheet}>
                  <Plus className="size-4" />
                  Add Appointment Type
                </Button>
              </EmptyContent>
            ) : null}
          </Empty>
        ) : types.length === 0 && debouncedSearch ? (
          <Empty className="bg-card shadow-fluent-2 min-h-72 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Search />
              </EmptyMedia>
              <EmptyTitle>No results found</EmptyTitle>
              <EmptyDescription>
                No Appointment Types match &ldquo;{debouncedSearch}&rdquo;. Try a different search
                term.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            {viewLayout === 'table' ? (
              <TypeTableView
                types={types}
                canEdit={canUpdate}
                canDelete={canDelete}
                onEdit={openEditSheet}
                onDelete={setTypePendingDelete}
              />
            ) : viewLayout === 'card' ? (
              <TypeCardView
                types={types}
                canEdit={canUpdate}
                canDelete={canDelete}
                onEdit={openEditSheet}
                onDelete={setTypePendingDelete}
              />
            ) : (
              <TypeListView
                types={types}
                canEdit={canUpdate}
                canDelete={canDelete}
                onEdit={openEditSheet}
                onDelete={setTypePendingDelete}
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

      <TypeFormSheet
        open={sheetOpen}
        onClose={closeSheet}
        isCreating={isCreating}
        editingName={editingType?.name ?? null}
        form={form}
        serverErrors={serverErrors}
        isSaving={isSaving}
        onSave={() => void handleSave()}
      />

      <TypeDeleteDialog
        type={typePendingDelete}
        isDeleting={deleteMutation.isPending}
        onCancel={() => setTypePendingDelete(null)}
        onConfirm={() => void handleConfirmDelete()}
      />
    </>
  );
}
