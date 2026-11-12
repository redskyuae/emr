'use client';

import Link from 'next/link';
import {
  Activity,
  ArrowLeft,
  CalendarPlus,
  CheckCircle2,
  ChevronDown,
  ClipboardPlus,
  FilePlus2,
  FileText,
  Loader2,
  NotebookPen,
  Pill,
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
  DropdownMenuLabel,
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
  canRecordVitals,
  canCreateNote,
  canAssignPlan,
  canBookAppointment,
  starting,
  onStart,
  onComplete,
  onCancel,
  onRecordVitals,
  onAddNote,
  onAddAllergy,
  onAddMedication,
  onAssignPlan,
  onOpenDocuments,
}: {
  visit: Visit;
  allergyCount: number | null;
  canStart: boolean;
  canComplete: boolean;
  canCancel: boolean;
  canCreateInvoice: boolean;
  canRecordVitals: boolean;
  canCreateNote: boolean;
  canAssignPlan: boolean;
  canBookAppointment: boolean;
  starting: boolean;
  onStart: () => void;
  onComplete: () => void;
  onCancel: () => void;
  onRecordVitals: () => void;
  onAddNote: () => void;
  onAddAllergy: () => void;
  onAddMedication: () => void;
  onAssignPlan: () => void;
  onOpenDocuments: () => void;
}) {
  const status = visitStatusPresentation(visit.status);
  const active = isActiveVisit(visit.status);

  return (
    <header className="acrylic shadow-fluent-4 z-10 rounded-lg border p-3 lg:sticky lg:top-18 xl:static">
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
                aria-label={`Actions for ${visit.visitNumber}`}
              >
                Actions
                <ChevronDown className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {active ? (
                <>
                  <DropdownMenuLabel>Record</DropdownMenuLabel>
                  {canRecordVitals ? (
                    <DropdownMenuItem onSelect={onRecordVitals}>
                      <Activity className="size-4" />
                      Vital Signs
                    </DropdownMenuItem>
                  ) : null}
                  {canCreateNote ? (
                    <DropdownMenuItem onSelect={onAddNote}>
                      <NotebookPen className="size-4" />
                      Clinical Note
                    </DropdownMenuItem>
                  ) : null}
                  <DropdownMenuItem onSelect={onAddAllergy}>
                    <ShieldAlert className="size-4" />
                    Allergy
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={onAddMedication}>
                    <Pill className="size-4" />
                    Medication
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              ) : null}
              {canAssignPlan ? (
                <DropdownMenuItem onSelect={onAssignPlan}>
                  <ClipboardPlus className="size-4" />
                  Assign Treatment Plan
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuItem onSelect={onOpenDocuments}>
                <FilePlus2 className="size-4" />
                Documents
              </DropdownMenuItem>
              {canBookAppointment ? (
                <DropdownMenuItem asChild>
                  <Link href="/appointments/new">
                    <CalendarPlus className="size-4" />
                    Book follow-up
                  </Link>
                </DropdownMenuItem>
              ) : null}
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
              {active && canCancel ? (
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
