'use client';

import { useEffect, useState } from 'react';
import { useDebouncedValue } from '@tanstack/react-pacer';
import { LayoutGrid, LayoutList, Plus, Search, Table as TableIcon, UserRound } from 'lucide-react';
import { useQueryState } from 'nuqs';

import type { Therapist } from '@/app/api/lib/modules/therapist/schemas/therapist-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useHasPermission } from '@/app/queries/identity-access/useCurrentUser';
import { useTherapistsQuery } from '@/app/queries/therapists/useTherapists';
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
      <Card className="shadow-fluent-2">
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
          <InputGroup className="h-10 lg:max-w-xs">
            <InputGroupAddon>
              <Search className="size-4" />
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
              <Plus className="size-4" />
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
      {list.isLoading ? (
        <TherapistViewSkeleton layout={viewLayout} />
      ) : therapists.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <UserRound />
            </EmptyMedia>
            <EmptyTitle>No Therapists yet</EmptyTitle>
            <EmptyDescription>
              Create a Therapist to assign Ayurvedic Treatment Sessions.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            {canCreate ? (
              <Button onClick={() => void setTherapistParam('new')}>
                <Plus className="size-4" />
                Add Therapist
              </Button>
            ) : null}
          </EmptyContent>
        </Empty>
      ) : viewLayout === 'table' ? (
        <TherapistTableView {...viewProps} />
      ) : viewLayout === 'card' ? (
        <TherapistCardView {...viewProps} />
      ) : (
        <TherapistListView {...viewProps} />
      )}
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
