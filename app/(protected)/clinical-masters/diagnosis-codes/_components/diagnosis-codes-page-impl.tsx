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
  Stethoscope,
  Table as TableIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import type { DiagnosisCode } from '@/app/api/lib/modules/diagnosis-code/schemas/diagnosis-code-schema';
import { createDiagnosisCodeSchema } from '@/app/api/lib/modules/diagnosis-code/schemas/diagnosis-code-schema';
import { getApiErrorMessage, getApiErrors } from '@/app/queries/api-error';
import { useDiagnosisCodesQuery } from '@/app/queries/clinical-masters/diagnosis-codes/useDiagnosisCodes';
import { useCreateDiagnosisCode } from '@/app/queries/clinical-masters/diagnosis-codes/useCreateDiagnosisCode';
import { useUpdateDiagnosisCode } from '@/app/queries/clinical-masters/diagnosis-codes/useUpdateDiagnosisCode';
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
import { DeleteDiagnosisCodeDialog } from './_modals/delete-diagnosis-code-dialog';
import {
  DiagnosisCodeFormSheet,
  type DiagnosisCodeFormValues,
} from './_sheets/diagnosis-code-form-sheet';
import { ViewSkeleton } from './diagnosis-code-skeletons';
import {
  DiagnosisCodeCardView,
  DiagnosisCodeListView,
  DiagnosisCodeTableView,
} from './diagnosis-code-views';

type ViewLayout = 'table' | 'card' | 'list';

const PAGE_SIZE = 10;

