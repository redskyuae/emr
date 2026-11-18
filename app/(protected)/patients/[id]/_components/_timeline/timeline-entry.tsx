'use client';

import Link from 'next/link';
import type { IconType } from 'react-icons';
import { CiCalendar, CiFileOn, CiReceipt, CiStethoscope, CiUser, CiWallet } from 'react-icons/ci';
import { PiArrowsLeftRightLight, PiBedLight, PiPaperclipLight } from 'react-icons/pi';

import type { TimelineEvent } from '@/app/api/lib/modules/patient-timeline/schemas/patient-timeline-schema';
import {
  formatTimelineTime,
  getTimelineEventContext,
  getTimelineEventHref,
  getTimelineEventTitle,
} from '@/app/(protected)/patients/[id]/_utils/timeline-presentation';
import { cn } from '@/lib/utils';

const SOURCE_ICONS: Record<TimelineEvent['sourceType'], IconType> = {
  PATIENT: CiUser,
  VISIT: CiStethoscope,
  PAYMENT: CiWallet,
  INVOICE: CiReceipt,
  ADMISSION: PiBedLight,
  APPOINTMENT: CiCalendar,
  BED_TRANSFER: PiArrowsLeftRightLight,
  CLINICAL_NOTE: CiFileOn,
  VISIT_DOCUMENT: PiPaperclipLight,
};

// Cancellations and voids are the only entries that read as negative; everything
// else stays neutral so the feed does not turn into a wall of colour.
function isUnwoundEvent(event: TimelineEvent) {
  return (
    event.eventType === 'VISIT_CANCELLED' ||
    event.eventType === 'INVOICE_VOIDED' ||
    event.eventType === 'ADMISSION_CANCELLED' ||
    event.eventType === 'APPOINTMENT_CANCELLED' ||
    event.eventType === 'PATIENT_DEACTIVATED'
  );
}

export function TimelineEntry({ event, patientId }: { event: TimelineEvent; patientId: number }) {
  const Icon = SOURCE_ICONS[event.sourceType];
  const href = getTimelineEventHref(event, patientId);
  const title = getTimelineEventTitle(event);
  const context = getTimelineEventContext(event);
  const unwound = isUnwoundEvent(event);

  const body = (
    <div className="flex items-start gap-3">
      <span
        className={cn(
          'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border',
          unwound ? 'border-destructive/20 bg-destructive/10 text-destructive' : 'bg-muted/60'
        )}
      >
        <Icon className="size-4" aria-hidden />
      </span>

      <div className="min-w-0 flex-1 space-y-0.5">
        <p className={cn('truncate text-sm font-medium', unwound && 'text-destructive')}>{title}</p>
        {context ? <p className="text-muted-foreground truncate text-xs">{context}</p> : null}
      </div>

      <time
        dateTime={event.occurredAt}
        className="text-muted-foreground shrink-0 text-xs tabular-nums"
      >
        {formatTimelineTime(event.occurredAt)}
      </time>
    </div>
  );

  const shell = 'bg-card shadow-fluent-2 block rounded-xl border p-3 transition-colors';

  if (!href) {
    return <li className={shell}>{body}</li>;
  }

  return (
    <li>
      <Link
        href={href}
        className={cn(
          shell,
          'hover:bg-accent/50 focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none'
        )}
      >
        {body}
      </Link>
    </li>
  );
}
