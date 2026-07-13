import { Clock3, MoreVertical, Pencil, Trash2 } from 'lucide-react';

import type { DoctorRota } from '@/app/api/lib/modules/doctor-rota/schemas/doctor-rota-schema';
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

function formatTimeWindow(rota: DoctorRota) {
  return `${rota.fromTime} - ${rota.toTime}`;
}

function DoctorRotaIcon() {
  return (
    <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-full">
      <Clock3 className="size-5" />
    </div>
  );
}

function DoctorRotaStatus({ rota }: { rota: DoctorRota }) {
  return (
    <Badge variant="outline" className="bg-muted/70">
      {rota.isActive ? 'Active' : 'Inactive'}
    </Badge>
  );
}

function DoctorRotaActionsMenu({
  rota,
  onEdit,
  onDelete,
}: {
  rota: DoctorRota;
  onEdit: (rota: DoctorRota) => void;
  onDelete: (rota: DoctorRota) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Actions for ${rota.name}`}
        >
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={() => onEdit(rota)}>
          <Pencil className="size-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onClick={() => onDelete(rota)}>
          <Trash2 className="size-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function DoctorRotaTableView({
  rotas,
  onEdit,
  onDelete,
}: {
  rotas: DoctorRota[];
  onEdit: (rota: DoctorRota) => void;
  onDelete: (rota: DoctorRota) => void;
}) {
  return (
    <Card className="shadow-fluent-2">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table className="min-w-[600px]">
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Name</TableHead>
                <TableHead>Time window</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-4 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rotas.map((rota) => (
                <TableRow key={rota.id}>
                  <TableCell className="pl-4 font-medium">{rota.name}</TableCell>
                  <TableCell className="font-mono text-xs">{formatTimeWindow(rota)}</TableCell>
                  <TableCell>
                    <DoctorRotaStatus rota={rota} />
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    <DoctorRotaActionsMenu rota={rota} onEdit={onEdit} onDelete={onDelete} />
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

export function DoctorRotaCardView({
  rotas,
  onEdit,
  onDelete,
}: {
  rotas: DoctorRota[];
  onEdit: (rota: DoctorRota) => void;
  onDelete: (rota: DoctorRota) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {rotas.map((rota) => (
        <Card key={rota.id} className="shadow-fluent-2">
          <CardContent className="space-y-3 p-4">
            <DoctorRotaIcon />

            <div>
              <h3 className="font-heading text-base font-semibold">{rota.name}</h3>
              <p className="text-muted-foreground mt-0.5 text-sm">
                Time window: <span className="font-mono">{formatTimeWindow(rota)}</span>
              </p>
              <div className="mt-2">
                <DoctorRotaStatus rota={rota} />
              </div>
            </div>

            <div className="flex gap-2 border-t pt-3">
              <Button type="button" variant="ghost" size="sm" onClick={() => onEdit(rota)}>
                <Pencil className="size-3.5" />
                Edit
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onDelete(rota)}
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

export function DoctorRotaListView({
  rotas,
  onEdit,
  onDelete,
}: {
  rotas: DoctorRota[];
  onEdit: (rota: DoctorRota) => void;
  onDelete: (rota: DoctorRota) => void;
}) {
  return (
    <div className="space-y-3">
      {rotas.map((rota) => (
        <Card key={rota.id} className="shadow-fluent-2">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <DoctorRotaIcon />
              <div className="min-w-0">
                <h3 className="font-heading text-base font-semibold">{rota.name}</h3>
              </div>
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-2 pl-13 text-sm sm:flex-row sm:items-center sm:gap-6 sm:pl-0">
              <div>
                <span className="text-muted-foreground">Time window: </span>
                <span className="font-mono">{formatTimeWindow(rota)}</span>
              </div>
              <DoctorRotaStatus rota={rota} />
            </div>

            <div className="shrink-0 pl-13 sm:pl-0">
              <DoctorRotaActionsMenu rota={rota} onEdit={onEdit} onDelete={onDelete} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
