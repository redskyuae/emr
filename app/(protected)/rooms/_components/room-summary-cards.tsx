import { CiPercent } from 'react-icons/ci';
import { PiBedLight, PiDoorOpenLight, PiStackLight } from 'react-icons/pi';

import type { RoomSummary } from '@/app/api/lib/modules/room/schemas/room-schema';
import { StatCard, StatCardSkeleton } from '@/components/app/stat-card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

export function RoomSummaryCards({ summary }: { summary: RoomSummary }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard icon={PiStackLight} label="Total Rooms" value={summary.totalRooms} />
      <StatCard icon={PiBedLight} label="Total Beds" value={summary.totalBeds} />
      <StatCard
        icon={PiDoorOpenLight}
        label="Available"
        value={summary.availableRooms}
        tone="success"
      />
      <StatCard icon={CiPercent} label="Occupancy" value={`${summary.occupancyRate}%`}>
        <Progress
          value={summary.occupancyRate}
          aria-label={`Occupancy rate ${summary.occupancyRate} percent`}
        />
      </StatCard>
    </div>
  );
}

export function RoomSummaryCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 3 }, (_, i) => (
        <StatCardSkeleton key={i} />
      ))}
      <StatCardSkeleton>
        <Skeleton className="h-1 w-full rounded-full" />
      </StatCardSkeleton>
    </div>
  );
}
