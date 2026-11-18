'use client';

import { CiEdit, CiTrash } from 'react-icons/ci';
import { PiDotsThreeLight } from 'react-icons/pi';

import type { AyurvedaDiagnosisCode } from '@/app/api/lib/modules/ayurveda-diagnosis-code/schemas/ayurveda-diagnosis-code-schema';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';

export function AyurvedaDiagnosisCodeTable({
  ayurvedaDiagnosisCodes,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: {
  ayurvedaDiagnosisCodes: AyurvedaDiagnosisCode[];
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (ayurvedaDiagnosisCode: AyurvedaDiagnosisCode) => void;
  onDelete: (ayurvedaDiagnosisCode: AyurvedaDiagnosisCode) => void;
}) {
  return (
    <div className="bg-card overflow-hidden rounded-lg border">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[840px] text-sm">
          <thead>
            <tr className="text-muted-foreground border-b text-left">
              <th className="p-3 pl-4 font-medium">Code</th>
              <th className="p-3 font-medium">Name</th>
              <th className="p-3 font-medium">English name</th>
              <th className="p-3 font-medium">Category</th>
              <th className="p-3 font-medium">ICD-10-CM mapping</th>
              <th className="p-3 pr-4 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {ayurvedaDiagnosisCodes.map((ayurvedaDiagnosisCode) => (
              <tr
                key={ayurvedaDiagnosisCode.id}
                className="hover:bg-muted/50 border-b last:border-b-0"
              >
                <td className="p-3 pl-4 font-mono text-xs font-medium">
                  {ayurvedaDiagnosisCode.code}
                </td>
                <td className="p-3 font-medium">{ayurvedaDiagnosisCode.name}</td>
                <td className="text-muted-foreground p-3">
                  {ayurvedaDiagnosisCode.englishName ?? '—'}
                </td>
                <td className="text-muted-foreground p-3">
                  {ayurvedaDiagnosisCode.category ?? '—'}
                </td>
                <td className="p-3">
                  {ayurvedaDiagnosisCode.icdDiagnosisCode ? (
                    <span className="flex items-baseline gap-2">
                      <Badge variant="secondary" className="font-mono">
                        {ayurvedaDiagnosisCode.icdDiagnosisCode.code}
                      </Badge>
                      <span className="text-muted-foreground">
                        {ayurvedaDiagnosisCode.icdDiagnosisCode.title}
                      </span>
                    </span>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      Not mapped
                    </Badge>
                  )}
                </td>
                <td className="p-3 pr-4 text-right">
                  {canEdit || canDelete ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Actions for ${ayurvedaDiagnosisCode.code}`}
                        >
                          <PiDotsThreeLight className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {canEdit ? (
                          <DropdownMenuItem onSelect={() => onEdit(ayurvedaDiagnosisCode)}>
                            <CiEdit className="size-4" />
                            Edit
                          </DropdownMenuItem>
                        ) : null}
                        {canDelete ? (
                          <DropdownMenuItem
                            variant="destructive"
                            onSelect={() => onDelete(ayurvedaDiagnosisCode)}
                          >
                            <CiTrash className="size-4" />
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

// Mirrors AyurvedaDiagnosisCodeTable: the same header and one sized skeleton per cell for a page
// of rows, plus the pagination row the page shows below the table.
export function AyurvedaDiagnosisCodeTableSkeleton({
  canEdit,
  canDelete,
}: {
  canEdit: boolean;
  canDelete: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="bg-card overflow-hidden rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[840px] text-sm">
            <thead>
              <tr className="text-muted-foreground border-b text-left">
                <th className="p-3 pl-4 font-medium">Code</th>
                <th className="p-3 font-medium">Name</th>
                <th className="p-3 font-medium">English name</th>
                <th className="p-3 font-medium">Category</th>
                <th className="p-3 font-medium">ICD-10-CM mapping</th>
                <th className="p-3 pr-4 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 10 }, (_, row) => (
                <tr key={row} className="border-b last:border-b-0">
                  <td className="p-3 pl-4">
                    <Skeleton className="h-4 w-16" />
                  </td>
                  <td className="p-3">
                    <Skeleton className="h-4 w-32" />
                  </td>
                  <td className="p-3">
                    <Skeleton className="h-4 w-36" />
                  </td>
                  <td className="p-3">
                    <Skeleton className="h-4 w-24" />
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-6 w-16 rounded-full" />
                      <Skeleton className="h-4 w-40" />
                    </div>
                  </td>
                  <td className="p-3 pr-4 text-right">
                    {canEdit || canDelete ? <Skeleton className="ml-auto size-9" /> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
        <Skeleton className="h-4 w-36" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    </div>
  );
}
