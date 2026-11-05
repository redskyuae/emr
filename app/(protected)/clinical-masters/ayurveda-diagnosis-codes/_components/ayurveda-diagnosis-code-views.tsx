import { CircleCheck, CircleOff, MoreVertical, Pencil, Stethoscope, Trash2 } from 'lucide-react';
import type { AyurvedaDiagnosisCode } from '@/app/api/lib/modules/ayurveda-diagnosis-code/schemas/ayurveda-diagnosis-code-schema';
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

function AyurvedaDiagnosisCodeIcon() {
  return (
    <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-full">
      <Stethoscope className="size-5" />
    </div>
  );
}

function AyurvedaDiagnosisCodeStatusBadge({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <Badge variant="outline">Active</Badge>
  ) : (
    <Badge variant="outline" className="text-muted-foreground">
      Inactive
    </Badge>
  );
}

function AyurvedaDiagnosisCodeActionsMenu({
  ayurvedaDiagnosisCode,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
  onToggleActive,
}: {
  ayurvedaDiagnosisCode: AyurvedaDiagnosisCode;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (ayurvedaDiagnosisCode: AyurvedaDiagnosisCode) => void;
  onDelete: (ayurvedaDiagnosisCode: AyurvedaDiagnosisCode) => void;
  onToggleActive: (ayurvedaDiagnosisCode: AyurvedaDiagnosisCode) => void;
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
          aria-label={`Actions for ${ayurvedaDiagnosisCode.code}`}
        >
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {canEdit ? (
          <DropdownMenuItem onClick={() => onEdit(ayurvedaDiagnosisCode)}>
            <Pencil className="size-4" />
            Edit
          </DropdownMenuItem>
        ) : null}
        {canEdit ? (
          <DropdownMenuItem onClick={() => onToggleActive(ayurvedaDiagnosisCode)}>
            {ayurvedaDiagnosisCode.isActive ? (
              <CircleOff className="size-4" />
            ) : (
              <CircleCheck className="size-4" />
            )}
            {ayurvedaDiagnosisCode.isActive ? 'Deactivate' : 'Activate'}
          </DropdownMenuItem>
        ) : null}
        {canDelete ? (
          <DropdownMenuItem variant="destructive" onClick={() => onDelete(ayurvedaDiagnosisCode)}>
            <Trash2 className="size-4" />
            Delete
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AyurvedaDiagnosisCodeTableView({
  ayurvedaDiagnosisCodes,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
  onToggleActive,
}: {
  ayurvedaDiagnosisCodes: AyurvedaDiagnosisCode[];
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (ayurvedaDiagnosisCode: AyurvedaDiagnosisCode) => void;
  onDelete: (ayurvedaDiagnosisCode: AyurvedaDiagnosisCode) => void;
  onToggleActive: (ayurvedaDiagnosisCode: AyurvedaDiagnosisCode) => void;
}) {
  return (
    <Card className="shadow-fluent-2">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table className="min-w-[680px]">
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Code</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-4 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ayurvedaDiagnosisCodes.map((ayurvedaDiagnosisCode) => (
                <TableRow key={ayurvedaDiagnosisCode.id}>
                  <TableCell className="pl-4 font-mono text-xs font-medium">
                    {ayurvedaDiagnosisCode.code}
                  </TableCell>
                  <TableCell className="font-medium">{ayurvedaDiagnosisCode.title}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {ayurvedaDiagnosisCode.category || '—'}
                  </TableCell>
                  <TableCell>
                    <AyurvedaDiagnosisCodeStatusBadge isActive={ayurvedaDiagnosisCode.isActive} />
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    <AyurvedaDiagnosisCodeActionsMenu
                      ayurvedaDiagnosisCode={ayurvedaDiagnosisCode}
                      canEdit={canEdit}
                      canDelete={canDelete}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onToggleActive={onToggleActive}
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

export function AyurvedaDiagnosisCodeCardView({
  ayurvedaDiagnosisCodes,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
  onToggleActive,
}: {
  ayurvedaDiagnosisCodes: AyurvedaDiagnosisCode[];
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (ayurvedaDiagnosisCode: AyurvedaDiagnosisCode) => void;
  onDelete: (ayurvedaDiagnosisCode: AyurvedaDiagnosisCode) => void;
  onToggleActive: (ayurvedaDiagnosisCode: AyurvedaDiagnosisCode) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {ayurvedaDiagnosisCodes.map((ayurvedaDiagnosisCode) => (
        <Card key={ayurvedaDiagnosisCode.id} className="shadow-fluent-2">
          <CardContent className="space-y-3 p-4">
            <div className="flex items-start justify-between gap-2">
              <AyurvedaDiagnosisCodeIcon />
              <AyurvedaDiagnosisCodeStatusBadge isActive={ayurvedaDiagnosisCode.isActive} />
            </div>

            <div>
              <h3 className="font-heading text-base font-semibold">
                <span className="font-mono">{ayurvedaDiagnosisCode.code}</span>
              </h3>
              <p className="text-muted-foreground mt-0.5 text-sm">{ayurvedaDiagnosisCode.title}</p>
              <p className="text-muted-foreground mt-0.5 text-sm">
                Category: <span>{ayurvedaDiagnosisCode.category || '—'}</span>
              </p>
            </div>

            {canEdit || canDelete ? (
              <div className="flex gap-2 border-t pt-3">
                {canEdit ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(ayurvedaDiagnosisCode)}
                  >
                    <Pencil className="size-3.5" />
                    Edit
                  </Button>
                ) : null}
                {canEdit ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onToggleActive(ayurvedaDiagnosisCode)}
                  >
                    {ayurvedaDiagnosisCode.isActive ? (
                      <CircleOff className="size-3.5" />
                    ) : (
                      <CircleCheck className="size-3.5" />
                    )}
                    {ayurvedaDiagnosisCode.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                ) : null}
                {canDelete ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(ayurvedaDiagnosisCode)}
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

export function AyurvedaDiagnosisCodeListView({
  ayurvedaDiagnosisCodes,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
  onToggleActive,
}: {
  ayurvedaDiagnosisCodes: AyurvedaDiagnosisCode[];
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (ayurvedaDiagnosisCode: AyurvedaDiagnosisCode) => void;
  onDelete: (ayurvedaDiagnosisCode: AyurvedaDiagnosisCode) => void;
  onToggleActive: (ayurvedaDiagnosisCode: AyurvedaDiagnosisCode) => void;
}) {
  return (
    <div className="space-y-3">
      {ayurvedaDiagnosisCodes.map((ayurvedaDiagnosisCode) => (
        <Card key={ayurvedaDiagnosisCode.id} className="shadow-fluent-2">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <AyurvedaDiagnosisCodeIcon />
              <div className="min-w-0">
                <h3 className="font-heading text-base font-semibold">
                  <span className="font-mono">{ayurvedaDiagnosisCode.code}</span>
                </h3>
              </div>
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-1 pl-13 text-sm sm:flex-row sm:items-center sm:gap-6 sm:pl-0">
              <div className="min-w-0">
                <span className="text-muted-foreground">Title: </span>
                <span className="truncate">{ayurvedaDiagnosisCode.title}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Category: </span>
                <span>{ayurvedaDiagnosisCode.category || '—'}</span>
              </div>
              <AyurvedaDiagnosisCodeStatusBadge isActive={ayurvedaDiagnosisCode.isActive} />
            </div>

            <div className="shrink-0 pl-13 sm:pl-0">
              <AyurvedaDiagnosisCodeActionsMenu
                ayurvedaDiagnosisCode={ayurvedaDiagnosisCode}
                canEdit={canEdit}
                canDelete={canDelete}
                onEdit={onEdit}
                onDelete={onDelete}
                onToggleActive={onToggleActive}
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
