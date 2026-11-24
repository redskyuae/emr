import { PiDesktopDuotone, PiGlobeDuotone } from 'react-icons/pi';

import type {
  UserAuditDevice,
  UserAuditIpAddress,
} from '@/app/api/lib/modules/audit-log/schemas/user-audit-schema';
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
import { describeUserAgent, parseUserAgent } from '@/lib/user-agent';
import { formatAuditTime } from '../../../_utils/audit-log-filters';

type TimeZoneProp = { timeZone: string | undefined };

function SeenCells({
  eventCount,
  firstSeenAt,
  lastSeenAt,
  timeZone,
}: TimeZoneProp & { eventCount: number; firstSeenAt: Date; lastSeenAt: Date }) {
  return (
    <>
      <TableCell className="text-right">{eventCount}</TableCell>
      <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
        {formatAuditTime(firstSeenAt, timeZone)}
      </TableCell>
      <TableCell className="text-muted-foreground pr-4 text-xs whitespace-nowrap">
        {formatAuditTime(lastSeenAt, timeZone)}
      </TableCell>
    </>
  );
}

function SeenHeadings() {
  return (
    <>
      <TableHead className="text-right">Events</TableHead>
      <TableHead>First seen</TableHead>
      <TableHead className="pr-4">Last seen</TableHead>
    </>
  );
}

export function IpAddressesCard({
  ipAddresses,
  timeZone,
}: TimeZoneProp & { ipAddresses: UserAuditIpAddress[] }) {
  return (
    <Card className="gap-0 py-0">
      <CardHeader className="border-b p-4">
        <CardTitle>IP addresses</CardTitle>
        <CardDescription>Where this user’s requests came from in this range.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {ipAddresses.length === 0 ? (
          <EmptyState
            size="sm"
            tone="neutral"
            icon={PiGlobeDuotone}
            className="py-8"
            title="No addresses in this range"
          />
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-[520px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">IP address</TableHead>
                  <SeenHeadings />
                </TableRow>
              </TableHeader>
              <TableBody>
                {ipAddresses.map((item) => (
                  <TableRow key={item.ipAddress}>
                    <TableCell className="pl-4 font-mono text-xs">{item.ipAddress}</TableCell>
                    <SeenCells {...item} timeZone={timeZone} />
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

export function DevicesCard({ devices, timeZone }: TimeZoneProp & { devices: UserAuditDevice[] }) {
  return (
    <Card className="gap-0 py-0">
      <CardHeader className="border-b p-4">
        <CardTitle>Devices & browsers</CardTitle>
        <CardDescription>Hover a device to see its full browser details.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {devices.length === 0 ? (
          <EmptyState
            size="sm"
            tone="neutral"
            icon={PiDesktopDuotone}
            className="py-8"
            title="No devices in this range"
          />
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-[560px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Device</TableHead>
                  <SeenHeadings />
                </TableRow>
              </TableHeader>
              <TableBody>
                {devices.map((item) => (
                  <TableRow key={item.userAgent}>
                    <TableCell className="pl-4" title={item.userAgent}>
                      <p className="font-medium">{describeUserAgent(item.userAgent)}</p>
                      <p className="text-muted-foreground text-xs">
                        {parseUserAgent(item.userAgent).deviceType ?? 'Unknown device'}
                      </p>
                    </TableCell>
                    <SeenCells {...item} timeZone={timeZone} />
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
