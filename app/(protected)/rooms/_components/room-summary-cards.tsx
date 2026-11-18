import { BedDouble, DoorOpen, Layers, Percent } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import type { RoomSummary } from '@/app/api/lib/modules/room/schemas/room-schema';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

function SummaryCard({
  icon: Icon,
  label,
  value,
  children,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  children?: React.ReactNode;
}) {
  return (
    <Card className="shadow-fluent-2">
      <CardContent className="space-y-2 p-4">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-full">
            <Icon className="size-4" />
          </div>
          <span className="text-muted-foreground text-sm">{label}</span>
        </div>
        <p className="font-heading text-2xl font-semibold tabular-nums">{value}</p>
        {children}
      </CardContent>
    </Card>
  );
}

export function RoomSummaryCards({ summary }: { summary: RoomSummary }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <SummaryCard icon={Layers} label="Total Rooms" value={String(summary.totalRooms)} />
      <SummaryCard icon={BedDouble} label="Total Beds" value={String(summary.totalBeds)} />
      <SummaryCard icon={DoorOpen} label="Available" value={String(summary.availableRooms)} />
      <SummaryCard icon={Percent} label="Occupancy" value={`${summary.occupancyRate}%`}>
        <Progress
          value={summary.occupancyRate}
          aria-label={`Occupancy rate ${summary.occupancyRate} percent`}
        />
      </SummaryCard>
    </div>
  );
}

export function RoomSummaryCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }, (_, i) => (
        <Card key={i} className="shadow-fluent-2">
          <CardContent className="space-y-2 p-4">
            <div className="flex items-center gap-2">
              <Skeleton className="size-9 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-8 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
