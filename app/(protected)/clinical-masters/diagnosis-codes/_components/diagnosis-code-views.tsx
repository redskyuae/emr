import { MoreVertical, Pencil, Stethoscope, Trash2 } from 'lucide-react';
import type { DiagnosisCode } from '@/app/api/lib/modules/diagnosis-code/schemas/diagnosis-code-schema';
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

function DiagnosisCodeIcon() {
  return (
    <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-full">
      <Stethoscope className="size-5" />
    </div>
  );
}

function DiagnosisCodeActionsMenu({
  diagnosisCode,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: {
  diagnosisCode: DiagnosisCode;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (diagnosisCode: DiagnosisCode) => void;
  onDelete: (diagnosisCode: DiagnosisCode) => void;
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
          aria-label={`Actions for ${diagnosisCode.code}`}
        >
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {canEdit ? (
          <DropdownMenuItem onClick={() => onEdit(diagnosisCode)}>
            <Pencil className="size-4" />
            Edit
          </DropdownMenuItem>
        ) : null}
        {canDelete ? (
          <DropdownMenuItem variant="destructive" onClick={() => onDelete(diagnosisCode)}>
            <Trash2 className="size-4" />
            Delete
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function DiagnosisCodeTableView({
  diagnosisCodes,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: {
  diagnosisCodes: DiagnosisCode[];
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (diagnosisCode: DiagnosisCode) => void;
  onDelete: (diagnosisCode: DiagnosisCode) => void;
}) {
  return (
    <Card className="shadow-fluent-2">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table className="min-w-[600px]">
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Code</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="pr-4 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {diagnosisCodes.map((diagnosisCode) => (
                <TableRow key={diagnosisCode.id}>
                  <TableCell className="pl-4 font-mono text-xs font-medium">
                    {diagnosisCode.code}
                  </TableCell>
                  <TableCell className="font-medium">{diagnosisCode.title}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {diagnosisCode.category || '—'}
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    <DiagnosisCodeActionsMenu
                      diagnosisCode={diagnosisCode}
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

export function DiagnosisCodeCardView({
  diagnosisCodes,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: {
  diagnosisCodes: DiagnosisCode[];
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (diagnosisCode: DiagnosisCode) => void;
  onDelete: (diagnosisCode: DiagnosisCode) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {diagnosisCodes.map((diagnosisCode) => (
        <Card key={diagnosisCode.id} className="shadow-fluent-2">
          <CardContent className="space-y-3 p-4">
            <DiagnosisCodeIcon />

            <div>
              <h3 className="font-heading text-base font-semibold">
                <span className="font-mono">{diagnosisCode.code}</span>
              </h3>
              <p className="text-muted-foreground mt-0.5 text-sm">{diagnosisCode.title}</p>
              <p className="text-muted-foreground mt-0.5 text-sm">
                Category: <span>{diagnosisCode.category || '—'}</span>
              </p>
            </div>

            {canEdit || canDelete ? (
              <div className="flex gap-2 border-t pt-3">
                {canEdit ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(diagnosisCode)}
                  >
                    <Pencil className="size-3.5" />
                    Edit
                  </Button>
                ) : null}
                {canDelete ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(diagnosisCode)}
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

export function DiagnosisCodeListView({
  diagnosisCodes,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: {
  diagnosisCodes: DiagnosisCode[];
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (diagnosisCode: DiagnosisCode) => void;
  onDelete: (diagnosisCode: DiagnosisCode) => void;
}) {
  return (
    <div className="space-y-3">
      {diagnosisCodes.map((diagnosisCode) => (
        <Card key={diagnosisCode.id} className="shadow-fluent-2">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <DiagnosisCodeIcon />
              <div className="min-w-0">
                <h3 className="font-heading text-base font-semibold">
                  <span className="font-mono">{diagnosisCode.code}</span>
                </h3>
              </div>
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-1 pl-13 text-sm sm:flex-row sm:items-center sm:gap-6 sm:pl-0">
              <div className="min-w-0">
                <span className="text-muted-foreground">Title: </span>
                <span className="truncate">{diagnosisCode.title}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Category: </span>
                <span>{diagnosisCode.category || '—'}</span>
              </div>
            </div>

            <div className="shrink-0 pl-13 sm:pl-0">
              <DiagnosisCodeActionsMenu
                diagnosisCode={diagnosisCode}
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
