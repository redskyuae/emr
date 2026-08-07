import { MapPinned, MoreVertical, Pencil, Trash2 } from 'lucide-react';

import type { GlobalReferenceEntity } from '@/app/queries/global-references/useGlobalReferencesManagement';
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

function StateIcon() {
  return (
    <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-full">
      <MapPinned className="size-5" />
    </div>
  );
}

function StateActionsMenu({
  state,
  onEdit,
  onDelete,
}: {
  state: GlobalReferenceEntity;
  onEdit: (state: GlobalReferenceEntity) => void;
  onDelete: (state: GlobalReferenceEntity) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Actions for ${state.name}`}
        >
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={() => onEdit(state)}>
          <Pencil className="size-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onClick={() => onDelete(state)}>
          <Trash2 className="size-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function StateTableView({
  states,
  onEdit,
  onDelete,
}: {
  states: GlobalReferenceEntity[];
  onEdit: (state: GlobalReferenceEntity) => void;
  onDelete: (state: GlobalReferenceEntity) => void;
}) {
  return (
    <Card className="shadow-fluent-2">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table className="min-w-[680px]">
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Name</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Modified on</TableHead>
                <TableHead className="pr-4 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {states.map((state) => (
                <TableRow key={state.id}>
                  <TableCell className="pl-4 font-medium">{state.name}</TableCell>
                  <TableCell>
                    {hasCountry(state) ? (
                      <>
                        {state.country.name}{' '}
                        <span className="text-muted-foreground font-mono text-xs">
                          {state.country.code}
                        </span>
                      </>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatModifiedOn(state.modifiedOn)}
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    <StateActionsMenu state={state} onEdit={onEdit} onDelete={onDelete} />
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

export function StateCardView({
  states,
  onEdit,
  onDelete,
}: {
  states: GlobalReferenceEntity[];
  onEdit: (state: GlobalReferenceEntity) => void;
  onDelete: (state: GlobalReferenceEntity) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {states.map((state) => (
        <Card key={state.id} className="shadow-fluent-2">
          <CardContent className="space-y-3 p-4">
            <StateIcon />

            <div>
              <h3 className="font-heading text-base font-semibold">{state.name}</h3>
              <p className="text-muted-foreground mt-0.5 text-sm">
                Country: <span>{hasCountry(state) ? state.country.name : '—'}</span>
              </p>
              <p className="text-muted-foreground mt-0.5 text-sm">
                Modified on: <span>{formatModifiedOn(state.modifiedOn)}</span>
              </p>
            </div>

            <div className="flex gap-2 border-t pt-3">
              <Button type="button" variant="ghost" size="sm" onClick={() => onEdit(state)}>
                <Pencil className="size-3.5" />
                Edit
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onDelete(state)}
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

export function StateListView({
  states,
  onEdit,
  onDelete,
}: {
  states: GlobalReferenceEntity[];
  onEdit: (state: GlobalReferenceEntity) => void;
  onDelete: (state: GlobalReferenceEntity) => void;
}) {
  return (
    <div className="space-y-3">
      {states.map((state) => (
        <Card key={state.id} className="shadow-fluent-2">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <StateIcon />
              <h3 className="font-heading truncate text-base font-semibold">{state.name}</h3>
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-1 pl-13 text-sm sm:flex-row sm:items-center sm:gap-6 sm:pl-0">
              <div className="min-w-0">
                <span className="text-muted-foreground">Country: </span>
                <span className="truncate">{hasCountry(state) ? state.country.name : '—'}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Modified on: </span>
                <span>{formatModifiedOn(state.modifiedOn)}</span>
              </div>
            </div>

            <div className="shrink-0 pl-13 sm:pl-0">
              <StateActionsMenu state={state} onEdit={onEdit} onDelete={onDelete} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
