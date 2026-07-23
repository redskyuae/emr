import type { TimelineEvent } from '@/app/api/lib/modules/patient-timeline/schemas/patient-timeline-schema';

// All Timeline Event wording lives here rather than in SQL, so phrasing can change
// without a migration (ADR 0041).

export function getTimelineEventTitle(event: TimelineEvent): string {
  switch (event.eventType) {
    case 'APPOINTMENT_BOOKED':
      return `Booking ${event.reference ?? ''}`.trim();
    case 'APPOINTMENT_CANCELLED':
      return `Booking ${event.reference ?? ''} cancelled`.trim();
    case 'VISIT_CHECKED_IN':
      return `Checked in · ${event.reference ?? 'Visit'}`;
    case 'VISIT_IN_CONSULTATION':
      return `In consultation · ${event.reference ?? 'Visit'}`;
    case 'VISIT_COMPLETED':
      return `Visit completed · ${event.reference ?? 'Visit'}`;
    case 'VISIT_CANCELLED':
      return `Visit cancelled · ${event.reference ?? 'Visit'}`;
    case 'ADMISSION_ADMITTED':
      return `Admitted · ${event.reference ?? 'Admission'}`;
    case 'ADMISSION_DISCHARGED':
      return `Discharged · ${event.reference ?? 'Admission'}`;
    case 'ADMISSION_CANCELLED':
      return `Admission cancelled · ${event.reference ?? 'Admission'}`;
    case 'BED_TRANSFERRED':
      return `Bed transfer · ${event.reference ?? 'Admission'}`;
    case 'INVOICE_FINALIZED':
      return `Invoice ${event.reference ?? ''} finalized`.trim();
    case 'INVOICE_VOIDED':
      return `Invoice ${event.reference ?? ''} voided`.trim();
    case 'PAYMENT_RECEIVED':
      return `Payment received · ${event.reference ?? ''}`.trim();
    case 'DOCUMENTS_UPLOADED':
      return getDocumentsTitle(event);
    case 'CLINICAL_NOTE_SIGNED':
      return `${event.sourceType === 'CLINICAL_NOTE' ? (event.detail ?? 'Clinical note') : 'Clinical note'} signed`;
    case 'PATIENT_REGISTERED':
      return 'Patient registered';
    case 'PATIENT_DEACTIVATED':
      return 'Patient deactivated';
    case 'PATIENT_REACTIVATED':
      return 'Patient reactivated';
  }
}

function getDocumentsTitle(event: TimelineEvent): string {
  if (event.sourceType !== 'VISIT_DOCUMENT') {
    return 'Documents uploaded';
  }

  // A count of one reads badly, so a lone document shows its file name instead.
  if (event.detailCount === 1 && event.detail) {
    return `${event.detail} uploaded`;
  }

  return `${event.detailCount} documents uploaded`;
}

export function formatTimelineAmount(amount: number | null): string | null {
  if (amount === null) {
    return null;
  }

  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

// The Doctor is shown as context — the record's Doctor — never as the actor who
// performed the transition, which the data does not record (ADR 0041).
export function getTimelineEventContext(event: TimelineEvent): string | null {
  switch (event.sourceType) {
    case 'VISIT':
    case 'ADMISSION':
      return event.doctorName;

    case 'APPOINTMENT':
      return [event.doctorName, event.detail ? `for ${formatSlotDate(event.detail)}` : null]
        .filter(Boolean)
        .join(' · ');

    case 'BED_TRANSFER':
      return event.detail ? `Moved to ${event.detail}` : null;

    case 'INVOICE':
      return formatTimelineAmount(event.amount);

    case 'PAYMENT':
      return [formatTimelineAmount(event.amount), event.detail].filter(Boolean).join(' · ');

    case 'VISIT_DOCUMENT':
      return event.reference;

    case 'CLINICAL_NOTE':
    case 'PATIENT':
      return null;
  }
}

function formatSlotDate(slotDate: string) {
  const parsed = new Date(`${slotDate}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return slotDate;
  }

  return parsed.toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// PATIENT events have no destination — the viewer is already on that page.
export function getTimelineEventHref(event: TimelineEvent, patientId: number): string | null {
  switch (event.sourceType) {
    case 'APPOINTMENT':
      return `/appointments?appointment=${event.sourceId}`;

    case 'VISIT':
      return `/visits/${event.sourceId}`;

    case 'VISIT_DOCUMENT':
      // Grouped per Visit, so sourceId is the Visit rather than a document.
      return `/visits/${event.sourceId}`;

    case 'ADMISSION':
      return `/admissions/${event.sourceId}`;

    case 'BED_TRANSFER':
      return `/admissions/${event.parentId}`;

    case 'INVOICE':
      return `/billing/${event.sourceId}`;

    case 'PAYMENT':
      return `/billing/${event.parentId}`;

    case 'CLINICAL_NOTE':
      return `/patients/${patientId}?tab=chart`;

    case 'PATIENT':
      return null;
  }
}

export function formatTimelineDayLabel(dayKey: string, today = new Date()): string {
  const parsed = new Date(`${dayKey}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return dayKey;
  }

  const dayDifference = Math.round(
    (startOfDay(today).getTime() - startOfDay(parsed).getTime()) / 86_400_000
  );

  if (dayDifference === 0) {
    return 'Today';
  }

  if (dayDifference === 1) {
    return 'Yesterday';
  }

  return parsed.toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function startOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

export function formatTimelineTime(isoInstant: string): string {
  return new Date(isoInstant).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
}
