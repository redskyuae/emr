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
  LayoutGrid,
  LayoutList,
  Plus,
  Search,
  ShieldAlert,
  Table as TableIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Allergen } from '@/app/api/lib/modules/allergen/schemas/allergen-schema';
import { createAllergenSchema } from '@/app/api/lib/modules/allergen/schemas/allergen-schema';
import { getApiErrorMessage, getApiErrors } from '@/app/queries/api-error';
import { useAllergensQuery } from '@/app/queries/clinical-masters/allergens/useAllergens';
import { useCreateAllergen } from '@/app/queries/clinical-masters/allergens/useCreateAllergen';
import { useUpdateAllergen } from '@/app/queries/clinical-masters/allergens/useUpdateAllergen';
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
import { DeleteAllergenDialog } from './_modals/delete-allergen-dialog';
import { AllergenFormSheet, type AllergenFormValues } from './_sheets/allergen-form-sheet';
import { ViewSkeleton } from './allergen-skeletons';
import { AllergenCardView, AllergenListView, AllergenTableView } from './allergen-views';

type ViewLayout = 'table' | 'card' | 'list';

const PAGE_SIZE = 10;

export function AllergensPageImpl({ initialCreateOpen }: { initialCreateOpen: boolean }) {
  const router = useRouter();
  const initialCreateHandledRef = useRef(false);
  const [viewLayout, setViewLayout] = useState<ViewLayout>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch] = useDebouncedValue(searchTerm, { wait: 300 });
  const [page, setPage] = useState(1);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingAllergen, setEditingAllergen] = useState<Allergen | null>(null);
  const [allergenPendingDelete, setAllergenPendingDelete] = useState<Allergen | null>(null);
  const [serverErrors, setServerErrors] = useState<string[]>([]);

  const form = useForm<AllergenFormValues>({
    resolver: zodResolver(createAllergenSchema),
    defaultValues: { name: '', code: '', category: 'drug' },
  });

  const allergensQuery = useAllergensQuery({
    query: debouncedSearch || undefined,
    page,
    limit: PAGE_SIZE,
  });

  const createMutation = useCreateAllergen();
  const updateMutation = useUpdateAllergen();

  const allergens = allergensQuery.data?.data ?? [];
  const meta = allergensQuery.data?.meta;
  const totalPages = meta?.totalPages ?? 0;
  const total = meta?.total ?? 0;
  const rangeStart = total > 0 ? (page - 1) * PAGE_SIZE + 1 : 0;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);
  const isCreating = !editingAllergen;
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
    setEditingAllergen(null);
    form.reset({ name: '', code: '', category: 'drug' });
    setServerErrors([]);
    setSheetOpen(true);
  }

  function openEditSheet(allergen: Allergen) {
    setEditingAllergen(allergen);
    form.reset({ name: allergen.name, code: allergen.code, category: allergen.category });
    setServerErrors([]);
    setSheetOpen(true);
  }

  function closeSheet() {
    setSheetOpen(false);
    setEditingAllergen(null);
    form.reset({ name: '', code: '', category: 'drug' });
    setServerErrors([]);
    router.replace('/clinical-masters/allergens', { scroll: false });
  }

  const handleSave = form.handleSubmit(async (values) => {
    setServerErrors([]);

    try {
      if (isCreating) {
        await createMutation.mutateAsync({
          name: values.name,
          code: values.code,
          category: values.category,
        });
        toast.success('Allergen created.');
        closeSheet();
      } else {
        await updateMutation.mutateAsync({
          id: editingAllergen.id,
          request: {
            name: values.name,
            code: values.code,
            category: values.category,
          },
        });
        toast.success('Allergen updated.');
        closeSheet();
      }
    } catch (error) {
      const errors = getApiErrors(error);
      setServerErrors(errors);
      toast.error(getApiErrorMessage(error));
    }
  });

  function handleAllergenDeleted(allergenId: number) {
    if (editingAllergen?.id === allergenId) {
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
                placeholder="Search allergens..."
                aria-label="Search allergens"
              />
            </InputGroup>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end lg:ml-auto">
              <Button type="button" size="lg" onClick={openAddSheet}>
                <Plus className="size-4" />
                Add Allergen
              </Button>
            </div>
          </CardContent>
        </Card>

        {allergensQuery.isError ? (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Could not load Allergens</AlertTitle>
            <AlertDescription>{getApiErrorMessage(allergensQuery.error)}</AlertDescription>
          </Alert>
        ) : null}

        {allergensQuery.isLoading ? (
          <ViewSkeleton layout={viewLayout} />
        ) : allergens.length === 0 && !debouncedSearch ? (
          <Empty className="bg-card shadow-fluent-2 min-h-80 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ShieldAlert />
              </EmptyMedia>
              <EmptyTitle>No Allergens yet</EmptyTitle>
              <EmptyDescription>
                Add Allergens to build this Tenant&apos;s allergen catalogue for Patient records.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button type="button" onClick={openAddSheet}>
                <Plus className="size-4" />
                Add Allergen
              </Button>
            </EmptyContent>
          </Empty>
        ) : allergens.length === 0 && debouncedSearch ? (
          <Empty className="bg-card shadow-fluent-2 min-h-72 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Search />
              </EmptyMedia>
              <EmptyTitle>No results found</EmptyTitle>
              <EmptyDescription>
                No Allergens match &ldquo;{debouncedSearch}&rdquo;. Try a different search term.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            {viewLayout === 'table' ? (
              <AllergenTableView
                allergens={allergens}
                onEdit={openEditSheet}
                onDelete={setAllergenPendingDelete}
              />
            ) : viewLayout === 'card' ? (
              <AllergenCardView
                allergens={allergens}
                onEdit={openEditSheet}
                onDelete={setAllergenPendingDelete}
              />
            ) : (
              <AllergenListView
                allergens={allergens}
                onEdit={openEditSheet}
                onDelete={setAllergenPendingDelete}
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

      <AllergenFormSheet
        open={sheetOpen}
        onClose={closeSheet}
        isCreating={isCreating}
        editingName={editingAllergen?.name ?? null}
        form={form}
        serverErrors={serverErrors}
        isSaving={isSaving}
        onSave={() => void handleSave()}
      />

      <DeleteAllergenDialog
        allergen={allergenPendingDelete}
        onClose={() => setAllergenPendingDelete(null)}
        onDeleted={handleAllergenDeleted}
      />
    </>
  );
}
