import { ClipboardList, MoreVertical, Pencil, Trash2, } from 'lucide-react';
import type { AppointmentMode } from '@/app/api/lib/modules/appointment-mode/schemas/appointment-mode-schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from '@/components/ui/table';

function ModeIcon() {
  return (
    <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-full">
      <ClipboardList className="size-5" />
    </div>
  );
}

function ModeActionsMenu({
  mode,
  onEdit,
  onDelete,
}: {
  mode: AppointmentMode;
  onEdit: (mode: AppointmentMode) => void;
  onDelete: (mode: AppointmentMode) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Actions for ${mode.name}`}
        >
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={() => onEdit(mode)}>
          <Pencil className="size-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          onClick={() => onDelete(mode)}
        >
          <Trash2 className="size-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ModeTableView({
  modes,
  onEdit,
  onDelete,
}: {
  modes: AppointmentMode[];
  onEdit: (mode: AppointmentMode) => void;
  onDelete: (mode: AppointmentMode) => void;
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
              {modes.map((mode) => (
                <TableRow key={mode.id}>
                  <TableCell className="pl-4 font-medium">{mode.name}</TableCell>
                  <TableCell className="font-mono text-xs">{mode.code}</TableCell>
                  <TableCell className="text-muted-foreground max-w-xs truncate">
                    {mode.description || '—'}
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    <ModeActionsMenu mode={mode} onEdit={onEdit} onDelete={onDelete} />
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

export function ModeCardView({
  modes,
  onEdit,
  onDelete,
}: {
  modes: AppointmentMode[];
  onEdit: (mode: AppointmentMode) => void;
  onDelete: (mode: AppointmentMode) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {modes.map((mode) => (
        <Card key={mode.id} className="shadow-fluent-2">
          <CardContent className="space-y-3 p-4">
            <ModeIcon />

            <div>
              <h3 className="font-heading text-base font-semibold">{mode.name}</h3>
              <p className="text-muted-foreground mt-0.5 text-sm">
                Appointment Mode Code:{' '}
                <span className="font-mono">{mode.code}</span>
              </p>
              <p className="text-muted-foreground mt-0.5 text-sm">
                Appointment Mode Description:{' '}
                <span>{mode.description || '—'}</span>
              </p>
            </div>

            <div className="flex gap-2 border-t pt-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onEdit(mode)}
              >
                <Pencil className="size-3.5" />
                Edit
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onDelete(mode)}
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

export function ModeListView({
  modes,
  onEdit,
  onDelete,
}: {
  modes: AppointmentMode[];
  onEdit: (mode: AppointmentMode) => void;
  onDelete: (mode: AppointmentMode) => void;
}) {
  return (
    <div className="space-y-3">
      {modes.map((mode) => (
        <Card key={mode.id} className="shadow-fluent-2">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <ModeIcon />
              <div className="min-w-0">
                <h3 className="font-heading text-base font-semibold">{mode.name}</h3>
              </div>
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-1 pl-13 text-sm sm:flex-row sm:items-center sm:gap-6 sm:pl-0">
              <div>
                <span className="text-muted-foreground">Appointment Mode Code: </span>
                <span className="font-mono">{mode.code}</span>
              </div>
              <div className="min-w-0">
                <span className="text-muted-foreground">Appointment Mode Description: </span>
                <span className="truncate">{mode.description || '—'}</span>
              </div>
            </div>

            <div className="shrink-0 pl-13 sm:pl-0">
              <ModeActionsMenu mode={mode} onEdit={onEdit} onDelete={onDelete} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
