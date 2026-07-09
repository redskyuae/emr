import { MoreVertical, Pencil, Trash2 } from 'lucide-react';

import type { VisitStatus } from '@/app/api/lib/modules/visit-status/schemas/visit-status-schema';
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
import { VISIT_STATUS_CATEGORY_LABELS } from '../_utils/visit-status-form-schema';

function StatusColorSwatch({ color }: { color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="border-border inline-block size-4 rounded-sm border"
        style={{ backgroundColor: color }}
      />
      <span className="font-mono text-xs">{color.toUpperCase()}</span>
    </div>
  );
}

function StatusActionsMenu({
  status,
  onEdit,
  onDelete,
}: {
  status: VisitStatus;
  onEdit: (status: VisitStatus) => void;
  onDelete: (status: VisitStatus) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="icon-sm" aria-label={`Actions for ${status.name}`}>
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={() => onEdit(status)}>
          <Pencil className="size-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          disabled={status.isSystem}
          onClick={() => onDelete(status)}
        >
          <Trash2 className="size-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function VisitStatusTable({
  statuses,
  onEdit,
  onDelete,
}: {
  statuses: VisitStatus[];
  onEdit: (status: VisitStatus) => void;
  onDelete: (status: VisitStatus) => void;
}) {
  return (
    <Card className="shadow-fluent-2">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table className="min-w-[720px]">
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Color</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="pr-4 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {statuses.map((status) => (
                <TableRow key={status.id}>
                  <TableCell className="pl-4 font-medium">
                    <div className="flex items-center gap-2">
                      {status.name}
                      {status.isSystem ? (
                        <Badge variant="outline" className="bg-muted/70 uppercase">
                          System
                        </Badge>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{status.code}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{VISIT_STATUS_CATEGORY_LABELS[status.category]}</Badge>
                  </TableCell>
                  <TableCell>
                    <StatusColorSwatch color={status.color} />
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-xs truncate">
                    {status.description || '—'}
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    <StatusActionsMenu status={status} onEdit={onEdit} onDelete={onDelete} />
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

export function VisitStatusTableSkeleton() {
  return (
    <Card className="shadow-fluent-2">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table className="min-w-[720px]">
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Color</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="pr-4 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 4 }, (_, i) => (
                <TableRow key={i}>
                  <TableCell className="pl-4">
                    <div className="bg-muted h-5 w-28 animate-pulse rounded" />
                  </TableCell>
                  <TableCell>
                    <div className="bg-muted h-5 w-14 animate-pulse rounded" />
                  </TableCell>
                  <TableCell>
                    <div className="bg-muted h-5 w-20 animate-pulse rounded" />
                  </TableCell>
                  <TableCell>
                    <div className="bg-muted h-5 w-16 animate-pulse rounded" />
                  </TableCell>
                  <TableCell>
                    <div className="bg-muted h-5 w-40 animate-pulse rounded" />
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    <div className="bg-muted ml-auto h-8 w-8 animate-pulse rounded" />
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