export function DiagnosisCodesPageImpl({ initialCreateOpen }: { initialCreateOpen: boolean }) {
  const router = useRouter();
  const initialCreateHandledRef = useRef(false);
  const [viewLayout, setViewLayout] = useState<ViewLayout>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch] = useDebouncedValue(searchTerm, { wait: 300 });
  const [page, setPage] = useState(1);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingDiagnosisCode, setEditingDiagnosisCode] = useState<DiagnosisCode | null>(null);
  const [diagnosisCodePendingDelete, setDiagnosisCodePendingDelete] =
    useState<DiagnosisCode | null>(null);
  const [serverErrors, setServerErrors] = useState<string[]>([]);

  const form = useForm<DiagnosisCodeFormValues>({
    resolver: zodResolver(createDiagnosisCodeSchema),
    defaultValues: { code: '', title: '', category: '' },
  });

  const diagnosisCodesQuery = useDiagnosisCodesQuery({
    query: debouncedSearch || undefined,
    page,
    limit: PAGE_SIZE,
  });

  const createMutation = useCreateDiagnosisCode();
  const updateMutation = useUpdateDiagnosisCode();

  const { data: canCreate } = useHasPermission('diagnosis-code:create');
  const { data: canUpdate } = useHasPermission('diagnosis-code:update');
  const { data: canDelete } = useHasPermission('diagnosis-code:delete');

  const diagnosisCodes = diagnosisCodesQuery.data?.data ?? [];
  const meta = diagnosisCodesQuery.data?.meta;
  const totalPages = meta?.totalPages ?? 0;
  const total = meta?.total ?? 0;
  const rangeStart = total > 0 ? (page - 1) * PAGE_SIZE + 1 : 0;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);
  const isCreating = !editingDiagnosisCode;
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
    setEditingDiagnosisCode(null);
    form.reset({ code: '', title: '', category: '' });
    setServerErrors([]);
    setSheetOpen(true);
  }

  function openEditSheet(diagnosisCode: DiagnosisCode) {
    setEditingDiagnosisCode(diagnosisCode);
    form.reset({
      code: diagnosisCode.code,
      title: diagnosisCode.title,
      category: diagnosisCode.category ?? '',
    });
    setServerErrors([]);
    setSheetOpen(true);
  }

  function closeSheet() {
    setSheetOpen(false);
    setEditingDiagnosisCode(null);
    form.reset({ code: '', title: '', category: '' });
    setServerErrors([]);
    router.replace('/clinical-masters/diagnosis-codes', { scroll: false });
  }

  const handleSave = form.handleSubmit(async (values) => {
    setServerErrors([]);

    try {
      if (isCreating) {
        await createMutation.mutateAsync({
          code: values.code,
          title: values.title,
          category: values.category || undefined,
        });
        toast.success('Diagnosis Code created.');
        closeSheet();
      } else {
        await updateMutation.mutateAsync({
          id: editingDiagnosisCode.id,
          request: {
            code: values.code,
            title: values.title,
            category: values.category || undefined,
          },
        });
        toast.success('Diagnosis Code updated.');
        closeSheet();
      }
    } catch (error) {
      const errors = getApiErrors(error);
      setServerErrors(errors);
      toast.error(getApiErrorMessage(error));
    }
  });

  function handleDiagnosisCodeDeleted(diagnosisCodeId: number) {
    if (editingDiagnosisCode?.id === diagnosisCodeId) {
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
                placeholder="Search diagnosis codes..."
                aria-label="Search diagnosis codes"
              />
            </InputGroup>

            {canCreate ? (
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end lg:ml-auto">
                <Button type="button" size="lg" onClick={openAddSheet}>
                  <Plus className="size-4" />
                  Add Diagnosis Code
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {diagnosisCodesQuery.isError ? (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Could not load Diagnosis Codes</AlertTitle>
            <AlertDescription>{getApiErrorMessage(diagnosisCodesQuery.error)}</AlertDescription>
          </Alert>
        ) : null}

        {diagnosisCodesQuery.isLoading ? (
          <ViewSkeleton layout={viewLayout} />
        ) : diagnosisCodes.length === 0 && !debouncedSearch ? (
          <Empty className="bg-card shadow-fluent-2 min-h-80 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Stethoscope />
              </EmptyMedia>
              <EmptyTitle>No Diagnosis Codes yet</EmptyTitle>
              <EmptyDescription>
                Add ICD-10 Diagnosis Codes to build this Tenant&apos;s diagnosis catalogue.
              </EmptyDescription>
            </EmptyHeader>
            {canCreate ? (
              <EmptyContent>
                <Button type="button" onClick={openAddSheet}>
                  <Plus className="size-4" />
                  Add Diagnosis Code
                </Button>
              </EmptyContent>
            ) : null}
          </Empty>
        ) : diagnosisCodes.length === 0 && debouncedSearch ? (
          <Empty className="bg-card shadow-fluent-2 min-h-72 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Search />
              </EmptyMedia>
              <EmptyTitle>No results found</EmptyTitle>
              <EmptyDescription>
                No Diagnosis Codes match &ldquo;{debouncedSearch}&rdquo;. Try a different search
                term.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            {viewLayout === 'table' ? (
              <DiagnosisCodeTableView
                diagnosisCodes={diagnosisCodes}
                canEdit={canUpdate}
                canDelete={canDelete}
                onEdit={openEditSheet}
                onDelete={setDiagnosisCodePendingDelete}
              />
            ) : viewLayout === 'card' ? (
              <DiagnosisCodeCardView
                diagnosisCodes={diagnosisCodes}
                canEdit={canUpdate}
                canDelete={canDelete}
                onEdit={openEditSheet}
                onDelete={setDiagnosisCodePendingDelete}
              />
            ) : (
              <DiagnosisCodeListView
                diagnosisCodes={diagnosisCodes}
                canEdit={canUpdate}
                canDelete={canDelete}
                onEdit={openEditSheet}
                onDelete={setDiagnosisCodePendingDelete}
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

      <DiagnosisCodeFormSheet
        open={sheetOpen}
        onClose={closeSheet}
        isCreating={isCreating}
        editingCode={editingDiagnosisCode?.code ?? null}
        form={form}
        serverErrors={serverErrors}
        isSaving={isSaving}
        onSave={() => void handleSave()}
      />

      <DeleteDiagnosisCodeDialog
        diagnosisCode={diagnosisCodePendingDelete}
        onClose={() => setDiagnosisCodePendingDelete(null)}
        onDeleted={handleDiagnosisCodeDeleted}
      />
    </>
  );
}
