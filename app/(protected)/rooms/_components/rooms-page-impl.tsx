'use client';

import { useEffect, useState } from 'react';
import { useQueryState } from 'nuqs';
import { useDebouncedValue } from '@tanstack/react-pacer';
import { CiBoxList, CiCircleAlert, CiGrid41, CiSearch, CiViewTable } from 'react-icons/ci';
import {
  PiPlusLight,
  PiDoorDuotone,
  PiCaretLeftLight,
  PiCaretRightLight,
  PiMagnifyingGlassDuotone,
} from 'react-icons/pi';
import type { Room, RoomStatus } from '@/app/api/lib/modules/room/schemas/room-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useHasPermission } from '@/app/queries/identity-access/useCurrentUser';
import { useRoomTypesQuery } from '@/app/queries/room-masters/room-types/useRoomTypes';
import { useRoomQuery } from '@/app/queries/rooms/useRoom';
import { useRoomSummaryQuery } from '@/app/queries/rooms/useRoomSummary';
import { useRoomsQuery } from '@/app/queries/rooms/useRooms';
import { EmptyState } from '@/components/app/empty-state';
import { SkeletonCrossfade } from '@/components/app/skeleton-crossfade';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ROOM_STATUS_OPTIONS } from '../_utils/room-status';
import { RoomDeleteDialog } from './_modals/room-delete-dialog';
import { RoomFormSheet } from './_sheets/room-form-sheet';
import { ViewSkeleton } from './room-skeletons';
import { RoomSummaryCards, RoomSummaryCardsSkeleton } from './room-summary-cards';
import { RoomCardView, RoomListView, RoomTableView } from './room-views';

type ViewLayout = 'table' | 'card' | 'list';

const PAGE_SIZE = 10;
const ALL_FILTER = 'all';

