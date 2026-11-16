'use client';

import { useState } from 'react';
import { useQueryState } from 'nuqs';
import { useDebouncedValue } from '@tanstack/react-pacer';
import { AlertCircle, ChevronLeft, ChevronRight, Leaf, Plus, Search } from 'lucide-react';

import type { AyurvedaDiagnosisCode } from '@/app/api/lib/modules/ayurveda-diagnosis-code/schemas/ayurveda-diagnosis-code-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useAyurvedaDiagnosisCodesQuery } from '@/app/queries/clinical-masters/ayurveda-diagnosis-codes/useAyurvedaDiagnosisCodes';
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
import { DeleteAyurvedaDiagnosisCodeDialog } from './_modals/delete-ayurveda-diagnosis-code-dialog';
import { AyurvedaDiagnosisCodeFormSheet } from './_sheets/ayurveda-diagnosis-code-form-sheet';
import {
  AyurvedaDiagnosisCodeTable,
  AyurvedaDiagnosisCodeTableSkeleton,
} from './ayurveda-diagnosis-code-table';

const PAGE_SIZE = 10;

export function AyurvedaDiagnosisCodesPageImpl() {
  const [ayurvedaCodeParam, setAyurvedaCodeParam] = useQueryState('ayurvedaCode');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch] = useDebouncedValue(searchTerm, { wait: 300 });
  const [page, setPage] = useState(1);
  const [codePendingDelete, setCodePendingDelete] = useState<AyurvedaDiagnosisCode | null>(null);

  const ayurvedaDiagnosisCodesQuery = useAyurvedaDiagnosisCodesQuery({
    query: debouncedSearch || undefined,
    page,
    limit: PAGE_SIZE,
  });

  const ayurvedaDiagnosisCodes = ayurvedaDiagnosisCodesQuery.data?.data ?? [];
  const meta = ayurvedaDiagnosisCodesQuery.data?.meta;
  const total = meta?.total ?? 0;
  const totalPages = meta?.totalPages ?? 0;
  const rangeStart = total > 0 ? (page - 1) * PAGE_SIZE + 1 : 0;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);

  const { data: canCreate } = useHasPermission('ayurveda-diagnosis-code:create');
  const { data: canUpdate } = useHasPermission('ayurveda-diagnosis-code:update');
  const { data: canDelete } = useHasPermission('ayurveda-diagnosis-code:delete');

  const isCreating = ayurvedaCodeParam === 'new' && canCreate;
  const editingId =
    ayurvedaCodeParam !== null && ayurvedaCodeParam !== 'new' && /^\d+$/.test(ayurvedaCodeParam)
      ? Number(ayurvedaCodeParam)
      : null;
  const editingCode =
    editingId !== null
      ? (ayurvedaDiagnosisCodes.find((row) => row.id === editingId) ?? null)
      : null;
  const sheetOpen = isCreating || (editingId !== null && canUpdate && editingCode !== null);

  function openCreateSheet() {
    void setAyurvedaCodeParam('new');
  }

  function closeSheet() {
    void setAyurvedaCodeParam(null);
  }

  return (
    <>
      <div className="space-y-4">
        <Card className="shadow-fluent-2">
          <CardContent className="flex flex-col gap-3 p-3 lg:flex-row lg:items-center">
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
                placeholder="Search by code, name or English name..."
                aria-label="Search Ayurveda Diagnosis Codes"
              />
            </InputGroup>

            {canCreate ? (
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end lg:ml-auto">
                <Button type="button" onClick={openCreateSheet}>
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
            <AlertDescription className="flex flex-col items-start gap-2">
              <span>{getApiErrorMessage(ayurvedaDiagnosisCodesQuery.error)}</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void ayurvedaDiagnosisCodesQuery.refetch()}
              >
                Try again
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}

        {ayurvedaDiagnosisCodesQuery.isLoading ? (
          <AyurvedaDiagnosisCodeTableSkeleton />
        ) : ayurvedaDiagnosisCodesQuery.isError ? null : ayurvedaDiagnosisCodes.length === 0 &&
          !debouncedSearch ? (
          <Empty className="bg-card shadow-fluent-2 min-h-80 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Leaf />
              </EmptyMedia>
              <EmptyTitle>No Ayurveda Diagnosis Codes yet</EmptyTitle>
              <EmptyDescription>
                Build this Tenant&apos;s Ayurveda diagnosis catalogue and map each code to an
                ICD-10-CM Diagnosis Code for insurance claims.
              </EmptyDescription>
            </EmptyHeader>
            {canCreate ? (
              <EmptyContent>
                <Button type="button" onClick={openCreateSheet}>
                  <Plus className="size-4" />
                  Add Ayurveda Diagnosis Code
                </Button>
              </EmptyContent>
            ) : null}
          </Empty>
        ) : ayurvedaDiagnosisCodes.length === 0 ? (
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
            <AyurvedaDiagnosisCodeTable
              ayurvedaDiagnosisCodes={ayurvedaDiagnosisCodes}
              canEdit={canUpdate}
              canDelete={canDelete}
              onEdit={(code) => void setAyurvedaCodeParam(String(code.id))}
              onDelete={setCodePendingDelete}
            />

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
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                  >
                    <ChevronLeft className="size-4" />
                    Previous
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((current) => current + 1)}
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
        isCreating={isCreating}
        onClose={closeSheet}
      />

      <DeleteAyurvedaDiagnosisCodeDialog
        ayurvedaDiagnosisCode={canDelete ? codePendingDelete : null}
        onClose={() => setCodePendingDelete(null)}
      />
    </>
  );
}
