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
import type { RoomType } from '@/app/api/lib/modules/room-type/schemas/room-type-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useRoomTypeQuery } from '@/app/queries/room-masters/room-types/useRoomType';
import { useRoomTypesQuery } from '@/app/queries/room-masters/room-types/useRoomTypes';
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
import { RoomTypeDeleteDialog } from './_modals/room-type-delete-dialog';
import { RoomTypeFormSheet } from './_sheets/room-type-form-sheet';
import { ViewSkeleton } from './room-type-skeletons';
import { RoomTypeCardView, RoomTypeListView, RoomTypeTableView } from './room-type-views';

type ViewLayout = 'table' | 'card' | 'list';

const PAGE_SIZE = 10;

export function RoomTypePageImpl() {
  const [roomTypeParam, setRoomTypeParam] = useQueryState('room-type');
  const [viewLayout, setViewLayout] = useState<ViewLayout>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch] = useDebouncedValue(searchTerm, { wait: 300 });
  const [page, setPage] = useState(1);
  const [roomTypePendingDelete, setRoomTypePendingDelete] = useState<RoomType | null>(null);

  const isCreating = roomTypeParam === 'new';
  const editingRoomTypeId =
    roomTypeParam !== null && roomTypeParam !== 'new' && /^\d+$/.test(roomTypeParam)
      ? Number(roomTypeParam)
      : null;

  const roomTypesQuery = useRoomTypesQuery({
    query: debouncedSearch || undefined,
    page,
    limit: PAGE_SIZE,
  });

  const roomTypes = roomTypesQuery.data?.data ?? [];
  const meta = roomTypesQuery.data?.meta;
  const totalPages = meta?.totalPages ?? 0;
  const total = meta?.total ?? 0;
  const rangeStart = total > 0 ? (page - 1) * PAGE_SIZE + 1 : 0;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);

  const editingRoomTypeFromList =
    editingRoomTypeId !== null
      ? (roomTypes.find((roomType) => roomType.id === editingRoomTypeId) ?? null)
      : null;

  const shouldFetchEditingRoomType =
    editingRoomTypeId !== null && !roomTypesQuery.isLoading && editingRoomTypeFromList === null;
  const editingRoomTypeQuery = useRoomTypeQuery(
    shouldFetchEditingRoomType ? editingRoomTypeId : null
  );
  const editingRoomType = editingRoomTypeFromList ?? editingRoomTypeQuery.data ?? null;

  const roomTypeResolving =
    editingRoomTypeId !== null &&
    editingRoomType === null &&
    (roomTypesQuery.isLoading || editingRoomTypeQuery.isFetching);
  const sheetOpen =
    isCreating || (editingRoomTypeId !== null && (roomTypeResolving || editingRoomType !== null));

  const [prevSearch, setPrevSearch] = useState(debouncedSearch);
  if (prevSearch !== debouncedSearch) {
    setPrevSearch(debouncedSearch);
    if (page !== 1) setPage(1);
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
                placeholder="Search room types..."
                aria-label="Search room types"
              />
            </InputGroup>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end lg:ml-auto">
              <Button type="button" size="lg" onClick={() => void setRoomTypeParam('new')}>
                <Plus className="size-4" />
                Add Room Type
              </Button>
            </div>
          </CardContent>
        </Card>

        {roomTypesQuery.isError ? (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Could not load Room Types</AlertTitle>
            <AlertDescription>{getApiErrorMessage(roomTypesQuery.error)}</AlertDescription>
          </Alert>
        ) : null}

        {roomTypesQuery.isLoading ? (
          <ViewSkeleton layout={viewLayout} />
        ) : roomTypes.length === 0 && !debouncedSearch ? (
          <Empty className="bg-card shadow-fluent-2 min-h-80 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <BedDouble />
              </EmptyMedia>
              <EmptyTitle>No Room Types yet</EmptyTitle>
              <EmptyDescription>
                Create Room Types to classify the Rooms in this Tenant and set their daily rate.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button type="button" onClick={() => void setRoomTypeParam('new')}>
                <Plus className="size-4" />
                Add Room Type
              </Button>
            </EmptyContent>
          </Empty>
        ) : roomTypes.length === 0 && debouncedSearch ? (
          <Empty className="bg-card shadow-fluent-2 min-h-72 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Search />
              </EmptyMedia>
              <EmptyTitle>No results found</EmptyTitle>
              <EmptyDescription>
                No Room Types match &ldquo;{debouncedSearch}&rdquo;. Try a different search term.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            {viewLayout === 'table' ? (
              <RoomTypeTableView
                roomTypes={roomTypes}
                onEdit={(roomType) => void setRoomTypeParam(String(roomType.id))}
                onDelete={setRoomTypePendingDelete}
              />
            ) : viewLayout === 'card' ? (
              <RoomTypeCardView
                roomTypes={roomTypes}
                onEdit={(roomType) => void setRoomTypeParam(String(roomType.id))}
                onDelete={setRoomTypePendingDelete}
              />
            ) : (
              <RoomTypeListView
                roomTypes={roomTypes}
                onEdit={(roomType) => void setRoomTypeParam(String(roomType.id))}
                onDelete={setRoomTypePendingDelete}
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

      <RoomTypeFormSheet
        open={sheetOpen}
        mode={isCreating ? 'new' : 'edit'}
        roomTypeId={editingRoomTypeId}
        roomType={editingRoomType}
        isResolving={roomTypeResolving}
        onClose={() => void setRoomTypeParam(null)}
      />

      <RoomTypeDeleteDialog
        roomType={roomTypePendingDelete}
        onClose={() => setRoomTypePendingDelete(null)}
        onDeleted={(deletedId) => {
          if (editingRoomTypeId === deletedId) {
            void setRoomTypeParam(null);
          }
          if (roomTypes.length === 1 && page > 1) {
            setPage((current) => current - 1);
          }
        }}
      />
    </>
  );
}
