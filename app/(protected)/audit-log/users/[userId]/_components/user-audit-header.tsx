'use client';

import Link from 'next/link';
import { CiWavePulse1 } from 'react-icons/ci';

import type { UserAuditDetail } from '@/app/api/lib/modules/audit-log/schemas/user-audit-schema';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatAuditTime } from '../../../_utils/audit-log-filters';
import { auditLogHref } from '../_utils/user-audit-detail';

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="truncate text-sm">{children}</dd>
    </div>
  );
}

export function UserAuditHeader({
  user,
  timeZone,
}: {
  user: UserAuditDetail['user'];
  timeZone: string | undefined;
}) {
  return (
    <Card className="py-0">
      <CardContent className="space-y-4 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-lg font-semibold">{user.name}</h2>
              <Badge variant={user.isActive ? 'secondary' : 'destructive'}>
                {user.isActive ? 'Active' : 'Deactivated'}
              </Badge>
            </div>
            <p className="text-muted-foreground truncate text-sm">{user.email}</p>
          </div>
          <Button type="button" variant="outline" asChild>
            <Link href={auditLogHref({ actor: user.userId })}>
              <CiWavePulse1 className="size-4" />
              All actions
            </Link>
          </Button>
        </div>

        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Fact label="Roles">{user.roles ?? '—'}</Fact>
          <Fact label="Staff code">
            <span className="font-mono">{user.staffCode ?? '—'}</span>
          </Fact>
          <Fact label="Member since">{formatAuditTime(user.memberSince, timeZone)}</Fact>
          <Fact label="Account created">{formatAuditTime(user.accountCreatedAt, timeZone)}</Fact>
        </dl>
      </CardContent>
    </Card>
  );
}

export function UserAuditHeaderSkeleton() {
  return (
    <Card className="py-0" aria-hidden="true">
      <CardContent className="space-y-4 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-44" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-4 w-56" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="space-y-1.5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-36" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
