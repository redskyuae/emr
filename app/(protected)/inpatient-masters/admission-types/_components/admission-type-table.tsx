'use client';

import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';

import type { AdmissionType } from '@/app/api/lib/modules/admission-type/schemas/admission-type-schema';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';

export function AdmissionTypeTable({
  admissionTypes,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: {
  admissionTypes: AdmissionType[];
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (admissionType: AdmissionType) => void;
  onDelete: (admissionType: AdmissionType) => void;
}) {
  return (
    <div className="bg-card shadow-fluent-2 overflow-hidden rounded-lg border">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] text-sm">
          <thead>
            <tr className="text-muted-foreground border-b text-left">
              <th className="p-3 pl-4 font-medium">Name</th>
              <th className="p-3 font-medium">Code</th>
              <th className="p-3 font-medium">Description</th>
              <th className="p-3 pr-4 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {admissionTypes.map((admissionType) => (
              <tr key={admissionType.id} className="hover:bg-muted/50 border-b last:border-b-0">
                <td className="p-3 pl-4 font-medium">{admissionType.name}</td>
                <td className="p-3">
                  <Badge variant="secondary">{admissionType.code}</Badge>
                </td>
                <td className="text-muted-foreground p-3">{admissionType.description ?? '—'}</td>
                <td className="p-3 pr-4 text-right">
                  {canEdit || canDelete ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Actions for ${admissionType.name}`}
                        >
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {canEdit ? (
                          <DropdownMenuItem onSelect={() => onEdit(admissionType)}>
                            <Pencil className="size-4" />
                            Edit
                          </DropdownMenuItem>
                        ) : null}
                        {canDelete ? (
                          <DropdownMenuItem
                            variant="destructive"
                            onSelect={() => onDelete(admissionType)}
                          >
                            <Trash2 className="size-4" />
                            Delete
                          </DropdownMenuItem>
                        ) : null}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AdmissionTypeTableSkeleton() {
  return (
    <div className="bg-card shadow-fluent-2 overflow-hidden rounded-lg border p-3">
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className="flex items-center gap-4 border-b p-2 last:border-b-0">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 flex-1" />
          <Skeleton className="size-8" />
        </div>
      ))}
    </div>
  );
}
