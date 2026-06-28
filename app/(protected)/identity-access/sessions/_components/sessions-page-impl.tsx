'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, Search, ShieldOff } from 'lucide-react';

import type { IamSession } from '@/app/(protected)/identity-access/sessions/_utils/sessions-mock';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
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

function sessionMatchesSearch(searchTerm: string, session: IamSession) {
  const normalizedSearch = searchTerm.trim().toLowerCase();

  if (!normalizedSearch) {
    return true;
  }

  return [session.userName, session.userEmail, session.device, session.ipAddress, session.location]
    .join(' ')
    .toLowerCase()
    .includes(normalizedSearch);
}

export function SessionsPageImpl({ sessions }: { sessions: IamSession[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [revokedSessionIds, setRevokedSessionIds] = useState<Set<string>>(() => new Set());

  const filteredSessions = useMemo(
    () => sessions.filter((session) => sessionMatchesSearch(searchTerm, session)),
    [searchTerm, sessions]
  );

  const activeCount = sessions.length - revokedSessionIds.size;
  const canRevokeAll = activeCount > 0;

  function revokeSession(sessionId: string) {
    setRevokedSessionIds((currentIds) => {
      const nextIds = new Set(currentIds);
      nextIds.add(sessionId);
      return nextIds;
    });
  }

  function revokeAllSessions() {
    setRevokedSessionIds(new Set(sessions.map((session) => session.id)));
  }

  return (
    <div className="space-y-4">
      <Card className="shadow-fluent-2">
        <CardContent className="flex flex-col gap-3 p-3 lg:flex-row lg:items-center">
          <InputGroup className="bg-background shadow-fluent-2 h-9 lg:max-w-sm">
            <InputGroupAddon>
              <Search className="size-4" />
            </InputGroupAddon>
            <InputGroupInput
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search sessions"
              aria-label="Search sessions"
            />
          </InputGroup>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="bg-muted/70 font-mono">
              {formatCount(activeCount, 'active session')}
            </Badge>
            <span className="text-muted-foreground text-sm">
              {formatCount(filteredSessions.length, 'row')} shown
            </span>
          </div>

          <div className="flex sm:justify-end lg:ml-auto">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={!canRevokeAll}
                  className="w-full sm:w-auto"
                >
                  <ShieldOff className="size-4" />
                  Revoke all
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="shadow-fluent-64">
                <AlertDialogHeader>
                  <AlertDialogMedia className="bg-destructive/10 text-destructive">
                    <AlertTriangle className="size-5" />
                  </AlertDialogMedia>
                  <AlertDialogTitle>Revoke all active sessions?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This local mock action will mark every active Staff session as revoked in this
                    view.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction variant="destructive" onClick={revokeAllSessions}>
                    Revoke all
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-fluent-2">
        <CardContent className="p-0">
          {filteredSessions.length ? (
            <Table className="min-w-max">
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">User</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="pr-4 text-right">Revoke</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSessions.map((session) => {
                  const isRevoked = revokedSessionIds.has(session.id);

                  return (
                    <TableRow
                      key={session.id}
                      className={cn(isRevoked && 'bg-muted/30 hover:bg-muted/30 opacity-55')}
                    >
                      <TableCell className="pl-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <Avatar>
                            <AvatarFallback>{session.userInitials}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="flex min-w-0 flex-wrap items-center gap-2">
                              <p className="truncate font-medium">{session.userName}</p>
                              {session.isCurrent ? (
                                <Badge
                                  variant="outline"
                                  className="border-primary/20 bg-primary/10 text-primary"
                                >
                                  You
                                </Badge>
                              ) : null}
                            </div>
                            <p className="text-muted-foreground truncate text-xs">
                              {session.userEmail}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{session.device}</TableCell>
                      <TableCell className="text-muted-foreground font-mono text-xs">
                        {session.ipAddress}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{session.location}</TableCell>
                      <TableCell className="text-muted-foreground font-mono text-xs">
                        {session.started}
                      </TableCell>
                      <TableCell className="text-muted-foreground font-mono text-xs">
                        {session.expires}
                      </TableCell>
                      <TableCell className="pr-4 text-right">
                        {isRevoked ? (
                          <span className="text-muted-foreground text-sm font-medium">Revoked</span>
                        ) : (
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => revokeSession(session.id)}
                            aria-label={`Revoke session for ${session.userName} on ${session.device}`}
                          >
                            <ShieldOff className="size-3.5" />
                            Revoke
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <Empty className="min-h-72 border-0">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ShieldOff className="size-5" />
                </EmptyMedia>
                <EmptyTitle>No sessions match.</EmptyTitle>
                <EmptyDescription>
                  Try a different user, device, IP address, or location search.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
