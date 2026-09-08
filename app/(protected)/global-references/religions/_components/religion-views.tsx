import { Landmark, MoreVertical, Pencil, Trash2 } from 'lucide-react';

import type { Religion } from '@/app/queries/global-references/religions/useReligions';
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

function hasCode(record: Religion): record is Religion & { code: string } {
  return 'code' in record;
}

function formatModifiedOn(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return new Intl.DateTimeFormat('en', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function ReligionIcon() {
  return (
    <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-full">
      <Landmark className="size-5" />
    </div>
  );
}

function ReligionActionsMenu({
  religion,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: {
  religion: Religion;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (religion: Religion) => void;
  onDelete: (religion: Religion) => void;
}) {
  if (!canEdit && !canDelete) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Actions for ${religion.name}`}
        >
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {canEdit ? (
          <DropdownMenuItem onClick={() => onEdit(religion)}>
            <Pencil className="size-4" />
            Edit
          </DropdownMenuItem>
        ) : null}
        {canDelete ? (
          <DropdownMenuItem variant="destructive" onClick={() => onDelete(religion)}>
            <Trash2 className="size-4" />
            Delete
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ReligionTableView({
  religions,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: {
  religions: Religion[];
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (religion: Religion) => void;
  onDelete: (religion: Religion) => void;
}) {
  return (
    <Card className="shadow-fluent-2">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table className="min-w-[680px]">
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Modified on</TableHead>
                <TableHead className="pr-4 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {religions.map((religion) => (
                <TableRow key={religion.id}>
                  <TableCell className="pl-4 font-medium">{religion.name}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {hasCode(religion) ? religion.code : '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatModifiedOn(religion.modifiedOn)}
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    <ReligionActionsMenu
                      religion={religion}
                      canEdit={canEdit}
                      canDelete={canDelete}
                      onEdit={onEdit}
                      onDelete={onDelete}
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

export function ReligionCardView({
  religions,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: {
  religions: Religion[];
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (religion: Religion) => void;
  onDelete: (religion: Religion) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {religions.map((religion) => (
        <Card key={religion.id} className="shadow-fluent-2">
          <CardContent className="space-y-3 p-4">
            <ReligionIcon />

            <div>
              <h3 className="font-heading text-base font-semibold">{religion.name}</h3>
              <p className="text-muted-foreground mt-0.5 text-sm">
                Code: <span className="font-mono">{hasCode(religion) ? religion.code : '—'}</span>
              </p>
              <p className="text-muted-foreground mt-0.5 text-sm">
                Modified on: <span>{formatModifiedOn(religion.modifiedOn)}</span>
              </p>
            </div>

            {canEdit || canDelete ? (
              <div className="flex gap-2 border-t pt-3">
                {canEdit ? (
                  <Button type="button" variant="ghost" size="sm" onClick={() => onEdit(religion)}>
                    <Pencil className="size-3.5" />
                    Edit
                  </Button>
                ) : null}
                {canDelete ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(religion)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                    Delete
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

export function ReligionListView({
  religions,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: {
  religions: Religion[];
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (religion: Religion) => void;
  onDelete: (religion: Religion) => void;
}) {
  return (
    <div className="space-y-3">
      {religions.map((religion) => (
        <Card key={religion.id} className="shadow-fluent-2">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <ReligionIcon />
              <h3 className="font-heading truncate text-base font-semibold">{religion.name}</h3>
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-1 pl-13 text-sm sm:flex-row sm:items-center sm:gap-6 sm:pl-0">
              <div>
                <span className="text-muted-foreground">Code: </span>
                <span className="font-mono">{hasCode(religion) ? religion.code : '—'}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Modified on: </span>
                <span>{formatModifiedOn(religion.modifiedOn)}</span>
              </div>
            </div>

            <div className="shrink-0 pl-13 sm:pl-0">
              <ReligionActionsMenu
                religion={religion}
                canEdit={canEdit}
                canDelete={canDelete}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
