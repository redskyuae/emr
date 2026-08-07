import { Languages, MoreVertical, Pencil, Trash2 } from 'lucide-react';

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

function hasCode(
  record: GlobalReferenceEntity
): record is GlobalReferenceEntity & { code: string } {
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

function LanguageIcon() {
  return (
    <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-full">
      <Languages className="size-5" />
    </div>
  );
}

function LanguageActionsMenu({
  language,
  onEdit,
  onDelete,
}: {
  language: GlobalReferenceEntity;
  onEdit: (language: GlobalReferenceEntity) => void;
  onDelete: (language: GlobalReferenceEntity) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Actions for ${language.name}`}
        >
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={() => onEdit(language)}>
          <Pencil className="size-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onClick={() => onDelete(language)}>
          <Trash2 className="size-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function LanguageTableView({
  languages,
  onEdit,
  onDelete,
}: {
  languages: GlobalReferenceEntity[];
  onEdit: (language: GlobalReferenceEntity) => void;
  onDelete: (language: GlobalReferenceEntity) => void;
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
              {languages.map((language) => (
                <TableRow key={language.id}>
                  <TableCell className="pl-4 font-medium">{language.name}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {hasCode(language) ? language.code : '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatModifiedOn(language.modifiedOn)}
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    <LanguageActionsMenu language={language} onEdit={onEdit} onDelete={onDelete} />
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

export function LanguageCardView({
  languages,
  onEdit,
  onDelete,
}: {
  languages: GlobalReferenceEntity[];
  onEdit: (language: GlobalReferenceEntity) => void;
  onDelete: (language: GlobalReferenceEntity) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {languages.map((language) => (
        <Card key={language.id} className="shadow-fluent-2">
          <CardContent className="space-y-3 p-4">
            <LanguageIcon />

            <div>
              <h3 className="font-heading text-base font-semibold">{language.name}</h3>
              <p className="text-muted-foreground mt-0.5 text-sm">
                Code: <span className="font-mono">{hasCode(language) ? language.code : '—'}</span>
              </p>
              <p className="text-muted-foreground mt-0.5 text-sm">
                Modified on: <span>{formatModifiedOn(language.modifiedOn)}</span>
              </p>
            </div>

            <div className="flex gap-2 border-t pt-3">
              <Button type="button" variant="ghost" size="sm" onClick={() => onEdit(language)}>
                <Pencil className="size-3.5" />
                Edit
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onDelete(language)}
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

export function LanguageListView({
  languages,
  onEdit,
  onDelete,
}: {
  languages: GlobalReferenceEntity[];
  onEdit: (language: GlobalReferenceEntity) => void;
  onDelete: (language: GlobalReferenceEntity) => void;
}) {
  return (
    <div className="space-y-3">
      {languages.map((language) => (
        <Card key={language.id} className="shadow-fluent-2">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <LanguageIcon />
              <h3 className="font-heading truncate text-base font-semibold">{language.name}</h3>
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-1 pl-13 text-sm sm:flex-row sm:items-center sm:gap-6 sm:pl-0">
              <div>
                <span className="text-muted-foreground">Code: </span>
                <span className="font-mono">{hasCode(language) ? language.code : '—'}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Modified on: </span>
                <span>{formatModifiedOn(language.modifiedOn)}</span>
              </div>
            </div>

            <div className="shrink-0 pl-13 sm:pl-0">
              <LanguageActionsMenu language={language} onEdit={onEdit} onDelete={onDelete} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
