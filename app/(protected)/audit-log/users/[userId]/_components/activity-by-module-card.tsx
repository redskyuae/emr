import Link from 'next/link';
import { PiListChecksDuotone } from 'react-icons/pi';

import type { UserAuditDetail } from '@/app/api/lib/modules/audit-log/schemas/user-audit-schema';
import { EmptyState } from '@/components/app/empty-state';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { auditLogHref, moduleBarWidth } from '../_utils/user-audit-detail';

export function ActivityByModuleCard({
  userId,
  activity,
}: {
  userId: string;
  activity: UserAuditDetail['activityByModule'];
}) {
  const maxCount = Math.max(0, ...activity.map(({ count }) => count));

  return (
    <Card className="gap-0 py-0">
      <CardHeader className="border-b p-4">
        <CardTitle>Activity by Module</CardTitle>
        <CardDescription>
          Every recorded event in this range, sign-ins included. Open a Module to see the events.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {activity.length === 0 ? (
          <EmptyState
            size="sm"
            tone="neutral"
            icon={PiListChecksDuotone}
            className="py-8"
            title="No activity in this range"
          />
        ) : (
          <ul className="divide-y">
            {activity.map(({ module, count }) => (
              <li key={module}>
                <Link
                  href={auditLogHref({ actor: userId, module })}
                  className="hover:bg-muted/50 grid grid-cols-[minmax(8rem,12rem)_1fr_auto] items-center gap-3 px-4 py-3"
                >
                  <span className="truncate text-sm font-medium">{module}</span>
                  <span className="bg-muted h-2 overflow-hidden rounded-full" aria-hidden="true">
                    <span
                      className="bg-primary block h-full rounded-full"
                      style={{ width: `${moduleBarWidth(count, maxCount)}%` }}
                    />
                  </span>
                  <span className="text-sm tabular-nums">{count}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
