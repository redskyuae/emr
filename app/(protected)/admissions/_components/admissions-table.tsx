'use client';

import Link from 'next/link';
import { CiCircleRemove, CiLogout, CiRead } from 'react-icons/ci';
import { PiArrowsLeftRightLight, PiDotsThreeLight } from 'react-icons/pi';

import type { Admission } from '@/app/api/lib/modules/admission/schemas/admission-schema';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import {
  tableCellClass,
  tableHeadCellClass,
  tableHeadRowClass,
} from '@/components/ui/table-styles';
import { cn } from '@/lib/utils';
import { admissionStatusPresentation } from '../_utils/admission-status';

function formatMoment(value: Date | string) {
  return new Date(value).toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function AdmissionsTable({
  admissions,
  onTransfer,
  onDischarge,
  onCancel,
  canDischarge,
  canTransfer,
  canCancel,
}: {
  admissions: Admission[];
  onTransfer: (admission: Admission) => void;
  onDischarge: (admission: Admission) => void;
  onCancel: (admission: Admission) => void;
  canDischarge: boolean;
  canTransfer: boolean;
  canCancel: boolean;
}) {
  return (
    <div className="bg-card overflow-hidden rounded-xl border">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] text-sm">
          <thead>
            <tr className={tableHeadRowClass}>
              <th className={tableHeadCellClass}>Admission</th>
              <th className={tableHeadCellClass}>Patient</th>
              <th className={tableHeadCellClass}>Ward / Bed</th>
              <th className={tableHeadCellClass}>Doctor</th>
              <th className={tableHeadCellClass}>Type</th>
              <th className={tableHeadCellClass}>Admitted</th>
              <th className={tableHeadCellClass}>Expected discharge</th>
              <th className={tableHeadCellClass}>Status</th>
              <th className={cn(tableHeadCellClass, 'text-right')}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {admissions.map((admission) => {
              const status = admissionStatusPresentation(admission.status);
              const active = admission.status === 'ADMITTED';

              return (
                <tr key={admission.id} className="hover:bg-muted/50 border-b last:border-b-0">
                  <td className={tableCellClass}>
                    <Link
                      href={`/admissions/${admission.id}`}
                      className="font-medium hover:underline"
                    >
                      {admission.admissionNumber}
                    </Link>
                    {admission.visit ? (
                      <p className="text-muted-foreground text-xs">{admission.visit.visitNumber}</p>
                    ) : null}
                  </td>
                  <td className={tableCellClass}>
                    <p className="font-medium">
                      {admission.patient.firstName} {admission.patient.lastName}
                    </p>
                    <p className="text-muted-foreground text-xs">{admission.patient.mrn}</p>
                  </td>
                  <td className={tableCellClass}>
                    <p>{admission.ward.name}</p>
                    <p className="text-muted-foreground text-xs">{admission.bed.bedNumber}</p>
                  </td>
                  <td className={tableCellClass}>{admission.doctor.name}</td>
                  <td className={tableCellClass}>
                    <Badge variant="secondary">{admission.admissionType.code}</Badge>
                  </td>
                  <td className={cn(tableCellClass, 'text-muted-foreground tabular-nums')}>
                    {formatMoment(admission.admittedAt)}
                  </td>
                  <td className={cn(tableCellClass, 'text-muted-foreground tabular-nums')}>
                    {admission.expectedDischargeDate ?? '—'}
                  </td>
                  <td className={tableCellClass}>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </td>
                  <td className={cn(tableCellClass, 'text-right')}>
                    <div className="flex items-center justify-end gap-2">
                      {active && canDischarge ? (
                        <Button type="button" size="sm" onClick={() => onDischarge(admission)}>
                          <CiLogout className="size-4" />
                          Discharge
                        </Button>
                      ) : null}

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Actions for ${admission.admissionNumber}`}
                          >
                            <PiDotsThreeLight className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/admissions/${admission.id}`}>
                              <CiRead className="size-4" />
                              View Admission
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/patients/${admission.patient.id}`}>
                              <CiRead className="size-4" />
                              Open Patient
                            </Link>
                          </DropdownMenuItem>
                          {active && (canTransfer || canCancel) ? (
                            <>
                              <DropdownMenuSeparator />
                              {canTransfer ? (
                                <DropdownMenuItem onSelect={() => onTransfer(admission)}>
                                  <PiArrowsLeftRightLight className="size-4" />
                                  Transfer Bed
                                </DropdownMenuItem>
                              ) : null}
                              {canCancel ? (
                                <DropdownMenuItem
                                  variant="destructive"
                                  onSelect={() => onCancel(admission)}
                                >
                                  <CiCircleRemove className="size-4" />
                                  Cancel Admission
                                </DropdownMenuItem>
                              ) : null}
                            </>
                          ) : null}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AdmissionsTableSkeleton() {
  return (
    <div className="bg-card overflow-hidden rounded-xl border p-4">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="flex items-center gap-4 border-b p-2 last:border-b-0">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="ml-auto h-8 w-28" />
        </div>
      ))}
    </div>
  );
}