export function RoomsPageImpl() {
  const [roomParam, setRoomParam] = useQueryState('room');
  const [viewLayout, setViewLayout] = useState<ViewLayout>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch] = useDebouncedValue(searchTerm, { wait: 300 });
  const [statusFilter, setStatusFilter] = useState<RoomStatus | typeof ALL_FILTER>(ALL_FILTER);
  const [roomTypeFilter, setRoomTypeFilter] = useState<string>(ALL_FILTER);
  const [page, setPage] = useState(1);
  const [roomPendingDelete, setRoomPendingDelete] = useState<Room | null>(null);

  const {
    data: canCreate,
    isLoading: canCreateLoading,
    isError: canCreateError,
  } = useHasPermission('room:create');
  const {
    data: canUpdate,
    isLoading: canUpdateLoading,
    isError: canUpdateError,
  } = useHasPermission('room:update');
  const { data: canDelete } = useHasPermission('room:delete');

  const isCreating = roomParam === 'new' && canCreate;
  const editingRoomId =
    roomParam !== null && roomParam !== 'new' && /^\d+$/.test(roomParam) ? Number(roomParam) : null;

  const summaryQuery = useRoomSummaryQuery();
  const roomTypesQuery = useRoomTypesQuery({ limit: 999 });
  const roomsQuery = useRoomsQuery({
    query: debouncedSearch || undefined,
    status: statusFilter === ALL_FILTER ? undefined : statusFilter,
    roomTypeId: roomTypeFilter === ALL_FILTER ? undefined : Number(roomTypeFilter),
    page,
    limit: PAGE_SIZE,
  });

  const rooms = roomsQuery.data?.data ?? [];
  const roomTypes = roomTypesQuery.data?.data ?? [];
  const meta = roomsQuery.data?.meta;
  const totalPages = meta?.totalPages ?? 0;
  const total = meta?.total ?? 0;
  const rangeStart = total > 0 ? (page - 1) * PAGE_SIZE + 1 : 0;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);
  const hasFilters =
    Boolean(debouncedSearch) || statusFilter !== ALL_FILTER || roomTypeFilter !== ALL_FILTER;

  const editingRoomFromList =
    editingRoomId !== null ? (rooms.find((room) => room.id === editingRoomId) ?? null) : null;

  const shouldFetchEditingRoom =
    editingRoomId !== null && !roomsQuery.isLoading && editingRoomFromList === null;
  const editingRoomQuery = useRoomQuery(shouldFetchEditingRoom ? editingRoomId : null);
  const editingRoom = editingRoomFromList ?? editingRoomQuery.data ?? null;

  const roomResolving =
    editingRoomId !== null &&
    editingRoom === null &&
    (roomsQuery.isLoading || editingRoomQuery.isFetching);
  const sheetOpen =
    isCreating || (canUpdate && editingRoomId !== null && (roomResolving || editingRoom !== null));

  const roomAccessDenied =
    (roomParam === 'new' && !canCreateLoading && !canCreateError && !canCreate) ||
    (editingRoomId !== null && !canUpdateLoading && !canUpdateError && !canUpdate);

  useEffect(() => {
    if (roomAccessDenied) {
      void setRoomParam(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomAccessDenied]);

  const filterKey = `${debouncedSearch}|${statusFilter}|${roomTypeFilter}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (prevFilterKey !== filterKey) {
    setPrevFilterKey(filterKey);
    if (page !== 1) setPage(1);
  }

  return (
    <>
      <div className="space-y-4">
        {summaryQuery.isLoading || summaryQuery.data ? (
          <SkeletonCrossfade
            isLoading={summaryQuery.isLoading}
            skeleton={<RoomSummaryCardsSkeleton />}
          >
            {summaryQuery.data ? <RoomSummaryCards summary={summaryQuery.data} /> : null}
          </SkeletonCrossfade>
        ) : null}

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
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search rooms..."
                aria-label="Search rooms"
              />
            </InputGroup>

            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as RoomStatus | typeof ALL_FILTER)}
            >
              <SelectTrigger className="lg:w-40" aria-label="Filter by status">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_FILTER}>All statuses</SelectItem>
                {ROOM_STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={roomTypeFilter} onValueChange={setRoomTypeFilter}>
              <SelectTrigger className="lg:w-44" aria-label="Filter by Room Type">
                <SelectValue placeholder="All Room Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_FILTER}>All Room Types</SelectItem>
                {roomTypes.map((roomType) => (
                  <SelectItem key={roomType.id} value={String(roomType.id)}>
                    {roomType.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {canCreate ? (
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end lg:ml-auto">
                <Button type="button" size="lg" onClick={() => void setRoomParam('new')}>
                  <PiPlusLight className="size-4" />
                  Add Room
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {roomsQuery.isError ? (
          <Alert variant="destructive">
            <CiCircleAlert className="size-4" />
            <AlertTitle>Could not load Rooms</AlertTitle>
            <AlertDescription>{getApiErrorMessage(roomsQuery.error)}</AlertDescription>
          </Alert>
        ) : null}

        <SkeletonCrossfade
          isLoading={roomsQuery.isLoading}
          skeleton={<ViewSkeleton layout={viewLayout} showActions={canUpdate || canDelete} />}
        >
          {rooms.length === 0 && !hasFilters ? (
            <EmptyState
              tone="sky"
              title="No Rooms yet"
              icon={PiDoorDuotone}
              className="bg-card min-h-80 border"
              description="Add the Rooms in this Tenant to track their Room Type, Beds, and availability."
              actions={
                canCreate ? (
                  <Button type="button" onClick={() => void setRoomParam('new')}>
                    <PiPlusLight className="size-4" />
                    Add Room
                  </Button>
                ) : null
              }
            />
          ) : rooms.length === 0 ? (
            <EmptyState
              tone="neutral"
              title="No results found"
              icon={PiMagnifyingGlassDuotone}
              className="bg-card min-h-72 border"
              description="No Rooms match the current search and filters. Try widening them."
            />
          ) : (
            <div className="space-y-4">
              {viewLayout === 'table' ? (
                <RoomTableView
                  rooms={rooms}
                  canEdit={canUpdate}
                  canDelete={canDelete}
                  onEdit={(room) => void setRoomParam(String(room.id))}
                  onDelete={setRoomPendingDelete}
                />
              ) : viewLayout === 'card' ? (
                <RoomCardView
                  rooms={rooms}
                  canEdit={canUpdate}
                  canDelete={canDelete}
                  onEdit={(room) => void setRoomParam(String(room.id))}
                  onDelete={setRoomPendingDelete}
                />
              ) : (
                <RoomListView
                  rooms={rooms}
                  canEdit={canUpdate}
                  canDelete={canDelete}
                  onEdit={(room) => void setRoomParam(String(room.id))}
                  onDelete={setRoomPendingDelete}
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
                      onClick={() => setPage((current) => Math.max(1, current - 1))}
                    >
                      <PiCaretLeftLight className="size-4" />
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
                      <PiCaretRightLight className="size-4" />
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </SkeletonCrossfade>
      </div>

      <RoomFormSheet
        open={sheetOpen}
        mode={isCreating ? 'new' : 'edit'}
        roomId={editingRoomId}
        room={editingRoom}
        isResolving={roomResolving}
        onClose={() => void setRoomParam(null)}
      />

      <RoomDeleteDialog
        room={canDelete ? roomPendingDelete : null}
        onClose={() => setRoomPendingDelete(null)}
        onDeleted={(deletedId) => {
          if (editingRoomId === deletedId) {
            void setRoomParam(null);
          }
          if (rooms.length === 1 && page > 1) {
            setPage((current) => current - 1);
          }
        }}
      />
    </>
  );
}
