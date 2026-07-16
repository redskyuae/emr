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
  FileText,
  LayoutGrid,
  LayoutList,
  Plus,
  Search,
  Table as TableIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import type { ClinicalNoteType } from '@/app/api/lib/modules/clinical-note-type/schemas/clinical-note-type-schema';
import { createClinicalNoteTypeSchema } from '@/app/api/lib/modules/clinical-note-type/schemas/clinical-note-type-schema';
import { getApiErrorMessage, getApiErrors } from '@/app/queries/api-error';
import { useClinicalNoteTypesQuery } from '@/app/queries/clinical-masters/note-types/useClinicalNoteTypes';
import { useCreateClinicalNoteType } from '@/app/queries/clinical-masters/note-types/useCreateClinicalNoteType';
import { useUpdateClinicalNoteType } from '@/app/queries/clinical-masters/note-types/useUpdateClinicalNoteType';
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
import { DeleteNoteTypeDialog } from './_modals/delete-note-type-dialog';
import { NoteTypeFormSheet, type NoteTypeFormValues } from './_sheets/note-type-form-sheet';
import { ViewSkeleton } from './note-type-skeletons';
import { NoteTypeCardView, NoteTypeListView, NoteTypeTableView } from './note-type-views';

type ViewLayout = 'table' | 'card' | 'list';

const PAGE_SIZE = 10;

export function NoteTypesPageImpl({ initialCreateOpen }: { initialCreateOpen: boolean }) {
  const router = useRouter();
  const initialCreateHandledRef = useRef(false);
  const [viewLayout, setViewLayout] = useState<ViewLayout>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch] = useDebouncedValue(searchTerm, { wait: 300 });
  const [page, setPage] = useState(1);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingNoteType, setEditingNoteType] = useState<ClinicalNoteType | null>(null);
  const [noteTypePendingDelete, setNoteTypePendingDelete] = useState<ClinicalNoteType | null>(null);
  const [serverErrors, setServerErrors] = useState<string[]>([]);

  const form = useForm<NoteTypeFormValues>({
    resolver: zodResolver(createClinicalNoteTypeSchema),
    defaultValues: { name: '', code: '', description: '' },
  });

  const noteTypesQuery = useClinicalNoteTypesQuery({
    query: debouncedSearch || undefined,
    page,
    limit: PAGE_SIZE,
  });

  const createMutation = useCreateClinicalNoteType();
  const updateMutation = useUpdateClinicalNoteType();

  const noteTypes = noteTypesQuery.data?.data ?? [];
  const meta = noteTypesQuery.data?.meta;
  const totalPages = meta?.totalPages ?? 0;
  const total = meta?.total ?? 0;
  const rangeStart = total > 0 ? (page - 1) * PAGE_SIZE + 1 : 0;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);
  const isCreating = !editingNoteType;
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
    setEditingNoteType(null);
    form.reset({ name: '', code: '', description: '' });
    setServerErrors([]);
    setSheetOpen(true);
  }

  function openEditSheet(noteType: ClinicalNoteType) {
    setEditingNoteType(noteType);
    form.reset({
      name: noteType.name,
      code: noteType.code,
      description: noteType.description ?? '',
    });
    setServerErrors([]);
    setSheetOpen(true);
  }

  function closeSheet() {
    setSheetOpen(false);
    setEditingNoteType(null);
    form.reset({ name: '', code: '', description: '' });
    setServerErrors([]);
    router.replace('/clinical-masters/note-types', { scroll: false });
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
        toast.success('Clinical Note Type created.');
        closeSheet();
      } else {
        await updateMutation.mutateAsync({
          id: editingNoteType.id,
          request: {
            name: values.name,
            code: values.code,
            description: values.description || undefined,
          },
        });
        toast.success('Clinical Note Type updated.');
        closeSheet();
      }
    } catch (error) {
      const errors = getApiErrors(error);
      setServerErrors(errors);
      toast.error(getApiErrorMessage(error));
    }
  });

  function handleNoteTypeDeleted(noteTypeId: number) {
    if (editingNoteType?.id === noteTypeId) {
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
                placeholder="Search clinical note types..."
                aria-label="Search clinical note types"
              />
            </InputGroup>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end lg:ml-auto">
              <Button type="button" size="lg" onClick={openAddSheet}>
                <Plus className="size-4" />
                Add Note Type
              </Button>
            </div>
          </CardContent>
        </Card>

        {noteTypesQuery.isError ? (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Could not load Clinical Note Types</AlertTitle>
            <AlertDescription>{getApiErrorMessage(noteTypesQuery.error)}</AlertDescription>
          </Alert>
        ) : null}

        {noteTypesQuery.isLoading ? (
          <ViewSkeleton layout={viewLayout} />
        ) : noteTypes.length === 0 && !debouncedSearch ? (
          <Empty className="bg-card shadow-fluent-2 min-h-80 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FileText />
              </EmptyMedia>
              <EmptyTitle>No Clinical Note Types yet</EmptyTitle>
              <EmptyDescription>
                Create Clinical Note Types to classify clinical notes in this Tenant.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button type="button" onClick={openAddSheet}>
                <Plus className="size-4" />
                Add Note Type
              </Button>
            </EmptyContent>
          </Empty>
        ) : noteTypes.length === 0 && debouncedSearch ? (
          <Empty className="bg-card shadow-fluent-2 min-h-72 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Search />
              </EmptyMedia>
              <EmptyTitle>No results found</EmptyTitle>
              <EmptyDescription>
                No Clinical Note Types match &ldquo;{debouncedSearch}&rdquo;. Try a different search
                term.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            {viewLayout === 'table' ? (
              <NoteTypeTableView
                noteTypes={noteTypes}
                onEdit={openEditSheet}
                onDelete={setNoteTypePendingDelete}
              />
            ) : viewLayout === 'card' ? (
              <NoteTypeCardView
                noteTypes={noteTypes}
                onEdit={openEditSheet}
                onDelete={setNoteTypePendingDelete}
              />
            ) : (
              <NoteTypeListView
                noteTypes={noteTypes}
                onEdit={openEditSheet}
                onDelete={setNoteTypePendingDelete}
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

      <NoteTypeFormSheet
        open={sheetOpen}
        onClose={closeSheet}
        isCreating={isCreating}
        editingName={editingNoteType?.name ?? null}
        form={form}
        serverErrors={serverErrors}
        isSaving={isSaving}
        onSave={() => void handleSave()}
      />

      <DeleteNoteTypeDialog
        noteType={noteTypePendingDelete}
        onClose={() => setNoteTypePendingDelete(null)}
        onDeleted={handleNoteTypeDeleted}
      />
    </>
  );
}
