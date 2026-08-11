import { Globe2, MoreVertical, Pencil, Trash2 } from 'lucide-react';

import type { Country } from '@/app/queries/global-references/countries/useCountries';
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

function hasCode(record: Country): record is Country & { code: string } {
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

function CountryIcon() {
  return (
    <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-full">
      <Globe2 className="size-5" />
    </div>
  );
}

function CountryActionsMenu({
  country,
  onEdit,
  onDelete,
}: {
  country: Country;
  onEdit: (country: Country) => void;
  onDelete: (country: Country) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Actions for ${country.name}`}
        >
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={() => onEdit(country)}>
          <Pencil className="size-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onClick={() => onDelete(country)}>
          <Trash2 className="size-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function CountryTableView({
  countries,
  onEdit,
  onDelete,
}: {
  countries: Country[];
  onEdit: (country: Country) => void;
  onDelete: (country: Country) => void;
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
              {countries.map((country) => (
                <TableRow key={country.id}>
                  <TableCell className="pl-4 font-medium">{country.name}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {hasCode(country) ? country.code : '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatModifiedOn(country.modifiedOn)}
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    <CountryActionsMenu country={country} onEdit={onEdit} onDelete={onDelete} />
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

export function CountryCardView({
  countries,
  onEdit,
  onDelete,
}: {
  countries: Country[];
  onEdit: (country: Country) => void;
  onDelete: (country: Country) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {countries.map((country) => (
        <Card key={country.id} className="shadow-fluent-2">
          <CardContent className="space-y-3 p-4">
            <CountryIcon />

            <div>
              <h3 className="font-heading text-base font-semibold">{country.name}</h3>
              <p className="text-muted-foreground mt-0.5 text-sm">
                Code: <span className="font-mono">{hasCode(country) ? country.code : '—'}</span>
              </p>
              <p className="text-muted-foreground mt-0.5 text-sm">
                Modified on: <span>{formatModifiedOn(country.modifiedOn)}</span>
              </p>
            </div>

            <div className="flex gap-2 border-t pt-3">
              <Button type="button" variant="ghost" size="sm" onClick={() => onEdit(country)}>
                <Pencil className="size-3.5" />
                Edit
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onDelete(country)}
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

export function CountryListView({
  countries,
  onEdit,
  onDelete,
}: {
  countries: Country[];
  onEdit: (country: Country) => void;
  onDelete: (country: Country) => void;
}) {
  return (
    <div className="space-y-3">
      {countries.map((country) => (
        <Card key={country.id} className="shadow-fluent-2">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <CountryIcon />
              <h3 className="font-heading truncate text-base font-semibold">{country.name}</h3>
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-1 pl-13 text-sm sm:flex-row sm:items-center sm:gap-6 sm:pl-0">
              <div>
                <span className="text-muted-foreground">Code: </span>
                <span className="font-mono">{hasCode(country) ? country.code : '—'}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Modified on: </span>
                <span>{formatModifiedOn(country.modifiedOn)}</span>
              </div>
            </div>

            <div className="shrink-0 pl-13 sm:pl-0">
              <CountryActionsMenu country={country} onEdit={onEdit} onDelete={onDelete} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
