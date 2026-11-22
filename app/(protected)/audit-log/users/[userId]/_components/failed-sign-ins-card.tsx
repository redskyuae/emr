import { PiShieldCheckDuotone } from 'react-icons/pi';

import type { UserAuditFailedSignIn } from '@/app/api/lib/modules/audit-log/schemas/user-audit-schema';
import { EmptyState } from '@/components/app/empty-state';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { describeUserAgent } from '@/lib/user-agent';
import { formatAuditTime } from '../../../_utils/audit-log-filters';

export function FailedSignInsCard({
  attempts,
  timeZone,
}: {
  attempts: UserAuditFailedSignIn[];
  timeZone: string | undefined;
}) {
  return (
    <Card className="gap-0 py-0">
      <CardHeader className="border-b p-4">
        <CardTitle>Failed sign-in attempts</CardTitle>
        <CardDescription>
          Sign-ins to this account that were refused. Repeated attempts from an unfamiliar address
          are worth a look.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {attempts.length === 0 ? (
          <EmptyState
            size="sm"
            tone="neutral"
            icon={PiShieldCheckDuotone}
            className="py-8"
            title="No failed attempts in this range"
          />
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-[640px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Time</TableHead>
                  <TableHead>IP address</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead className="pr-4">Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attempts.map((attempt, index) => (
                  <TableRow key={`${new Date(attempt.occurredOn).getTime()}-${index}`}>
                    <TableCell className="pl-4 whitespace-nowrap">
                      {formatAuditTime(attempt.occurredOn, timeZone)}
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">
                      {attempt.ipAddress ?? '—'}
                    </TableCell>
                    <TableCell title={attempt.userAgent ?? undefined}>
                      {describeUserAgent(attempt.userAgent) ?? '—'}
                    </TableCell>
                    <TableCell className="text-destructive pr-4">{attempt.reason ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
