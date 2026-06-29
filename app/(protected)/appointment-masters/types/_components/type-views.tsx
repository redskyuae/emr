import { ClipboardList, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import type { AppointmentType } from '@/app/api/lib/modules/appointment-type/schemas/appointment-type-schema';
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

function TypeIcon() {
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

function TypeActionsMenu({
  type,
  onEdit,
  onDelete,
}: {
  type: AppointmentType;
  onEdit: (type: AppointmentType) => void;
  onDelete: (type: AppointmentType) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Actions for ${type.name}`}
        >
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={() => onEdit(type)}>
          <Pencil className="size-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onClick={() => onDelete(type)}>
          <Trash2 className="size-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function TypeTableView({
  types,
  onEdit,
  onDelete,
}: {
  types: AppointmentType[];
  onEdit: (type: AppointmentType) => void;
  onDelete: (type: AppointmentType) => void;
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
              {types.map((type) => (
                <TableRow key={type.id}>
                  <TableCell className="pl-4 font-medium">{type.name}</TableCell>
                  <TableCell className="font-mono text-xs">{type.code}</TableCell>
                  <TableCell className="text-muted-foreground max-w-xs truncate">
                    {type.description || '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(type.modifiedOn)}
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    <TypeActionsMenu type={type} onEdit={onEdit} onDelete={onDelete} />
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

export function TypeCardView({
  types,
  onEdit,
  onDelete,
}: {
  types: AppointmentType[];
  onEdit: (type: AppointmentType) => void;
  onDelete: (type: AppointmentType) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {types.map((type) => (
        <Card key={type.id} className="shadow-fluent-2">
          <CardContent className="space-y-3 p-4">
            <TypeIcon />

            <div>
              <h3 className="font-heading text-base font-semibold">{type.name}</h3>
              <p className="text-muted-foreground mt-0.5 text-sm">
                Appointment Type Code: <span className="font-mono">{type.code}</span>
              </p>
              <p className="text-muted-foreground mt-0.5 text-sm">
                Appointment Type Description: <span>{type.description || '—'}</span>
              </p>
              <p className="text-muted-foreground mt-0.5 text-sm">
                Modified on: <span>{formatDate(type.modifiedOn)}</span>
              </p>
            </div>

            <div className="flex gap-2 border-t pt-3">
              <Button type="button" variant="ghost" size="sm" onClick={() => onEdit(type)}>
                <Pencil className="size-3.5" />
                Edit
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onDelete(type)}
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

export function TypeListView({
  types,
  onEdit,
  onDelete,
}: {
  types: AppointmentType[];
  onEdit: (type: AppointmentType) => void;
  onDelete: (type: AppointmentType) => void;
}) {
  return (
    <div className="space-y-3">
      {types.map((type) => (
        <Card key={type.id} className="shadow-fluent-2">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <TypeIcon />
              <div className="min-w-0">
                <h3 className="font-heading text-base font-semibold">{type.name}</h3>
              </div>
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-1 pl-13 text-sm sm:flex-row sm:items-center sm:gap-6 sm:pl-0">
              <div>
                <span className="text-muted-foreground">Appointment Type Code: </span>
                <span className="font-mono">{type.code}</span>
              </div>
              <div className="min-w-0">
                <span className="text-muted-foreground">Appointment Type Description: </span>
                <span className="truncate">{type.description || '—'}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Modified on: </span>
                <span>{formatDate(type.modifiedOn)}</span>
              </div>
            </div>

            <div className="shrink-0 pl-13 sm:pl-0">
              <TypeActionsMenu type={type} onEdit={onEdit} onDelete={onDelete} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
