'use client';

import { useState } from 'react';
import { useDebouncedValue } from '@tanstack/react-pacer';
import { CircleOff, MoreVertical, Pencil, Plus, RotateCcw, Search, UserRound } from 'lucide-react';
import { useQueryState } from 'nuqs';

import type { Therapist } from '@/app/api/lib/modules/therapist/schemas/therapist-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useHasPermission } from '@/app/queries/identity-access/useCurrentUser';
import { useDeactivateTherapist } from '@/app/queries/therapists/useDeactivateTherapist';
import { useReactivateTherapist } from '@/app/queries/therapists/useReactivateTherapist';
import { useTherapistsQuery } from '@/app/queries/therapists/useTherapists';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Empty,
  EmptyContent,
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
import { TherapistFormSheet } from './therapist-form-sheet';

const PAGE_SIZE = 10;

function TherapistActionsMenu({
  therapist,
  canEdit,
  canDeactivate,
  canReactivate,
  onEdit,
  onStatusAction,
}: {
  therapist: Therapist;
  canEdit: boolean;
  canDeactivate: boolean;
  canReactivate: boolean;
  onEdit: (therapist: Therapist) => void;
  onStatusAction: (therapist: Therapist) => void;
}) {
  const canStatusAction = therapist.isActive ? canDeactivate : canReactivate;

  if (!canEdit && !canStatusAction) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Actions for ${therapist.name}`}
        >
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {canEdit ? (
          <DropdownMenuItem onClick={() => onEdit(therapist)}>
            <Pencil className="size-4" />
            Edit
          </DropdownMenuItem>
        ) : null}
        {canStatusAction ? (
          <DropdownMenuItem
            variant={therapist.isActive ? 'destructive' : 'default'}
            onClick={() => onStatusAction(therapist)}
          >
            {therapist.isActive ? (
              <CircleOff className="size-4" />
            ) : (
              <RotateCcw className="size-4" />
            )}
            {therapist.isActive ? 'Deactivate' : 'Reactivate'}
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function TherapistsPageImpl() {
  const [therapistParam, setTherapistParam] = useQueryState('therapist');
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search, { wait: 300 });
  const [status, setStatus] = useState<'active' | 'inactive' | undefined>(undefined);
  const [page, setPage] = useState(1);
  const { data: canCreate } = useHasPermission('therapist:create');
  const { data: canUpdate } = useHasPermission('therapist:update');
  const { data: canDeactivate } = useHasPermission('therapist:deactivate');
  const { data: canReactivate } = useHasPermission('therapist:reactivate');
  const list = useTherapistsQuery({
    page,
    limit: PAGE_SIZE,
    query: debouncedSearch || undefined,
    status,
  });
  const deactivate = useDeactivateTherapist();
  const reactivate = useReactivateTherapist();
  const therapists = list.data?.data ?? [];
  const selected =
    therapistParam && therapistParam !== 'new'
      ? (therapists.find((item) => item.id === Number(therapistParam)) ?? null)
      : null;
  const isOpen = therapistParam !== null;

  const toggleStatus = (therapist: Therapist) => {
    if (therapist.isActive) void deactivate.mutateAsync(therapist.id);
    else void reactivate.mutateAsync(therapist.id);
  };

  return (
    <div className="space-y-4">
      <Card className="shadow-fluent-2">
        <CardContent className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
          <InputGroup className="h-9 sm:max-w-sm">
            <InputGroupAddon>
              <Search className="size-4" />
            </InputGroupAddon>
            <InputGroupInput
              value={search}
              placeholder="Search Therapists…"
              aria-label="Search Therapists"
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </InputGroup>
          <select
            className="border-input bg-background h-9 rounded-md border px-3 text-sm"
            value={status ?? 'all'}
            aria-label="Filter by status"
            onChange={(event) => {
              setStatus(
                event.target.value === 'all'
                  ? undefined
                  : (event.target.value as 'active' | 'inactive')
              );
              setPage(1);
            }}
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          {canCreate ? (
            <Button className="sm:ml-auto" onClick={() => void setTherapistParam('new')}>
              <Plus className="size-4" />
              Add Therapist
            </Button>
          ) : null}
        </CardContent>
      </Card>

      {list.isError ? (
        <Alert variant="destructive">
          <AlertTitle>Could not load Therapists</AlertTitle>
          <AlertDescription>{getApiErrorMessage(list.error)}</AlertDescription>
        </Alert>
      ) : null}
      {list.isLoading ? (
        <Card className="shadow-fluent-2">
          <CardContent className="space-y-3 p-4">
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className="bg-muted h-10 animate-pulse rounded" />
            ))}
          </CardContent>
        </Card>
      ) : therapists.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <UserRound />
            </EmptyMedia>
            <EmptyTitle>No Therapists yet</EmptyTitle>
            <EmptyDescription>
              Create a Therapist to assign Ayurvedic Treatment Sessions.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            {canCreate ? (
              <Button onClick={() => void setTherapistParam('new')}>
                <Plus className="size-4" />
                Add Therapist
              </Button>
            ) : null}
          </EmptyContent>
        </Empty>
      ) : (
        <Card className="shadow-fluent-2">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table className="min-w-[900px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">Therapist</TableHead>
                    <TableHead>Skills</TableHead>
                    <TableHead>Staff code</TableHead>
                    <TableHead>Registration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="pr-4 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {therapists.map((therapist) => (
                    <TableRow key={therapist.id}>
                      <TableCell className="pl-4">
                        <p className="font-medium">{therapist.name}</p>
                        <p className="text-muted-foreground text-xs">{therapist.email}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {therapist.skills.length > 0 ? (
                            therapist.skills.map((skill) => (
                              <Badge key={skill.id} variant="secondary">
                                {skill.name}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-muted-foreground">No skills</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{therapist.staffCode ?? '—'}</TableCell>
                      <TableCell>{therapist.registrationNumber ?? '—'}</TableCell>
                      <TableCell>
                        <Badge variant={therapist.isActive ? 'default' : 'outline'}>
                          {therapist.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="pr-4 text-right">
                        <TherapistActionsMenu
                          therapist={therapist}
                          canEdit={Boolean(canUpdate)}
                          canDeactivate={Boolean(canDeactivate)}
                          canReactivate={Boolean(canReactivate)}
                          onEdit={(item) => void setTherapistParam(String(item.id))}
                          onStatusAction={toggleStatus}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
      <div className="flex items-center justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => setPage((value) => value - 1)}
        >
          Previous
        </Button>
        <span className="text-muted-foreground text-sm">Page {page}</span>
        <Button
          variant="outline"
          size="sm"
          disabled={!list.data?.meta || page >= list.data.meta.totalPages}
          onClick={() => setPage((value) => value + 1)}
        >
          Next
        </Button>
      </div>

      <TherapistFormSheet
        open={isOpen}
        therapist={therapistParam === 'new' ? null : selected}
        onClose={() => void setTherapistParam(null)}
      />
    </div>
  );
}
