import { ClipboardList, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import type { AppointmentReason } from '@/app/api/lib/modules/appointment-reason/schemas/appointment-reason-schema';
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

function ReasonIcon() {
  return (
    <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-full">
      <ClipboardList className="size-5" />
    </div>
  );
}

function ReasonActionsMenu({
  reason,
  onEdit,
  onDelete,
}: {
  reason: AppointmentReason;
  onEdit: (reason: AppointmentReason) => void;
  onDelete: (reason: AppointmentReason) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Actions for ${reason.name}`}
        >
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={() => onEdit(reason)}>
          <Pencil className="size-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onClick={() => onDelete(reason)}>
          <Trash2 className="size-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ReasonTableView({
  reasons,
  onEdit,
  onDelete,
}: {
  reasons: AppointmentReason[];
  onEdit: (reason: AppointmentReason) => void;
  onDelete: (reason: AppointmentReason) => void;
}) {
  return (
    <Card className="shadow-fluent-2">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table className="min-w-[600px]">
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="pr-4 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reasons.map((reason) => (
                <TableRow key={reason.id}>
                  <TableCell className="pl-4 font-medium">{reason.name}</TableCell>
                  <TableCell className="font-mono text-xs">{reason.code}</TableCell>
                  <TableCell className="text-muted-foreground max-w-xs truncate">
                    {reason.description || '—'}
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    <ReasonActionsMenu reason={reason} onEdit={onEdit} onDelete={onDelete} />
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

export function ReasonCardView({
  reasons,
  onEdit,
  onDelete,
}: {
  reasons: AppointmentReason[];
  onEdit: (reason: AppointmentReason) => void;
  onDelete: (reason: AppointmentReason) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {reasons.map((reason) => (
        <Card key={reason.id} className="shadow-fluent-2">
          <CardContent className="space-y-3 p-4">
            <ReasonIcon />

            <div>
              <h3 className="font-heading text-base font-semibold">{reason.name}</h3>
              <p className="text-muted-foreground mt-0.5 text-sm">
                Appointment Reason Code: <span className="font-mono">{reason.code}</span>
              </p>
              <p className="text-muted-foreground mt-0.5 text-sm">
                Appointment Reason Description: <span>{reason.description || '—'}</span>
              </p>
            </div>

            <div className="flex gap-2 border-t pt-3">
              <Button type="button" variant="ghost" size="sm" onClick={() => onEdit(reason)}>
                <Pencil className="size-3.5" />
                Edit
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onDelete(reason)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="size-3.5" />
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function ReasonListView({
  reasons,
  onEdit,
  onDelete,
}: {
  reasons: AppointmentReason[];
  onEdit: (reason: AppointmentReason) => void;
  onDelete: (reason: AppointmentReason) => void;
}) {
  return (
    <div className="space-y-3">
      {reasons.map((reason) => (
        <Card key={reason.id} className="shadow-fluent-2">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <ReasonIcon />
              <div className="min-w-0">
                <h3 className="font-heading text-base font-semibold">{reason.name}</h3>
              </div>
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-1 pl-13 text-sm sm:flex-row sm:items-center sm:gap-6 sm:pl-0">
              <div>
                <span className="text-muted-foreground">Appointment Reason Code: </span>
                <span className="font-mono">{reason.code}</span>
              </div>
              <div className="min-w-0">
                <span className="text-muted-foreground">Appointment Reason Description: </span>
                <span className="truncate">{reason.description || '—'}</span>
              </div>
            </div>

            <div className="shrink-0 pl-13 sm:pl-0">
              <ReasonActionsMenu reason={reason} onEdit={onEdit} onDelete={onDelete} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
