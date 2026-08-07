import { Flag, MoreVertical, Pencil, Trash2 } from 'lucide-react';

import type { Nationality } from '@/app/queries/global-references/nationalities/useNationalities';
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

function hasCode(record: Nationality): record is Nationality & { code: string } {
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

function NationalityIcon() {
  return (
    <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-full">
      <Flag className="size-5" />
    </div>
  );
}

function NationalityActionsMenu({
  nationality,
  onEdit,
  onDelete,
}: {
  nationality: Nationality;
  onEdit: (nationality: Nationality) => void;
  onDelete: (nationality: Nationality) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Actions for ${nationality.name}`}
        >
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={() => onEdit(nationality)}>
          <Pencil className="size-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onClick={() => onDelete(nationality)}>
          <Trash2 className="size-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function NationalityTableView({
  nationalities,
  onEdit,
  onDelete,
}: {
  nationalities: Nationality[];
  onEdit: (nationality: Nationality) => void;
  onDelete: (nationality: Nationality) => void;
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
              {nationalities.map((nationality) => (
                <TableRow key={nationality.id}>
                  <TableCell className="pl-4 font-medium">{nationality.name}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {hasCode(nationality) ? nationality.code : '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatModifiedOn(nationality.modifiedOn)}
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    <NationalityActionsMenu
                      nationality={nationality}
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

export function NationalityCardView({
  nationalities,
  onEdit,
  onDelete,
}: {
  nationalities: Nationality[];
  onEdit: (nationality: Nationality) => void;
  onDelete: (nationality: Nationality) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {nationalities.map((nationality) => (
        <Card key={nationality.id} className="shadow-fluent-2">
          <CardContent className="space-y-3 p-4">
            <NationalityIcon />

            <div>
              <h3 className="font-heading text-base font-semibold">{nationality.name}</h3>
              <p className="text-muted-foreground mt-0.5 text-sm">
                Code:{' '}
                <span className="font-mono">{hasCode(nationality) ? nationality.code : '—'}</span>
              </p>
              <p className="text-muted-foreground mt-0.5 text-sm">
                Modified on: <span>{formatModifiedOn(nationality.modifiedOn)}</span>
              </p>
            </div>

            <div className="flex gap-2 border-t pt-3">
              <Button type="button" variant="ghost" size="sm" onClick={() => onEdit(nationality)}>
                <Pencil className="size-3.5" />
                Edit
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onDelete(nationality)}
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

export function NationalityListView({
  nationalities,
  onEdit,
  onDelete,
}: {
  nationalities: Nationality[];
  onEdit: (nationality: Nationality) => void;
  onDelete: (nationality: Nationality) => void;
}) {
  return (
    <div className="space-y-3">
      {nationalities.map((nationality) => (
        <Card key={nationality.id} className="shadow-fluent-2">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <NationalityIcon />
              <h3 className="font-heading truncate text-base font-semibold">{nationality.name}</h3>
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-1 pl-13 text-sm sm:flex-row sm:items-center sm:gap-6 sm:pl-0">
              <div>
                <span className="text-muted-foreground">Code: </span>
                <span className="font-mono">{hasCode(nationality) ? nationality.code : '—'}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Modified on: </span>
                <span>{formatModifiedOn(nationality.modifiedOn)}</span>
              </div>
            </div>

            <div className="shrink-0 pl-13 sm:pl-0">
              <NationalityActionsMenu
                nationality={nationality}
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
