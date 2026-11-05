'use client';

import { useEffect, useState } from 'react';
import { useQueryState } from 'nuqs';
import { useDebouncedValue } from '@tanstack/react-pacer';
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

import type { AyurvedaDiagnosisCode } from '@/app/api/lib/modules/ayurveda-diagnosis-code/schemas/ayurveda-diagnosis-code-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useAyurvedaDiagnosisCodesQuery } from '@/app/queries/clinical-masters/ayurveda-diagnosis-codes/useAyurvedaDiagnosisCodes';
import { useSetAyurvedaDiagnosisCodeActive } from '@/app/queries/clinical-masters/ayurveda-diagnosis-codes/useSetAyurvedaDiagnosisCodeActive';
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
import { DeleteAyurvedaDiagnosisCodeDialog } from './_modals/delete-ayurveda-diagnosis-code-dialog';
import { AyurvedaDiagnosisCodeFormSheet } from './_sheets/ayurveda-diagnosis-code-form-sheet';
import { ViewSkeleton } from './ayurveda-diagnosis-code-skeletons';
import {
  AyurvedaDiagnosisCodeCardView,
  AyurvedaDiagnosisCodeListView,
  AyurvedaDiagnosisCodeTableView,
} from './ayurveda-diagnosis-code-views';

type ViewLayout = 'table' | 'card' | 'list';

const PAGE_SIZE = 10;

