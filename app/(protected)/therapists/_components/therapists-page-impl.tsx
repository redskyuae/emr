'use client';

import { useEffect, useState } from 'react';
import { useDebouncedValue } from '@tanstack/react-pacer';
import { CiBoxList, CiGrid41, CiSearch, CiViewTable } from 'react-icons/ci';
import { PiMagnifyingGlassDuotone, PiPlusLight, PiUserCircleDuotone } from 'react-icons/pi';
import { useQueryState } from 'nuqs';

import type { Therapist } from '@/app/api/lib/modules/therapist/schemas/therapist-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useHasPermission } from '@/app/queries/identity-access/useCurrentUser';
import { useTherapistsQuery } from '@/app/queries/therapists/useTherapists';
import { EmptyState } from '@/components/app/empty-state';
import { SkeletonCrossfade } from '@/components/app/skeleton-crossfade';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { TherapistStatusDialog } from './_modals/therapist-status-dialog';
import { TherapistFormSheet } from './therapist-form-sheet';
import { TherapistViewSkeleton } from './therapist-skeletons';
import {
  TherapistCardView,
  TherapistListView,
  TherapistTableView,
  type TherapistStatusAction,
} from './therapist-views';

type ViewLayout = 'table' | 'card' | 'list';
type PendingTherapistStatusAction = {
  therapist: Therapist;
  action: TherapistStatusAction;
};

const PAGE_SIZE = 10;

export function TherapistsPageImpl() {
  const [therapistParam, setTherapistParam] = useQueryState('therapist');
  const [viewLayout, setViewLayout] = useState<ViewLayout>('table');
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search, { wait: 300 });
  const [status, setStatus] = useState<'active' | 'inactive' | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [pendingStatusAction, setPendingStatusAction] =
    useState<PendingTherapistStatusAction | null>(null);
  const {
    data: canCreate,
    isLoading: canCreateLoading,
    isError: canCreateError,
  } = useHasPermission('therapist:create');
  const {
    data: canUpdate,
    isLoading: canUpdateLoading,
    isError: canUpdateError,
  } = useHasPermission('therapist:update');
  const { data: canDeactivate } = useHasPermission('therapist:deactivate');
  const { data: canReactivate } = useHasPermission('therapist:reactivate');
  const list = useTherapistsQuery({
    page,
    limit: PAGE_SIZE,
    query: debouncedSearch || undefined,
    status,
  });
  const therapists = list.data?.data ?? [];
  // The same values the query uses, so the empty state always agrees with the list on screen.
  const isFiltered = Boolean(debouncedSearch.trim() || status);
  const isCreating = therapistParam === 'new' && canCreate;
  const editingTherapistId =
    therapistParam && therapistParam !== 'new' && /^\d+$/.test(therapistParam)
      ? Number(therapistParam)
      : null;
  const selected =
    editingTherapistId !== null
      ? (therapists.find((item) => item.id === editingTherapistId) ?? null)
      : null;
  const isOpen = isCreating || Boolean(canUpdate && selected !== null);

  const therapistAccessDenied =
    (therapistParam === 'new' && !canCreateLoading && !canCreateError && !canCreate) ||
    (editingTherapistId !== null && !canUpdateLoading && !canUpdateError && !canUpdate);

  useEffect(() => {
    if (therapistAccessDenied) {
      void setTherapistParam(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [therapistAccessDenied]);

  const viewProps = {
    therapists,
    canEdit: Boolean(canUpdate),
    canDeactivate: Boolean(canDeactivate),
    canReactivate: Boolean(canReactivate),
    onEdit: (item: Therapist) => void setTherapistParam(String(item.id)),
    onStatusAction: (therapist: Therapist, action: TherapistStatusAction) =>
      setPendingStatusAction({ therapist, action }),
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-col gap-3 lg:flex-row lg:items-center">
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
              <CiViewTable className="size-4" />
              Table
            </ToggleGroupItem>
            <ToggleGroupItem value="card" aria-label="Card view">
              <CiGrid41 className="size-4" />
              Card
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="List view">
              <CiBoxList className="size-4" />
              List
            </ToggleGroupItem>
          </ToggleGroup>
          <InputGroup className="lg:max-w-xs">
            <InputGroupAddon>
              <CiSearch className="size-4" />
            </InputGroupAddon>
            <InputGroupInput
              value={search}
              placeholder="Search Therapists…"
              aria-label="Search Therapists"
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </InputGroup>
          <select
            className="border-input bg-background h-10 rounded-md border px-3 text-sm"
            value={status ?? 'all'}
            aria-label="Filter by status"
            onChange={(event) => {
              setStatus(
                event.target.value === 'all'
                  ? undefined
                  : (event.target.value as 'active' | 'inactive')
              );
              setPage(1);
            }}
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          {canCreate ? (
            <Button className="lg:ml-auto" onClick={() => void setTherapistParam('new')}>
              <PiPlusLight className="size-4" />
              Add Therapist
            </Button>
          ) : null}
        </CardContent>
      </Card>

      {list.isError ? (
        <Alert variant="destructive">
          <AlertTitle>Could not load Therapists</AlertTitle>
          <AlertDescription>{getApiErrorMessage(list.error)}</AlertDescription>
        </Alert>
      ) : null}
      <SkeletonCrossfade
        isLoading={list.isLoading}
        skeleton={
          <TherapistViewSkeleton
            layout={viewLayout}
            showActions={viewProps.canEdit || viewProps.canDeactivate || viewProps.canReactivate}
          />
        }
      >
        {therapists.length === 0 ? (
          isFiltered ? (
            <EmptyState
              tone="neutral"
              title="No results found"
              icon={PiMagnifyingGlassDuotone}
              className="bg-card min-h-72 border"
              description="No Therapists match the current search and filters."
            />
          ) : (
            <EmptyState
              tone="violet"
              title="No Therapists yet"
              icon={PiUserCircleDuotone}
              className="bg-card min-h-80 border"
              description="Create a Therapist to assign Ayurvedic Treatment Sessions."
              actions={
                canCreate ? (
                  <Button onClick={() => void setTherapistParam('new')}>
                    <PiPlusLight className="size-4" />
                    Add Therapist
                  </Button>
                ) : null
              }
            />
          )
        ) : viewLayout === 'table' ? (
          <TherapistTableView {...viewProps} />
        ) : viewLayout === 'card' ? (
          <TherapistCardView {...viewProps} />
        ) : (
          <TherapistListView {...viewProps} />
        )}
      </SkeletonCrossfade>
      {/* Paging means nothing under an empty state; while loading it stays, as the loader draws it. */}
      {list.isLoading || therapists.length > 0 ? (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((value) => value - 1)}
          >
            Previous
          </Button>
          <span className="text-muted-foreground text-sm">Page {page}</span>
          <Button
            variant="outline"
            size="sm"
            disabled={!list.data?.meta || page >= list.data.meta.totalPages}
            onClick={() => setPage((value) => value + 1)}
          >
            Next
          </Button>
        </div>
      ) : null}

      <TherapistFormSheet
        open={isOpen}
        therapist={isCreating ? null : selected}
        onClose={() => void setTherapistParam(null)}
      />

      <TherapistStatusDialog
        pendingAction={
          pendingStatusAction &&
          (pendingStatusAction.action === 'deactivate' ? canDeactivate : canReactivate)
            ? pendingStatusAction
            : null
        }
        onClose={() => setPendingStatusAction(null)}
      />
    </div>
  );
}
