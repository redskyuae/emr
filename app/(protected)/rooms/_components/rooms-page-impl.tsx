'use client';

import { useState } from 'react';
import { useQueryState } from 'nuqs';
import { useDebouncedValue } from '@tanstack/react-pacer';
import {
  AlertCircle,
  BedDouble,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  LayoutList,
  Plus,
  Search,
  Table as TableIcon,
} from 'lucide-react';
import type { Room, RoomStatus } from '@/app/api/lib/modules/room/schemas/room-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useRoomTypesQuery } from '@/app/queries/room-masters/room-types/useRoomTypes';
import { useRoomQuery } from '@/app/queries/rooms/useRoom';
import { useRoomSummaryQuery } from '@/app/queries/rooms/useRoomSummary';
import { useRoomsQuery } from '@/app/queries/rooms/useRooms';
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

  const isCreating = roomParam === 'new';
  const editingRoomId =
    roomParam !== null && roomParam !== 'new' && /^\d+$/.test(roomParam) ? Number(roomParam) : null;

  const summaryQuery = useRoomSummaryQuery();
  const roomTypesQuery = useRoomTypesQuery({ limit: 100 });
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
    isCreating || (editingRoomId !== null && (roomResolving || editingRoom !== null));

  const filterKey = `${debouncedSearch}|${statusFilter}|${roomTypeFilter}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (prevFilterKey !== filterKey) {
    setPrevFilterKey(filterKey);
    if (page !== 1) setPage(1);
  }

  return (
    <>
      <div className="space-y-4">
        {summaryQuery.isLoading ? (
          <RoomSummaryCardsSkeleton />
        ) : summaryQuery.data ? (
          <RoomSummaryCards summary={summaryQuery.data} />
        ) : null}

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

            <InputGroup className="bg-background shadow-fluent-2 h-9 lg:max-w-xs">
              <InputGroupAddon>
                <Search className="size-4" />
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
              <SelectTrigger className="h-9 lg:w-40" aria-label="Filter by status">
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
              <SelectTrigger className="h-9 lg:w-44" aria-label="Filter by Room Type">
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

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end lg:ml-auto">
              <Button type="button" size="lg" onClick={() => void setRoomParam('new')}>
                <Plus className="size-4" />
                Add Room
              </Button>
            </div>
          </CardContent>
        </Card>

        {roomsQuery.isError ? (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Could not load Rooms</AlertTitle>
            <AlertDescription>{getApiErrorMessage(roomsQuery.error)}</AlertDescription>
          </Alert>
        ) : null}

        {roomsQuery.isLoading ? (
          <ViewSkeleton layout={viewLayout} />
        ) : rooms.length === 0 && !hasFilters ? (
          <Empty className="bg-card shadow-fluent-2 min-h-80 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <BedDouble />
              </EmptyMedia>
              <EmptyTitle>No Rooms yet</EmptyTitle>
              <EmptyDescription>
                Add the Rooms in this Tenant to track their Room Type, Beds, and availability.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button type="button" onClick={() => void setRoomParam('new')}>
                <Plus className="size-4" />
                Add Room
              </Button>
            </EmptyContent>
          </Empty>
        ) : rooms.length === 0 ? (
          <Empty className="bg-card shadow-fluent-2 min-h-72 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Search />
              </EmptyMedia>
              <EmptyTitle>No results found</EmptyTitle>
              <EmptyDescription>
                No Rooms match the current search and filters. Try widening them.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            {viewLayout === 'table' ? (
              <RoomTableView
                rooms={rooms}
                onEdit={(room) => void setRoomParam(String(room.id))}
                onDelete={setRoomPendingDelete}
              />
            ) : viewLayout === 'card' ? (
              <RoomCardView
                rooms={rooms}
                onEdit={(room) => void setRoomParam(String(room.id))}
                onDelete={setRoomPendingDelete}
              />
            ) : (
              <RoomListView
                rooms={rooms}
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

      <RoomFormSheet
        open={sheetOpen}
        mode={isCreating ? 'new' : 'edit'}
        roomId={editingRoomId}
        room={editingRoom}
        isResolving={roomResolving}
        onClose={() => void setRoomParam(null)}
      />

      <RoomDeleteDialog
        room={roomPendingDelete}
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
