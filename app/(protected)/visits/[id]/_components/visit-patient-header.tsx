'use client';

import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Loader2,
  MoreHorizontal,
  PlayCircle,
  ReceiptText,
  ShieldAlert,
  XCircle,
} from 'lucide-react';

import type { Visit } from '@/app/api/lib/modules/visit/schemas/visit-schema';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { isActiveVisit, visitStatusPresentation } from '../../_utils/visit-status';

export function VisitPatientHeader({
  visit,
  allergyCount,
  canStart,
  canComplete,
  canCancel,
  canCreateInvoice,
  starting,
  onStart,
  onComplete,
  onCancel,
}: {
  visit: Visit;
  allergyCount: number | null;
  canStart: boolean;
  canComplete: boolean;
  canCancel: boolean;
  canCreateInvoice: boolean;
  starting: boolean;
  onStart: () => void;
  onComplete: () => void;
  onCancel: () => void;
}) {
  const status = visitStatusPresentation(visit.status);

  return (
    <header className="acrylic shadow-fluent-4 z-10 rounded-lg border p-3 lg:sticky lg:top-18">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Button asChild variant="ghost" size="icon" aria-label="Back to Visits">
            <Link href="/visits">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <span
            className="bg-primary/10 text-primary grid size-11 shrink-0 place-items-center rounded-lg font-mono text-base font-semibold tabular-nums"
            aria-label={`Queue Token ${visit.queueToken}`}
          >
            {visit.queueToken}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/patients/${visit.patient.id}`}
                className="font-heading text-lg font-semibold hover:underline"
              >
                {visit.patient.firstName} {visit.patient.lastName}
              </Link>
              <Badge variant={status.variant}>{status.label}</Badge>
              {allergyCount ? (
                <Badge variant="destructive">
                  <ShieldAlert className="size-3" aria-hidden="true" />
                  {allergyCount === 1 ? '1 allergy' : `${allergyCount} allergies`}
                </Badge>
              ) : null}
            </div>
            <p className="text-muted-foreground text-sm">
              <span className="font-mono text-xs">{visit.patient.mrn}</span> ·{' '}
              {visit.visitType.name} · {visit.doctor.name} ·{' '}
              <span className="font-mono text-xs">{visit.visitNumber}</span> ·{' '}
              {visit.appointment?.bookingNumber ?? 'Walk-in'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label={`More actions for ${visit.visitNumber}`}
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/patients/${visit.patient.id}`}>
                  <FileText className="size-4" />
                  Open Patient Chart
                </Link>
              </DropdownMenuItem>
              {canCreateInvoice ? (
                <DropdownMenuItem asChild>
                  <Link
                    href={`/billing?invoice=new&patientId=${visit.patient.id}&visitId=${visit.id}`}
                  >
                    <ReceiptText className="size-4" />
                    Create Invoice
                  </Link>
                </DropdownMenuItem>
              ) : null}
              {isActiveVisit(visit.status) && canCancel ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onSelect={onCancel}>
                    <XCircle className="size-4" />
                    Cancel Visit
                  </DropdownMenuItem>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>

          {visit.status === 'CHECKED_IN' && canStart ? (
            <Button type="button" disabled={starting} aria-busy={starting} onClick={onStart}>
              {starting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <PlayCircle className="size-4" />
              )}
              {starting ? 'Starting consultation…' : 'Start consultation'}
            </Button>
          ) : null}
          {visit.status === 'IN_CONSULTATION' && canComplete ? (
            <Button type="button" onClick={onComplete}>
              <CheckCircle2 className="size-4" />
              Complete Visit
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