export function AyurvedaDiagnosisCodesPageImpl() {
  const [codeParam, setCodeParam] = useQueryState('code');
  const [viewLayout, setViewLayout] = useState<ViewLayout>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch] = useDebouncedValue(searchTerm, { wait: 300 });
  const [page, setPage] = useState(1);
  const [ayurvedaDiagnosisCodePendingDelete, setAyurvedaDiagnosisCodePendingDelete] =
    useState<AyurvedaDiagnosisCode | null>(null);

  const { data: canCreate, isLoading: canCreateLoading } = useHasPermission(
    'ayurveda-diagnosis-code:create'
  );
  const { data: canUpdate, isLoading: canUpdateLoading } = useHasPermission(
    'ayurveda-diagnosis-code:update'
  );
  const { data: canDelete } = useHasPermission('ayurveda-diagnosis-code:delete');

  const ayurvedaDiagnosisCodesQuery = useAyurvedaDiagnosisCodesQuery({
    query: debouncedSearch || undefined,
    page,
    limit: PAGE_SIZE,
  });
  const setActiveMutation = useSetAyurvedaDiagnosisCodeActive();

  const ayurvedaDiagnosisCodes = ayurvedaDiagnosisCodesQuery.data?.data ?? [];
  const meta = ayurvedaDiagnosisCodesQuery.data?.meta;
  const totalPages = meta?.totalPages ?? 0;
  const total = meta?.total ?? 0;
  const rangeStart = total > 0 ? (page - 1) * PAGE_SIZE + 1 : 0;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);

  // The sheet opens straight from the URL: ?code=new creates, ?code=<id> edits once the row
  // resolves from already-loaded query data.
  const isCreating = codeParam === 'new' && Boolean(canCreate);
  const editingId = codeParam !== null && /^\d+$/.test(codeParam) ? Number(codeParam) : null;
  const editingCode =
    editingId !== null
      ? (ayurvedaDiagnosisCodes.find((row) => row.id === editingId) ?? null)
      : null;
  const sheetOpen = isCreating || (Boolean(canUpdate) && editingCode !== null);

  const accessDenied =
    (codeParam === 'new' && !canCreateLoading && !canCreate) ||
    (editingId !== null && !canUpdateLoading && !canUpdate);

  useEffect(() => {
    if (accessDenied) {
      void setCodeParam(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessDenied]);

  function closeSheet() {
    void setCodeParam(null);
  }

  async function handleToggleActive(ayurvedaDiagnosisCode: AyurvedaDiagnosisCode) {
    const isActive = !ayurvedaDiagnosisCode.isActive;

    try {
      await setActiveMutation.mutateAsync({ id: ayurvedaDiagnosisCode.id, isActive });
      toast.success(`Ayurveda Diagnosis Code ${isActive ? 'activated' : 'deactivated'}.`);
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
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setPage(1);
                }}
                placeholder="Search Ayurveda diagnosis codes..."
                aria-label="Search Ayurveda diagnosis codes"
              />
            </InputGroup>

            {canCreate ? (
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end lg:ml-auto">
                <Button type="button" size="lg" onClick={() => void setCodeParam('new')}>
                  <Plus className="size-4" />
                  Add Ayurveda Diagnosis Code
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {ayurvedaDiagnosisCodesQuery.isError ? (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Could not load Ayurveda Diagnosis Codes</AlertTitle>
            <AlertDescription>
              {getApiErrorMessage(ayurvedaDiagnosisCodesQuery.error)}
            </AlertDescription>
          </Alert>
        ) : null}

        {ayurvedaDiagnosisCodesQuery.isLoading ? (
          <ViewSkeleton layout={viewLayout} />
        ) : ayurvedaDiagnosisCodes.length === 0 && !debouncedSearch ? (
          <Empty className="bg-card shadow-fluent-2 min-h-80 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Stethoscope />
              </EmptyMedia>
              <EmptyTitle>No Ayurveda Diagnosis Codes yet</EmptyTitle>
              <EmptyDescription>
                Add Ayurveda Diagnosis Codes to build this Tenant&apos;s Ayurveda diagnosis
                catalogue.
              </EmptyDescription>
            </EmptyHeader>
            {canCreate ? (
              <EmptyContent>
                <Button type="button" onClick={() => void setCodeParam('new')}>
                  <Plus className="size-4" />
                  Add Ayurveda Diagnosis Code
                </Button>
              </EmptyContent>
            ) : null}
          </Empty>
        ) : ayurvedaDiagnosisCodes.length === 0 && debouncedSearch ? (
          <Empty className="bg-card shadow-fluent-2 min-h-72 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Search />
              </EmptyMedia>
              <EmptyTitle>No results found</EmptyTitle>
              <EmptyDescription>
                No Ayurveda Diagnosis Codes match &ldquo;{debouncedSearch}&rdquo;. Try a different
                search term.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            {viewLayout === 'table' ? (
              <AyurvedaDiagnosisCodeTableView
                ayurvedaDiagnosisCodes={ayurvedaDiagnosisCodes}
                canEdit={canUpdate}
                canDelete={canDelete}
                onEdit={(row) => void setCodeParam(String(row.id))}
                onDelete={setAyurvedaDiagnosisCodePendingDelete}
                onToggleActive={(ayurvedaDiagnosisCode) =>
                  void handleToggleActive(ayurvedaDiagnosisCode)
                }
              />
            ) : viewLayout === 'card' ? (
              <AyurvedaDiagnosisCodeCardView
                ayurvedaDiagnosisCodes={ayurvedaDiagnosisCodes}
                canEdit={canUpdate}
                canDelete={canDelete}
                onEdit={(row) => void setCodeParam(String(row.id))}
                onDelete={setAyurvedaDiagnosisCodePendingDelete}
                onToggleActive={(ayurvedaDiagnosisCode) =>
                  void handleToggleActive(ayurvedaDiagnosisCode)
                }
              />
            ) : (
              <AyurvedaDiagnosisCodeListView
                ayurvedaDiagnosisCodes={ayurvedaDiagnosisCodes}
                canEdit={canUpdate}
                canDelete={canDelete}
                onEdit={(row) => void setCodeParam(String(row.id))}
                onDelete={setAyurvedaDiagnosisCodePendingDelete}
                onToggleActive={(ayurvedaDiagnosisCode) =>
                  void handleToggleActive(ayurvedaDiagnosisCode)
                }
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

      <AyurvedaDiagnosisCodeFormSheet
        open={sheetOpen}
        ayurvedaDiagnosisCode={editingCode}
        onClose={closeSheet}
      />

      <DeleteAyurvedaDiagnosisCodeDialog
        ayurvedaDiagnosisCode={ayurvedaDiagnosisCodePendingDelete}
        onClose={() => setAyurvedaDiagnosisCodePendingDelete(null)}
        onDeleted={(id) => {
          if (editingId === id) {
            closeSheet();
          }
        }}
      />
    </>
  );
}
