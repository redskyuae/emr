'use client';

import { CiCircleAlert, CiEdit, CiMenuKebab } from 'react-icons/ci';
import { PiMagnifyingGlassDuotone, PiUserCheckLight, PiUserMinusLight } from 'react-icons/pi';

import type { StaffWithRoles } from '@/app/api/lib/modules/staff/schemas/staff-schema';
import type { Paginated } from '@/app/api/lib/utils/types';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { EmptyState } from '@/components/app/empty-state';
import { SkeletonCrossfade } from '@/components/app/skeleton-crossfade';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

type UsersTableProps = {
  staff: StaffWithRoles[];
  meta: Paginated<StaffWithRoles>['meta'] | undefined;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: unknown;
  page: number;
  onPageChange: (next: number) => void;
  onEdit: (member: StaffWithRoles) => void;
  onDeactivate: (member: StaffWithRoles) => void;
  onReactivate: (member: StaffWithRoles) => void;
  reactivatingId: string | null;
  canEdit: boolean;
  canDeactivate: boolean;
  canReactivate: boolean;
};

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return '?';
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function UsersTable({
  staff,
  meta,
  isLoading,
  isFetching,
  isError,
  error,
  page,
  onPageChange,
  onEdit,
  onDeactivate,
  onReactivate,
  reactivatingId,
  canEdit,
  canDeactivate,
  canReactivate,
}: UsersTableProps) {
  if (isError) {
    return (
      <Alert variant="destructive">
        <CiCircleAlert className="size-4" />
        <AlertTitle>Could not load Staff</AlertTitle>
        <AlertDescription>{getApiErrorMessage(error)}</AlertDescription>
      </Alert>
    );
  }

  const totalPages = meta?.totalPages ?? 0;
  const total = meta?.total ?? 0;

  return (
    <Card className="py-0">
      <CardContent className="p-0">
        <SkeletonCrossfade
          isLoading={isLoading}
          skeleton={
            <UsersTableSkeleton
              canEdit={canEdit}
              canChangeStatus={canDeactivate || canReactivate}
            />
          }
        >
          {staff.length === 0 ? (
            // The list always holds at least the signed-in user, so empty only ever means no match.
            <EmptyState
              tone="neutral"
              className="min-h-72"
              title="No Staff found"
              icon={PiMagnifyingGlassDuotone}
              description="Try a different search term, Role, or status filter."
            />
          ) : (
            <>
              <Table className={cn('min-w-max', isFetching && 'opacity-70 transition-opacity')}>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">User</TableHead>
                    <TableHead>Role(s)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="pr-4 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staff.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="pl-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <Avatar>
                            <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate font-medium">{member.name}</p>
                            <p className="text-muted-foreground truncate text-xs">{member.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {member.roles.length ? (
                          <div className="flex flex-wrap gap-1">
                            {member.roles.map((role) => (
                              <Badge key={role.id} variant="outline" className="bg-muted/70">
                                {role.name}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            member.isActive
                              ? 'border-chart-4/20 bg-chart-4/10 text-chart-4'
                              : 'bg-muted/60 text-muted-foreground'
                          )}
                        >
                          {member.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="pr-4">
                        <div className="flex justify-end gap-1">
                          {canEdit ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => onEdit(member)}
                            >
                              <CiEdit className="size-3.5" />
                              Edit
                            </Button>
                          ) : null}
                          {(member.isActive ? canDeactivate : canReactivate) ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon-sm"
                                  aria-label={`More actions for ${member.name}`}
                                >
                                  <CiMenuKebab className="size-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-44">
                                {member.isActive ? (
                                  <DropdownMenuItem
                                    variant="destructive"
                                    onSelect={() => onDeactivate(member)}
                                  >
                                    <PiUserMinusLight className="size-4" />
                                    Deactivate
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem
                                    disabled={reactivatingId === member.id}
                                    onSelect={() => onReactivate(member)}
                                  >
                                    <PiUserCheckLight className="size-4" />
                                    Reactivate
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex flex-col items-center justify-between gap-3 border-t p-3 sm:flex-row">
                <p className="text-muted-foreground text-sm">
                  {total} {total === 1 ? 'Staff member' : 'Staff members'}
                  {totalPages > 1 ? ` · Page ${page} of ${totalPages}` : ''}
                </p>
                {totalPages > 1 ? (
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={page <= 1 || isFetching}
                      onClick={() => onPageChange(page - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages || isFetching}
                      onClick={() => onPageChange(page + 1)}
                    >
                      Next
                    </Button>
                  </div>
                ) : null}
              </div>
            </>
          )}
        </SkeletonCrossfade>
      </CardContent>
    </Card>
  );
}

/**
 * Mirrors the loaded table: the same header, one sized skeleton per cell for a full page of rows,
 * and the footer. The action flags match what the loaded rows render; the route loader cannot
 * know the permissions yet, so it keeps the defaults.
 */
export function UsersTableSkeleton({
  canEdit = true,
  canChangeStatus = true,
}: {
  canEdit?: boolean;
  canChangeStatus?: boolean;
}) {
  return (
    <>
      <Table className="min-w-max">
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4">User</TableHead>
            <TableHead>Role(s)</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="pr-4 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 10 }, (_, row) => (
            <TableRow key={row}>
              <TableCell className="pl-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="size-8 shrink-0 rounded-full" />
                  <div>
                    <div className="flex h-5 items-center">
                      <Skeleton className="h-3.5 w-32" />
                    </div>
                    <div className="flex h-4 items-center">
                      <Skeleton className="h-3 w-44" />
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  <Skeleton className="h-6 w-24 rounded-full" />
                </div>
              </TableCell>
              <TableCell>
                <Skeleton className="h-6 w-16 rounded-full" />
              </TableCell>
              <TableCell className="pr-4">
                <div className="flex justify-end gap-1">
                  {canEdit ? <Skeleton className="h-8 w-16" /> : null}
                  {canChangeStatus ? <Skeleton className="size-8" /> : null}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex items-center justify-between gap-3 border-t p-3">
        <div className="flex h-5 items-center">
          <Skeleton className="h-3.5 w-32" />
        </div>
      </div>
    </>
  );
}
