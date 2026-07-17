'use client';

import Link from 'next/link';
import { ArrowRightLeft, Eye, LogOut, MoreHorizontal, XCircle } from 'lucide-react';

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
}: {
  admissions: Admission[];
  onTransfer: (admission: Admission) => void;
  onDischarge: (admission: Admission) => void;
  onCancel: (admission: Admission) => void;
}) {
  return (
    <div className="bg-card shadow-fluent-2 overflow-hidden rounded-lg border">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] text-sm">
          <thead>
            <tr className="text-muted-foreground border-b text-left">
              <th className="p-3 pl-4 font-medium">Admission</th>
              <th className="p-3 font-medium">Patient</th>
              <th className="p-3 font-medium">Ward / Bed</th>
              <th className="p-3 font-medium">Doctor</th>
              <th className="p-3 font-medium">Type</th>
              <th className="p-3 font-medium">Admitted</th>
              <th className="p-3 font-medium">Expected discharge</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 pr-4 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {admissions.map((admission) => {
              const status = admissionStatusPresentation(admission.status);
              const active = admission.status === 'ADMITTED';

              return (
                <tr key={admission.id} className="hover:bg-muted/50 border-b last:border-b-0">
                  <td className="p-3 pl-4">
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
                  <td className="p-3">
                    <p className="font-medium">
                      {admission.patient.firstName} {admission.patient.lastName}
                    </p>
                    <p className="text-muted-foreground text-xs">{admission.patient.mrn}</p>
                  </td>
                  <td className="p-3">
                    <p>{admission.ward.name}</p>
                    <p className="text-muted-foreground text-xs">{admission.bed.bedNumber}</p>
                  </td>
                  <td className="p-3">{admission.doctor.name}</td>
                  <td className="p-3">
                    <Badge variant="secondary">{admission.admissionType.code}</Badge>
                  </td>
                  <td className="text-muted-foreground p-3 tabular-nums">
                    {formatMoment(admission.admittedAt)}
                  </td>
                  <td className="text-muted-foreground p-3 tabular-nums">
                    {admission.expectedDischargeDate ?? '—'}
                  </td>
                  <td className="p-3">
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </td>
                  <td className="p-3 pr-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {active ? (
                        <Button type="button" size="sm" onClick={() => onDischarge(admission)}>
                          <LogOut className="size-4" />
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
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/admissions/${admission.id}`}>
                              <Eye className="size-4" />
                              View Admission
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/patients/${admission.patient.id}`}>
                              <Eye className="size-4" />
                              Open Patient
                            </Link>
                          </DropdownMenuItem>
                          {active ? (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onSelect={() => onTransfer(admission)}>
                                <ArrowRightLeft className="size-4" />
                                Transfer Bed
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                variant="destructive"
                                onSelect={() => onCancel(admission)}
                              >
                                <XCircle className="size-4" />
                                Cancel Admission
                              </DropdownMenuItem>
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
    <div className="bg-card shadow-fluent-2 overflow-hidden rounded-lg border p-3">
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
