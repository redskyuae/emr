import {
  Flag,
  Globe2,
  Landmark,
  Languages,
  MapPinned,
  MoreVertical,
  Pencil,
  Trash2,
} from 'lucide-react';

import type {
  GlobalReferenceEntity,
  GlobalReferenceResource,
} from '@/app/queries/global-references/useGlobalReferencesManagement';
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
import type { GlobalReferenceScreenConfig } from './global-reference-config';

function hasCode(
  record: GlobalReferenceEntity
): record is GlobalReferenceEntity & { code: string } {
  return 'code' in record;
}

function hasCountry(
  record: GlobalReferenceEntity
): record is GlobalReferenceEntity & { country: { name: string; code: string } } {
  return 'country' in record;
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

function ReferenceIcon({ resource }: { resource: GlobalReferenceResource }) {
  return (
    <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-full">
      {resource === 'languages' ? <Languages className="size-5" /> : null}
      {resource === 'nationalities' ? <Flag className="size-5" /> : null}
      {resource === 'religions' ? <Landmark className="size-5" /> : null}
      {resource === 'countries' ? <Globe2 className="size-5" /> : null}
      {resource === 'states' ? <MapPinned className="size-5" /> : null}
    </div>
  );
}

function ReferenceActionsMenu({
  record,
  onEdit,
  onDelete,
}: {
  record: GlobalReferenceEntity;
  onEdit: (record: GlobalReferenceEntity) => void;
  onDelete: (record: GlobalReferenceEntity) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Actions for ${record.name}`}
        >
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={() => onEdit(record)}>
          <Pencil className="size-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onClick={() => onDelete(record)}>
          <Trash2 className="size-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function GlobalReferenceTableView({
  records,
  config,
  onEdit,
  onDelete,
}: {
  records: GlobalReferenceEntity[];
  config: GlobalReferenceScreenConfig;
  onEdit: (record: GlobalReferenceEntity) => void;
  onDelete: (record: GlobalReferenceEntity) => void;
}) {
  return (
    <Card className="shadow-fluent-2">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table className="min-w-[680px]">
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Name</TableHead>
                {config.hasCode ? <TableHead>Code</TableHead> : null}
                {config.hasCountry ? <TableHead>Country</TableHead> : null}
                <TableHead>Modified on</TableHead>
                <TableHead className="pr-4 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="pl-4 font-medium">{record.name}</TableCell>
                  {config.hasCode ? (
                    <TableCell className="font-mono text-xs">
                      {hasCode(record) ? record.code : '—'}
                    </TableCell>
                  ) : null}
                  {config.hasCountry ? (
                    <TableCell>
                      {hasCountry(record) ? (
                        <>
                          {record.country.name}{' '}
                          <span className="text-muted-foreground font-mono text-xs">
                            {record.country.code}
                          </span>
                        </>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                  ) : null}
                  <TableCell className="text-muted-foreground">
                    {formatModifiedOn(record.modifiedOn)}
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    <ReferenceActionsMenu record={record} onEdit={onEdit} onDelete={onDelete} />
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

export function GlobalReferenceCardView({
  records,
  config,
  onEdit,
  onDelete,
}: {
  records: GlobalReferenceEntity[];
  config: GlobalReferenceScreenConfig;
  onEdit: (record: GlobalReferenceEntity) => void;
  onDelete: (record: GlobalReferenceEntity) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {records.map((record) => (
        <Card key={record.id} className="shadow-fluent-2">
          <CardContent className="space-y-3 p-4">
            <ReferenceIcon resource={config.resource} />

            <div>
              <h3 className="font-heading text-base font-semibold">{record.name}</h3>
              {config.hasCode ? (
                <p className="text-muted-foreground mt-0.5 text-sm">
                  Code: <span className="font-mono">{hasCode(record) ? record.code : '—'}</span>
                </p>
              ) : null}
              {config.hasCountry ? (
                <p className="text-muted-foreground mt-0.5 text-sm">
                  Country: <span>{hasCountry(record) ? record.country.name : '—'}</span>
                </p>
              ) : null}
              <p className="text-muted-foreground mt-0.5 text-sm">
                Modified on: <span>{formatModifiedOn(record.modifiedOn)}</span>
              </p>
            </div>

            <div className="flex gap-2 border-t pt-3">
              <Button type="button" variant="ghost" size="sm" onClick={() => onEdit(record)}>
                <Pencil className="size-3.5" />
                Edit
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onDelete(record)}
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

export function GlobalReferenceListView({
  records,
  config,
  onEdit,
  onDelete,
}: {
  records: GlobalReferenceEntity[];
  config: GlobalReferenceScreenConfig;
  onEdit: (record: GlobalReferenceEntity) => void;
  onDelete: (record: GlobalReferenceEntity) => void;
}) {
  return (
    <div className="space-y-3">
      {records.map((record) => (
        <Card key={record.id} className="shadow-fluent-2">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <ReferenceIcon resource={config.resource} />
              <h3 className="font-heading truncate text-base font-semibold">{record.name}</h3>
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-1 pl-13 text-sm sm:flex-row sm:items-center sm:gap-6 sm:pl-0">
              {config.hasCode ? (
                <div>
                  <span className="text-muted-foreground">Code: </span>
                  <span className="font-mono">{hasCode(record) ? record.code : '—'}</span>
                </div>
              ) : null}
              {config.hasCountry ? (
                <div className="min-w-0">
                  <span className="text-muted-foreground">Country: </span>
                  <span className="truncate">{hasCountry(record) ? record.country.name : '—'}</span>
                </div>
              ) : null}
              <div>
                <span className="text-muted-foreground">Modified on: </span>
                <span>{formatModifiedOn(record.modifiedOn)}</span>
              </div>
            </div>

            <div className="shrink-0 pl-13 sm:pl-0">
              <ReferenceActionsMenu record={record} onEdit={onEdit} onDelete={onDelete} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
