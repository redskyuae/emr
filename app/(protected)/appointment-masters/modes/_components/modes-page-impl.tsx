'use client';

import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AlertCircle, ChevronLeft, ChevronRight, ClipboardList, LayoutGrid, LayoutList, MoreVertical, Pencil, Plus, Save, Search, Table as TableIcon, Trash2, } from 'lucide-react';
import { toast } from 'sonner';
import type { AppointmentMode } from '@/app/api/lib/modules/appointment-mode/schemas/appointment-mode-schema';
import { getApiErrorMessage, getApiErrors } from '@/app/queries/api-error';
import { useAppointmentModesQuery } from '@/app/queries/appointment-masters/useAppointmentModes';
import { useCreateAppointmentMode } from '@/app/queries/appointment-masters/useCreateAppointmentMode';
import { useDeleteAppointmentMode } from '@/app/queries/appointment-masters/useDeleteAppointmentMode';
import { useUpdateAppointmentMode } from '@/app/queries/appointment-masters/useUpdateAppointmentMode';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogMedia, AlertDialogTitle, } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, } from '@/components/ui/dropdown-menu';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle, } from '@/components/ui/empty';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, } from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

type ViewLayout = 'table' | 'card' | 'list';

const PAGE_SIZE = 10;

function TableSkeleton() {
  return (
    <Card className="shadow-fluent-2">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="pr-4 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }, (_, i) => (
                <TableRow key={i}>
                  <TableCell className="pl-4">
                    <Skeleton className="h-5 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-48" />
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    <Skeleton className="ml-auto h-8 w-8" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function CardViewSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }, (_, i) => (
        <Card key={i} className="shadow-fluent-2">
          <CardContent className="space-y-3 p-4">
            <Skeleton className="size-10 rounded-full" />
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-full" />
            <div className="flex gap-2 pt-1">
              <Skeleton className="h-8 w-14" />
              <Skeleton className="h-8 w-16" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ListViewSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }, (_, i) => (
        <Card key={i} className="shadow-fluent-2">
          <CardContent className="flex items-center gap-4 p-4">
            <Skeleton className="size-10 shrink-0 rounded-full" />
            <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:gap-6">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-8 w-8 shrink-0" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ViewSkeleton({ layout }: { layout: ViewLayout }) {
  if (layout === 'card') return <CardViewSkeleton />;
  if (layout === 'list') return <ListViewSkeleton />;
  return <TableSkeleton />;
}

function ModeIcon() {
  return (
    <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-full">
      <ClipboardList className="size-5" />
    </div>
  );
}

function ModeActionsMenu({
  mode,
  onEdit,
  onDelete,
}: {
  mode: AppointmentMode;
  onEdit: (mode: AppointmentMode) => void;
  onDelete: (mode: AppointmentMode) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Actions for ${mode.name}`}
        >
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={() => onEdit(mode)}>
          <Pencil className="size-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          onClick={() => onDelete(mode)}
        >
          <Trash2 className="size-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ModeTableView({
  modes,
  onEdit,
  onDelete,
}: {
  modes: AppointmentMode[];
  onEdit: (mode: AppointmentMode) => void;
  onDelete: (mode: AppointmentMode) => void;
}) {
  return (
    <Card className="shadow-fluent-2">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table className="min-w-[600px]">
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="pr-4 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {modes.map((mode) => (
                <TableRow key={mode.id}>
                  <TableCell className="pl-4 font-medium">{mode.name}</TableCell>
                  <TableCell className="font-mono text-xs">{mode.code}</TableCell>
                  <TableCell className="text-muted-foreground max-w-xs truncate">
                    {mode.description || '—'}
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    <ModeActionsMenu mode={mode} onEdit={onEdit} onDelete={onDelete} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function ModeCardView({
  modes,
  onEdit,
  onDelete,
}: {
  modes: AppointmentMode[];
  onEdit: (mode: AppointmentMode) => void;
  onDelete: (mode: AppointmentMode) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {modes.map((mode) => (
        <Card key={mode.id} className="shadow-fluent-2">
          <CardContent className="space-y-3 p-4">
            <ModeIcon />

            <div>
              <h3 className="font-heading text-base font-semibold">{mode.name}</h3>
              <p className="text-muted-foreground mt-0.5 text-sm">
                Appointment Mode Code:{' '}
                <span className="font-mono">{mode.code}</span>
              </p>
              <p className="text-muted-foreground mt-0.5 text-sm">
                Appointment Mode Description:{' '}
                <span>{mode.description || '—'}</span>
              </p>
            </div>

            <div className="flex gap-2 border-t pt-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onEdit(mode)}
              >
                <Pencil className="size-3.5" />
                Edit
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onDelete(mode)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="size-3.5" />
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ModeListView({
  modes,
  onEdit,
  onDelete,
}: {
  modes: AppointmentMode[];
  onEdit: (mode: AppointmentMode) => void;
  onDelete: (mode: AppointmentMode) => void;
}) {
  return (
    <div className="space-y-3">
      {modes.map((mode) => (
        <Card key={mode.id} className="shadow-fluent-2">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <ModeIcon />
              <div className="min-w-0">
                <h3 className="font-heading text-base font-semibold">{mode.name}</h3>
              </div>
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-1 pl-13 text-sm sm:flex-row sm:items-center sm:gap-6 sm:pl-0">
              <div>
                <span className="text-muted-foreground">Appointment Mode Code: </span>
                <span className="font-mono">{mode.code}</span>
              </div>
              <div className="min-w-0">
                <span className="text-muted-foreground">Appointment Mode Description: </span>
                <span className="truncate">{mode.description || '—'}</span>
              </div>
            </div>

            <div className="shrink-0 pl-13 sm:pl-0">
              <ModeActionsMenu mode={mode} onEdit={onEdit} onDelete={onDelete} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function ModesPageImpl() {
  const queryClient = useQueryClient();

  const [viewLayout, setViewLayout] = useState<ViewLayout>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingMode, setEditingMode] = useState<AppointmentMode | null>(null);
  const [modePendingDelete, setModePendingDelete] = useState<AppointmentMode | null>(null);

  const [draftName, setDraftName] = useState('');
  const [draftCode, setDraftCode] = useState('');
  const [draftDescription, setDraftDescription] = useState('');
  const [formErrors, setFormErrors] = useState<string[]>([]);

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
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  function resetDraft() {
    setDraftName('');
    setDraftCode('');
    setDraftDescription('');
    setFormErrors([]);
  }

  function openAddSheet() {
    resetDraft();
    setEditingMode(null);
    setSheetOpen(true);
  }

  function openEditSheet(mode: AppointmentMode) {
    setEditingMode(mode);
    setDraftName(mode.name);
    setDraftCode(mode.code);
    setDraftDescription(mode.description ?? '');
    setFormErrors([]);
    setSheetOpen(true);
  }

  function closeSheet() {
    setSheetOpen(false);
    setEditingMode(null);
    resetDraft();
  }

  async function invalidateModes() {
    await queryClient.invalidateQueries({
      queryKey: ['appointment-modes'],
    });
  }

  async function handleSave() {
    setFormErrors([]);

    const name = draftName.trim();
    const code = draftCode.trim().toUpperCase();
    const description = draftDescription.trim() || undefined;

    try {
      if (isCreating) {
        await createMutation.mutateAsync({ name, code, description });
        await invalidateModes();
        toast.success('Appointment Mode created.');
        closeSheet();
      } else {
        await updateMutation.mutateAsync({
          id: editingMode.id,
          request: { name, code, description },
        });
        await invalidateModes();
        toast.success('Appointment Mode updated.');
        closeSheet();
      }
    } catch (error) {
      const errors = getApiErrors(error);
      setFormErrors(errors);
      toast.error(getApiErrorMessage(error));
    }
  }

  async function handleConfirmDelete() {
    if (!modePendingDelete) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(modePendingDelete.id);
      await invalidateModes();
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

      <Sheet open={sheetOpen} onOpenChange={(open) => (!open ? closeSheet() : undefined)}>
        <SheetContent
          side="right"
          className="shadow-fluent-64 w-full gap-0 p-0 data-[side=right]:w-full sm:max-w-lg"
          style={{ width: 'min(512px, 100vw)', maxWidth: '100vw' }}
        >
          <SheetHeader className="border-b p-4 pr-12">
            <SheetTitle className="text-xl">
              {isCreating ? 'Add Appointment Mode' : `Edit ${editingMode?.name ?? 'Mode'}`}
            </SheetTitle>
            <SheetDescription>
              {isCreating
                ? 'Create a new delivery channel or format for Appointments.'
                : 'Update the Appointment Mode details.'}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-4">
            {formErrors.length > 0 ? (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="size-4" />
                <AlertTitle>Save failed</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc space-y-1 pl-4">
                    {formErrors.map((error) => (
                      <li key={error}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            ) : null}

            <FieldGroup className="gap-4">
              <Field>
                <FieldLabel htmlFor="mode-name">Name</FieldLabel>
                <Input
                  id="mode-name"
                  value={draftName}
                  onChange={(event) => setDraftName(event.target.value)}
                  disabled={isSaving}
                  maxLength={100}
                  placeholder="e.g. In-Person"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="mode-code">Code</FieldLabel>
                <Input
                  id="mode-code"
                  value={draftCode}
                  onChange={(event) => setDraftCode(event.target.value.toUpperCase())}
                  disabled={isSaving}
                  maxLength={10}
                  placeholder="e.g. IN_PERSON"
                  className="font-mono"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="mode-description">Description</FieldLabel>
                <Textarea
                  id="mode-description"
                  value={draftDescription}
                  onChange={(event) => setDraftDescription(event.target.value)}
                  disabled={isSaving}
                  rows={3}
                  placeholder="Optional description"
                />
              </Field>
            </FieldGroup>
          </div>

          <SheetFooter className="bg-background flex-row justify-end border-t p-4">
            <Button type="button" variant="outline" onClick={closeSheet} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void handleSave()}
              disabled={isSaving || !draftName.trim() || !draftCode.trim()}
              aria-busy={isSaving}
            >
              <Save className="size-4" />
              Save
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={modePendingDelete !== null}
        onOpenChange={(open) => (!open ? setModePendingDelete(null) : undefined)}
      >
        <AlertDialogContent className="shadow-fluent-64">
          <AlertDialogHeader>
            <AlertDialogMedia className="text-destructive">
              <Trash2 />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete Appointment Mode?</AlertDialogTitle>
            <AlertDialogDescription>
              {modePendingDelete ? (
                <>
                  Delete Appointment Mode &ldquo;
                  <strong>{modePendingDelete.name}</strong>&rdquo;? This action cannot be undone.
                </>
              ) : (
                'This Appointment Mode will be deleted.'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={(event) => {
                event.preventDefault();
                void handleConfirmDelete();
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
