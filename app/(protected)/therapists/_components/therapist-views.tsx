import { CircleOff, MoreVertical, Pencil, RotateCcw, UserRound } from 'lucide-react';

import type { Therapist } from '@/app/api/lib/modules/therapist/schemas/therapist-schema';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export type TherapistStatusAction = 'deactivate' | 'reactivate';

type TherapistViewProps = {
  therapists: Therapist[];
  canEdit: boolean;
  canDeactivate: boolean;
  canReactivate: boolean;
  onEdit: (therapist: Therapist) => void;
  onStatusAction: (therapist: Therapist, action: TherapistStatusAction) => void;
};

function TherapistStatusBadge({ therapist }: { therapist: Therapist }) {
  return (
    <Badge variant={therapist.isActive ? 'default' : 'outline'}>
      {therapist.isActive ? 'Active' : 'Inactive'}
    </Badge>
  );
}

function TherapistSkills({ therapist }: { therapist: Therapist }) {
  return (
    <div className="flex flex-wrap gap-1">
      {therapist.skills.length > 0 ? (
        therapist.skills.map((skill) => (
          <Badge key={skill.id} variant="secondary">
            {skill.name}
          </Badge>
        ))
      ) : (
        <span className="text-muted-foreground text-sm">No skills</span>
      )}
    </div>
  );
}

function TherapistAvatar() {
  return (
    <div className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-full">
      <UserRound className="size-5" />
    </div>
  );
}

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
  onStatusAction: (therapist: Therapist, action: TherapistStatusAction) => void;
}) {
  const statusAction = therapist.isActive ? 'deactivate' : 'reactivate';
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
            onClick={() => onStatusAction(therapist, statusAction)}
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

export function TherapistTableView({
  therapists,
  canEdit,
  canDeactivate,
  canReactivate,
  onEdit,
  onStatusAction,
}: TherapistViewProps) {
  return (
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
                    <TherapistSkills therapist={therapist} />
                  </TableCell>
                  <TableCell>{therapist.staffCode ?? '—'}</TableCell>
                  <TableCell>{therapist.registrationNumber ?? '—'}</TableCell>
                  <TableCell>
                    <TherapistStatusBadge therapist={therapist} />
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    <TherapistActionsMenu
                      therapist={therapist}
                      canEdit={canEdit}
                      canDeactivate={canDeactivate}
                      canReactivate={canReactivate}
                      onEdit={onEdit}
                      onStatusAction={onStatusAction}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

export function TherapistCardView({
  therapists,
  canEdit,
  canDeactivate,
  canReactivate,
  onEdit,
  onStatusAction,
}: TherapistViewProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {therapists.map((therapist) => (
        <Card key={therapist.id} className="shadow-fluent-2">
          <CardContent className="space-y-3 p-4">
            <div className="flex items-start justify-between gap-2">
              <TherapistAvatar />
              <TherapistStatusBadge therapist={therapist} />
            </div>

            <div className="space-y-1">
              <h3 className="font-heading text-base font-semibold">{therapist.name}</h3>
              <p className="text-muted-foreground text-sm">{therapist.email}</p>
              <p className="text-muted-foreground text-sm">
                Staff code: {therapist.staffCode ?? '—'}
              </p>
              <p className="text-muted-foreground text-sm">
                Registration: {therapist.registrationNumber ?? '—'}
              </p>
            </div>

            <TherapistSkills therapist={therapist} />

            {canEdit || (therapist.isActive ? canDeactivate : canReactivate) ? (
              <div className="flex flex-wrap gap-2 border-t pt-3">
                {canEdit ? (
                  <Button type="button" variant="ghost" size="sm" onClick={() => onEdit(therapist)}>
                    <Pencil className="size-3.5" />
                    Edit
                  </Button>
                ) : null}
                {(therapist.isActive ? canDeactivate : canReactivate) ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className={
                      therapist.isActive ? 'text-destructive hover:text-destructive' : undefined
                    }
                    onClick={() =>
                      onStatusAction(therapist, therapist.isActive ? 'deactivate' : 'reactivate')
                    }
                  >
                    {therapist.isActive ? (
                      <CircleOff className="size-3.5" />
                    ) : (
                      <RotateCcw className="size-3.5" />
                    )}
                    {therapist.isActive ? 'Deactivate' : 'Reactivate'}
                  </Button>
                ) : null}
              </div>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function TherapistListView({
  therapists,
  canEdit,
  canDeactivate,
  canReactivate,
  onEdit,
  onStatusAction,
}: TherapistViewProps) {
  return (
    <div className="space-y-3">
      {therapists.map((therapist) => (
        <Card key={therapist.id} className="shadow-fluent-2">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex min-w-0 items-center gap-3 sm:w-64 sm:shrink-0">
              <TherapistAvatar />
              <div className="min-w-0">
                <h3 className="font-heading truncate text-base font-semibold">{therapist.name}</h3>
                <p className="text-muted-foreground truncate text-sm">{therapist.email}</p>
              </div>
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-2 pl-14 text-sm sm:flex-row sm:items-center sm:gap-6 sm:pl-0">
              <div className="min-w-0 sm:flex-1">
                <TherapistSkills therapist={therapist} />
              </div>
              <span className="text-muted-foreground truncate">{therapist.staffCode ?? '—'}</span>
              <TherapistStatusBadge therapist={therapist} />
            </div>

            <div className="shrink-0 pl-14 sm:pl-0">
              <TherapistActionsMenu
                therapist={therapist}
                canEdit={canEdit}
                canDeactivate={canDeactivate}
                canReactivate={canReactivate}
                onEdit={onEdit}
                onStatusAction={onStatusAction}
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
