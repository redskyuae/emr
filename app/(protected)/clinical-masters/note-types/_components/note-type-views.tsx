import { FileText, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import type { ClinicalNoteType } from '@/app/api/lib/modules/clinical-note-type/schemas/clinical-note-type-schema';
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

function NoteTypeIcon() {
  return (
    <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-full">
      <FileText className="size-5" />
    </div>
  );
}

function NoteTypeActionsMenu({
  noteType,
  onEdit,
  onDelete,
}: {
  noteType: ClinicalNoteType;
  onEdit: (noteType: ClinicalNoteType) => void;
  onDelete: (noteType: ClinicalNoteType) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Actions for ${noteType.name}`}
        >
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={() => onEdit(noteType)}>
          <Pencil className="size-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onClick={() => onDelete(noteType)}>
          <Trash2 className="size-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function NoteTypeTableView({
  noteTypes,
  onEdit,
  onDelete,
}: {
  noteTypes: ClinicalNoteType[];
  onEdit: (noteType: ClinicalNoteType) => void;
  onDelete: (noteType: ClinicalNoteType) => void;
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
              {noteTypes.map((noteType) => (
                <TableRow key={noteType.id}>
                  <TableCell className="pl-4 font-medium">{noteType.name}</TableCell>
                  <TableCell className="font-mono text-xs">{noteType.code}</TableCell>
                  <TableCell className="text-muted-foreground max-w-xs truncate">
                    {noteType.description || '—'}
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    <NoteTypeActionsMenu noteType={noteType} onEdit={onEdit} onDelete={onDelete} />
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

export function NoteTypeCardView({
  noteTypes,
  onEdit,
  onDelete,
}: {
  noteTypes: ClinicalNoteType[];
  onEdit: (noteType: ClinicalNoteType) => void;
  onDelete: (noteType: ClinicalNoteType) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {noteTypes.map((noteType) => (
        <Card key={noteType.id} className="shadow-fluent-2">
          <CardContent className="space-y-3 p-4">
            <NoteTypeIcon />

            <div>
              <h3 className="font-heading text-base font-semibold">{noteType.name}</h3>
              <p className="text-muted-foreground mt-0.5 text-sm">
                Code: <span className="font-mono">{noteType.code}</span>
              </p>
              <p className="text-muted-foreground mt-0.5 text-sm">
                Description: <span>{noteType.description || '—'}</span>
              </p>
            </div>

            <div className="flex gap-2 border-t pt-3">
              <Button type="button" variant="ghost" size="sm" onClick={() => onEdit(noteType)}>
                <Pencil className="size-3.5" />
                Edit
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onDelete(noteType)}
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

export function NoteTypeListView({
  noteTypes,
  onEdit,
  onDelete,
}: {
  noteTypes: ClinicalNoteType[];
  onEdit: (noteType: ClinicalNoteType) => void;
  onDelete: (noteType: ClinicalNoteType) => void;
}) {
  return (
    <div className="space-y-3">
      {noteTypes.map((noteType) => (
        <Card key={noteType.id} className="shadow-fluent-2">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <NoteTypeIcon />
              <div className="min-w-0">
                <h3 className="font-heading text-base font-semibold">{noteType.name}</h3>
              </div>
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-1 pl-13 text-sm sm:flex-row sm:items-center sm:gap-6 sm:pl-0">
              <div>
                <span className="text-muted-foreground">Code: </span>
                <span className="font-mono">{noteType.code}</span>
              </div>
              <div className="min-w-0">
                <span className="text-muted-foreground">Description: </span>
                <span className="truncate">{noteType.description || '—'}</span>
              </div>
            </div>

            <div className="shrink-0 pl-13 sm:pl-0">
              <NoteTypeActionsMenu noteType={noteType} onEdit={onEdit} onDelete={onDelete} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
