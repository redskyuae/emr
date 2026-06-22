import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Minus, ShieldAlert } from 'lucide-react';

import {
  iamDashboardLoadedAt,
  iamRecentAuditEvents,
  iamRecentSignIns,
  iamRoleDistribution,
  iamStaffUsers,
  iamStats,
  type IamAuditEvent,
  type IamRoleDistribution,
} from '@/app/(protected)/identity-access/dashboard/mock-data';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCount } from '@/lib/format-count';
import { cn } from '@/lib/utils';

const staffById = new Map(iamStaffUsers.map((staffUser) => [staffUser.id, staffUser]));
const totalRoleAssignments = iamRoleDistribution.reduce((total, role) => total + role.count, 0);

const roleBarClassByTone: Record<IamRoleDistribution['tone'], string> = {
  primary: 'bg-primary',
  chart2: 'bg-chart-2',
  chart4: 'bg-chart-4',
  chart5: 'bg-chart-5',
  destructive: 'bg-destructive',
};

const auditBadgeClassByType: Record<IamAuditEvent['type'], string> = {
  AUTH: 'border-chart-5/20 bg-chart-5/10 text-chart-5',
  CREATE: 'border-chart-4/20 bg-chart-4/10 text-chart-4',
  MODIFY: 'border-chart-2/20 bg-chart-2/10 text-chart-2',
  DELETE: 'border-destructive/20 bg-destructive/10 text-destructive',
  CRITICAL: 'border-destructive/20 bg-destructive/10 text-destructive',
};

const auditTypeLabelByType: Record<IamAuditEvent['type'], string> = {
  AUTH: 'AUTH',
  CREATE: 'CREATE',
  MODIFY: 'MODIFY',
  DELETE: 'DELETE',
  CRITICAL: 'CRITICAL',
};

function EmptyDashboardState({ title, description }: { title: string; description: string }) {
  return (
    <Empty className="min-h-48 border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <ShieldAlert className="size-4" />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

export default function IamDashboardPage() {
  const LoadedAtIcon = iamDashboardLoadedAt.icon;

  return (
    <div className="space-y-6">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {iamStats.map((stat) => (
          <Card key={stat.label} className="shadow-fluent-2">
            <CardContent className="flex min-h-36 flex-col justify-between gap-5 p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-muted-foreground text-sm font-medium">{stat.label}</p>
                <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-md">
                  <stat.icon className="size-4" />
                </span>
              </div>

              <div className="space-y-3">
                <p className="text-3xl leading-none font-semibold tabular-nums">{stat.value}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      'font-mono',
                      stat.trend === 'up'
                        ? 'border-chart-4/20 bg-chart-4/10 text-chart-4'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {stat.trend === 'up' ? (
                      <ArrowUpRight className="size-3" />
                    ) : (
                      <Minus className="size-3" />
                    )}
                    {stat.delta}
                  </Badge>
                  <span className="text-muted-foreground text-sm">{stat.note}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.95fr)]">
        <Card className="shadow-fluent-2">
          <CardHeader className="border-b">
            <div>
              <CardTitle>Recent sign-ins</CardTitle>
              <CardDescription>Last 24 hours</CardDescription>
            </div>
            <CardAction>
              <Button asChild variant="outline" size="sm">
                <Link href="/identity-access/sessions">
                  <span>Sessions</span>
                  <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="p-0">
            {iamRecentSignIns.length ? (
              <Table className="min-w-[680px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Device</TableHead>
                    <TableHead className="pr-4">When</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {iamRecentSignIns.map((signIn) => {
                    const staffUser = staffById.get(signIn.userId);

                    if (!staffUser) {
                      return null;
                    }

                    return (
                      <TableRow key={signIn.id}>
                        <TableCell className="pl-4">
                          <div className="flex min-w-0 items-center gap-3">
                            <Avatar>
                              <AvatarFallback>{staffUser.initials}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="truncate font-medium">{staffUser.name}</p>
                              <p className="text-muted-foreground truncate text-xs">
                                {staffUser.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-muted/70">
                            {staffUser.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{signIn.device}</TableCell>
                        <TableCell className="text-muted-foreground pr-4 font-mono text-xs">
                          {signIn.when}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="p-4">
                <EmptyDashboardState
                  title="No recent sign-ins"
                  description="Staff sign-ins will appear here once sessions are created."
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-fluent-2">
          <CardHeader className="border-b">
            <div>
              <CardTitle>Users by role</CardTitle>
              <CardDescription>Current Role Assignment distribution</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-5 p-4">
            {iamRoleDistribution.length ? (
              iamRoleDistribution.map((role) => {
                const percentage = totalRoleAssignments
                  ? Math.max((role.count / totalRoleAssignments) * 100, 7)
                  : 0;

                return (
                  <div key={role.role} className="space-y-2">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-medium">{role.role}</span>
                      <span className="text-muted-foreground tabular-nums">
                        {formatCount(role.count, 'user')}
                      </span>
                    </div>
                    <div className="bg-muted h-2 overflow-hidden rounded-full">
                      <div
                        className={cn('h-full rounded-full', roleBarClassByTone[role.tone])}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <EmptyDashboardState
                title="No Role Assignments"
                description="Role Assignment counts will appear once Staff users are provisioned."
              />
            )}
          </CardContent>
        </Card>
      </section>

      <Card className="shadow-fluent-2">
        <CardHeader className="border-b">
          <div>
            <CardTitle>Recent audit events</CardTitle>
            <CardDescription>Latest identity and access activity</CardDescription>
          </div>
          <CardAction>
            <Button asChild variant="outline" size="sm">
              <Link href="/audit-log">
                <span>View all</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="p-0">
          {iamRecentAuditEvents.length ? (
            <Table className="min-w-[920px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">When</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead className="pr-4">Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {iamRecentAuditEvents.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="text-muted-foreground pl-4 font-mono text-xs">
                      {event.when}
                    </TableCell>
                    <TableCell className="font-medium">{event.actorName}</TableCell>
                    <TableCell className="font-mono text-xs">{event.action}</TableCell>
                    <TableCell className="text-muted-foreground">{event.target}</TableCell>
                    <TableCell className="text-muted-foreground">{event.details}</TableCell>
                    <TableCell className="pr-4">
                      <Badge
                        variant="outline"
                        className={cn('font-mono', auditBadgeClassByType[event.type])}
                      >
                        {auditTypeLabelByType[event.type]}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-4">
              <EmptyDashboardState
                title="No audit events"
                description="Identity and access audit activity will appear here."
              />
            </div>
          )}
        </CardContent>
      </Card>

      <div className="text-muted-foreground flex items-center gap-2 text-xs">
        <LoadedAtIcon className="size-3.5" />
        <span>
          {iamDashboardLoadedAt.label}: {iamDashboardLoadedAt.value}
        </span>
      </div>
    </div>
  );
}
