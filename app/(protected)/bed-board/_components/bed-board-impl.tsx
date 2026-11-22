'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CiCircleAlert } from 'react-icons/ci';
import { PiBedDuotone, PiBedLight, PiMagnifyingGlassDuotone } from 'react-icons/pi';

import type { BedBoardBed } from '@/app/api/lib/modules/bed/schemas/bed-schema';
import { BED_STATUSES } from '@/app/db/schema/bed';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useBedBoardQuery } from '@/app/queries/inpatient-masters/beds/useBedBoard';
import {
  getBedStatusClassName,
  getBedStatusLabel,
} from '@/app/(protected)/inpatient-masters/beds/_utils/bed-status';
import { EmptyState } from '@/components/app/empty-state';
import { SkeletonCrossfade } from '@/components/app/skeleton-crossfade';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const ALL_FILTER = 'all';

export function BedBoardImpl() {
  const [wardFilter, setWardFilter] = useState(ALL_FILTER);
  const [statusFilter, setStatusFilter] = useState(ALL_FILTER);

  const boardQuery = useBedBoardQuery();
  const allWards = boardQuery.data ?? [];

  const wards = allWards
    .filter((ward) => wardFilter === ALL_FILTER || String(ward.wardId) === wardFilter)
    .map((ward) => ({
      ...ward,
      visibleBeds:
        statusFilter === ALL_FILTER
          ? ward.beds
          : ward.beds.filter((bed) => bed.status === statusFilter),
    }));

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <Select value={wardFilter} onValueChange={setWardFilter}>
            <SelectTrigger className="lg:w-48" aria-label="Filter by ward">
              <SelectValue placeholder="All Wards" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_FILTER}>All Wards</SelectItem>
              {allWards.map((ward) => (
                <SelectItem key={ward.wardId} value={String(ward.wardId)}>
                  {ward.wardName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="lg:w-44" aria-label="Filter by status">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_FILTER}>All statuses</SelectItem>
              {BED_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {getBedStatusLabel(status)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {boardQuery.isError ? (
        <Alert variant="destructive">
          <CiCircleAlert className="size-4" />
          <AlertTitle>Could not load the Bed Board</AlertTitle>
          <AlertDescription>{getApiErrorMessage(boardQuery.error)}</AlertDescription>
        </Alert>
      ) : null}

      <SkeletonCrossfade isLoading={boardQuery.isLoading} skeleton={<BedBoardSkeleton />}>
        {allWards.length === 0 ? (
          <EmptyState
            tone="sky"
            icon={PiBedDuotone}
            title="No Beds configured"
            className="bg-card min-h-80 border"
            description="Create Wards and Beds under Inpatient Masters to see the occupancy board."
            actions={
              <Button asChild>
                <Link href="/inpatient-masters/beds">Configure Beds</Link>
              </Button>
            }
          />
        ) : wards.every((ward) => ward.visibleBeds.length === 0) ? (
          <EmptyState
            tone="neutral"
            title="No results found"
            icon={PiMagnifyingGlassDuotone}
            className="bg-card min-h-72 border"
            description="No Beds match the current filters."
          />
        ) : (
          <div className="space-y-4">
            {wards
              .filter((ward) => ward.visibleBeds.length > 0)
              .map((ward) => {
                const occupied = ward.beds.filter((bed) => bed.status === 'OCCUPIED').length;

                return (
                  <Card key={ward.wardId}>
                    <CardHeader className="flex-row items-center justify-between">
                      <CardTitle className="text-base">
                        {ward.wardName} <Badge variant="secondary">{ward.wardCode}</Badge>
                      </CardTitle>
                      <p className="text-muted-foreground text-sm tabular-nums">
                        {occupied}/{ward.beds.length} beds occupied
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                        {ward.visibleBeds.map((bed) => (
                          <BedTile key={bed.id} bed={bed} wardId={ward.wardId} />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        )}
      </SkeletonCrossfade>
    </div>
  );
}

function BedTile({ bed, wardId }: { bed: BedBoardBed; wardId: number }) {
  const tileClassName = cn(
    'flex min-h-28 flex-col gap-1 rounded-lg border p-3 text-left text-sm',
    getBedStatusClassName(bed.status)
  );

  const header = (
    <div className="flex items-center justify-between gap-1">
      <p className="flex items-center gap-1 font-semibold">
        <PiBedLight className="size-4" />
        {bed.bedNumber}
      </p>
      <span className="text-xs">{getBedStatusLabel(bed.status)}</span>
    </div>
  );

  if (bed.occupant) {
    return (
      <Link href={`/admissions/${bed.occupant.admissionId}`} className={tileClassName}>
        {header}
        {bed.roomNumber ? <p className="text-xs opacity-80">Room {bed.roomNumber}</p> : null}
        <p className="mt-auto truncate font-medium">
          {bed.occupant.firstName} {bed.occupant.lastName}
        </p>
        <p className="text-xs opacity-80">
          {bed.occupant.mrn} · {bed.occupant.admissionNumber}
        </p>
      </Link>
    );
  }

  const admittable = bed.status === 'AVAILABLE' || bed.status === 'RESERVED';

  if (!admittable) {
    return (
      <div className={tileClassName}>
        {header}
        {bed.roomNumber ? <p className="text-xs opacity-80">Room {bed.roomNumber}</p> : null}
        <p className="text-muted-foreground mt-auto text-xs">Out of service</p>
      </div>
    );
  }

  return (
    <Link
      href={`/admissions?admit=new&ward=${wardId}&bed=${bed.id}`}
      className={tileClassName}
      aria-label={`Admit a Patient to ${bed.bedNumber}`}
    >
      {header}
      {bed.roomNumber ? <p className="text-xs opacity-80">Room {bed.roomNumber}</p> : null}
      <p className="mt-auto text-xs font-medium underline-offset-2 hover:underline">Admit here</p>
    </Link>
  );
}

// Mirrors the loaded board: one Ward card (name, code badge, occupancy count) per Ward, each
// holding Bed tiles with the Bed number and status, room line and occupant lines.
export function BedBoardSkeleton() {
  return (
    <div className="space-y-4" aria-label="Loading the Bed Board">
      {Array.from({ length: 2 }, (_, wardIndex) => (
        <Card key={wardIndex}>
          <CardHeader className="flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-6 w-12 rounded-full" />
            </div>
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {Array.from({ length: 6 }, (_, bedIndex) => (
                <div key={bedIndex} className="flex min-h-28 flex-col gap-1 rounded-lg border p-3">
                  <div className="flex items-center justify-between gap-1">
                    <Skeleton className="h-4 w-14" />
                    <Skeleton className="h-3 w-14" />
                  </div>
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="mt-auto h-4 w-24 max-w-full" />
                  <Skeleton className="h-3 w-28 max-w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
