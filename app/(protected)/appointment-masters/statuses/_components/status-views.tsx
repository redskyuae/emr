import { ClipboardList, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import type { AppointmentStatus } from '@/app/api/lib/modules/appointment-status/schemas/appointment-status-schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from '@/components/ui/table';

function StatusIcon() {
  return (
    <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-full">
      <ClipboardList className="size-5" />
    </div>
  );
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function StatusActionsMenu({
  status,
  onEdit,
  onDelete,
}: {
  status: AppointmentStatus;
  onEdit: (status: AppointmentStatus) => void;
  onDelete: (status: AppointmentStatus) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Actions for ${status.name}`}
        >
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={() => onEdit(status)}>
          <Pencil className="size-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onClick={() => onDelete(status)}>
          <Trash2 className="size-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function StatusTableView({
  statuses,
  onEdit,
  onDelete,
}: {
  statuses: AppointmentStatus[];
  onEdit: (status: AppointmentStatus) => void;
  onDelete: (status: AppointmentStatus) => void;
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
                <TableHead>Modified on</TableHead>
                <TableHead className="pr-4 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {statuses.map((status) => (
                <TableRow key={status.id}>
                  <TableCell className="pl-4 font-medium">{status.name}</TableCell>
                  <TableCell className="font-mono text-xs">{status.code}</TableCell>
                  <TableCell className="text-muted-foreground max-w-xs truncate">
                    {status.description || '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(status.modifiedOn)}
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    <StatusActionsMenu status={status} onEdit={onEdit} onDelete={onDelete} />
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

export function StatusCardView({
  statuses,
  onEdit,
  onDelete,
}: {
  statuses: AppointmentStatus[];
  onEdit: (status: AppointmentStatus) => void;
  onDelete: (status: AppointmentStatus) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {statuses.map((status) => (
        <Card key={status.id} className="shadow-fluent-2">
          <CardContent className="space-y-3 p-4">
            <StatusIcon />

            <div>
              <h3 className="font-heading text-base font-semibold">{status.name}</h3>
              <p className="text-muted-foreground mt-0.5 text-sm">
                Appointment Status Code: <span className="font-mono">{status.code}</span>
              </p>
              <p className="text-muted-foreground mt-0.5 text-sm">
                Appointment Status Description: <span>{status.description || '—'}</span>
              </p>
              <p className="text-muted-foreground mt-0.5 text-sm">
                Modified on: <span>{formatDate(status.modifiedOn)}</span>
              </p>
            </div>

            <div className="flex gap-2 border-t pt-3">
              <Button type="button" variant="ghost" size="sm" onClick={() => onEdit(status)}>
                <Pencil className="size-3.5" />
                Edit
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onDelete(status)}
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

export function StatusListView({
  statuses,
  onEdit,
  onDelete,
}: {
  statuses: AppointmentStatus[];
  onEdit: (status: AppointmentStatus) => void;
  onDelete: (status: AppointmentStatus) => void;
}) {
  return (
    <div className="space-y-3">
      {statuses.map((status) => (
        <Card key={status.id} className="shadow-fluent-2">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <StatusIcon />
              <div className="min-w-0">
                <h3 className="font-heading text-base font-semibold">{status.name}</h3>
              </div>
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-1 pl-13 text-sm sm:flex-row sm:items-center sm:gap-6 sm:pl-0">
              <div>
                <span className="text-muted-foreground">Appointment Status Code: </span>
                <span className="font-mono">{status.code}</span>
              </div>
              <div className="min-w-0">
                <span className="text-muted-foreground">Appointment Status Description: </span>
                <span className="truncate">{status.description || '—'}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Modified on: </span>
                <span>{formatDate(status.modifiedOn)}</span>
              </div>
            </div>

            <div className="shrink-0 pl-13 sm:pl-0">
              <StatusActionsMenu status={status} onEdit={onEdit} onDelete={onDelete} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
