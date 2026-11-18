import Link from 'next/link';
import { PiArrowRightLight } from 'react-icons/pi';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function UpcomingMaintenanceTableSkeleton() {
  return (
    <Card>
      <CardHeader className="border-b">
        <div>
          <CardTitle>Upcoming maintenance</CardTitle>
          <CardDescription>Scheduled &amp; in-progress work orders</CardDescription>
        </div>
        <CardAction>
          <Button asChild variant="outline" size="sm">
            <Link href="/assets-management/maintenance">
              <span>All work orders</span>
              <PiArrowRightLight className="size-3.5" />
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-2 p-4">
        {[0, 1, 2, 3, 4].map((item) => (
          <Skeleton key={item} className="h-10 w-full" />
        ))}
      </CardContent>
    </Card>
  );
}
