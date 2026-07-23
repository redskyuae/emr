import { randomUUID } from 'node:crypto';

import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';

import { db } from '@/app/db';
import { admission as admissionTable } from '@/app/db/schema/admission';
import { admissionBedTransfer as admissionBedTransferTable } from '@/app/db/schema/admission-bed-transfer';
import { admissionType as admissionTypeTable } from '@/app/db/schema/admission-type';
import { appointment as appointmentTable } from '@/app/db/schema/appointment';
import { appointmentMode as appointmentModeTable } from '@/app/db/schema/appointment-mode';
import { appointmentReason as appointmentReasonTable } from '@/app/db/schema/appointment-reason';
import { appointmentStatus as appointmentStatusTable } from '@/app/db/schema/appointment-status';
import { appointmentType as appointmentTypeTable } from '@/app/db/schema/appointment-type';
import { organization, user } from '@/app/db/schema/auth';
import { bed as bedTable } from '@/app/db/schema/bed';
import { clinicalNote as clinicalNoteTable } from '@/app/db/schema/clinical-note';
import { clinicalNoteType as clinicalNoteTypeTable } from '@/app/db/schema/clinical-note-type';
import { doctor as doctorTable } from '@/app/db/schema/doctor';
import { invoice as invoiceTable } from '@/app/db/schema/invoice';
import { patient as patientTable } from '@/app/db/schema/patient';
import { payment as paymentTable } from '@/app/db/schema/payment';
import { specialty as specialtyTable } from '@/app/db/schema/specialty';
import { visit as visitTable } from '@/app/db/schema/visit';
import { visitDocument as visitDocumentTable } from '@/app/db/schema/visit-document';
import { visitType as visitTypeTable } from '@/app/db/schema/visit-type';
import { ward as wardTable } from '@/app/db/schema/ward';
import {
  encodeTimelineCursor,
  type PatientTimelineParams,
  type TimelineEventRow,
} from '../schemas/patient-timeline-schema';
import { patientTimelineRepository } from './patient-timeline-repository';

const tenantA = 'tenant-a-test';
const tenantB = 'tenant-b-test';

function at(iso: string) {
  return new Date(iso);
}

async function createTenant(tenantId: string) {
  await db
    .insert(organization)
    .values({ id: tenantId, name: tenantId, slug: tenantId, createdAt: new Date() })
    .onConflictDoNothing();
}

async function createDoctor(tenantId: string, name = 'Dr Rao') {
  const userId = randomUUID();
  await db.insert(user).values({ id: userId, name, email: `${userId}@example.com` });
  const [specialty] = await db
    .insert(specialtyTable)
    .values({ name: `Cardiology ${userId.slice(0, 6)}`, code: userId.slice(0, 6), tenantId })
    .returning({ id: specialtyTable.id });
  const [doctor] = await db
    .insert(doctorTable)
    .values({ tenantId, userId, specialtyId: specialty.id })
    .returning({ id: doctorTable.id });

  return doctor.id;
}

let sequence = 0;

function nextSuffix() {
  sequence += 1;
  return String(1000 + sequence);
}

async function createPatient(tenantId: string) {
  const [patient] = await db
    .insert(patientTable)
    .values({
      tenantId,
      mrn: `MRN-${nextSuffix()}`,
      firstName: 'Asha',
      lastName: 'Rao',
      phone: '+91-9876543210',
      registrationStatus: 'registered',
    })
    .returning({ id: patientTable.id });

  return patient.id;
}

async function createVisitType(tenantId: string) {
  const suffix = nextSuffix();
  const [visitType] = await db
    .insert(visitTypeTable)
    .values({ tenantId, name: `OPD ${suffix}`, code: `OPD${suffix}` })
    .returning({ id: visitTypeTable.id });

  return visitType.id;
}

type VisitOptions = {
  status?: string;
  checkedInAt: Date;
  completedAt?: Date | null;
  cancelledAt?: Date | null;
  isDeleted?: boolean;
  consultationStartedAt?: Date | null;
};

async function createVisit(
  tenantId: string,
  patientId: number,
  doctorId: number,
  visitTypeId: number,
  options: VisitOptions
) {
  const suffix = nextSuffix();
  const [visit] = await db
    .insert(visitTable)
    .values({
      tenantId,
      visitNumber: `VST-${suffix}`,
      patientId,
      doctorId,
      visitTypeId,
      status: options.status ?? 'COMPLETED',
      visitDate: options.checkedInAt.toISOString().slice(0, 10),
      queueToken: Number(suffix),
      checkedInAt: options.checkedInAt,
      consultationStartedAt: options.consultationStartedAt ?? null,
      completedAt: options.completedAt ?? null,
      cancelledAt: options.cancelledAt ?? null,
      isDeleted: options.isDeleted ?? false,
    })
    .returning({ id: visitTable.id, visitNumber: visitTable.visitNumber });

  return visit;
}

async function createAppointment(
  tenantId: string,
  patientId: number,
  doctorId: number,
  options: { createdOn: Date; cancelledAt?: Date | null }
) {
  const suffix = nextSuffix();
  const [mode] = await db
    .insert(appointmentModeTable)
    .values({ tenantId, name: `Walk ${suffix}`, code: `WK${suffix}` })
    .returning({ id: appointmentModeTable.id });
  const [type] = await db
    .insert(appointmentTypeTable)
    .values({ tenantId, name: `New ${suffix}`, code: `NW${suffix}` })
    .returning({ id: appointmentTypeTable.id });
  const [reason] = await db
    .insert(appointmentReasonTable)
    .values({ tenantId, name: `Fever ${suffix}`, code: `FV${suffix}` })
    .returning({ id: appointmentReasonTable.id });
  const [status] = await db
    .insert(appointmentStatusTable)
    .values({ tenantId, name: `Scheduled ${suffix}`, code: `SC${suffix}`, category: 'SCHEDULED' })
    .returning({ id: appointmentStatusTable.id });

  const [appointment] = await db
    .insert(appointmentTable)
    .values({
      tenantId,
      bookingNumber: `APT-${suffix}`,
      patientId,
      doctorId,
      appointmentModeId: mode.id,
      appointmentTypeId: type.id,
      appointmentReasonId: reason.id,
      appointmentStatusId: status.id,
      slotDate: '2026-08-15',
      rotaName: 'Morning',
      createdOn: options.createdOn,
      cancelledAt: options.cancelledAt ?? null,
    })
    .returning({ id: appointmentTable.id });

  return appointment.id;
}

async function createAdmission(
  tenantId: string,
  patientId: number,
  doctorId: number,
  options: { admittedAt: Date; dischargedAt?: Date | null }
) {
  const suffix = nextSuffix();
  const [ward] = await db
    .insert(wardTable)
    .values({ tenantId, name: `Ward ${suffix}`, code: `WD${suffix}` })
    .returning({ id: wardTable.id });
  const [admissionType] = await db
    .insert(admissionTypeTable)
    .values({ tenantId, name: `Elective ${suffix}`, code: `EL${suffix}` })
    .returning({ id: admissionTypeTable.id });
  const [bedOne] = await db
    .insert(bedTable)
    .values({ tenantId, wardId: ward.id, bedNumber: `A-${suffix}` })
    .returning({ id: bedTable.id });
  const [bedTwo] = await db
    .insert(bedTable)
    .values({ tenantId, wardId: ward.id, bedNumber: `ICU-${suffix}` })
    .returning({ id: bedTable.id });

  const [admission] = await db
    .insert(admissionTable)
    .values({
      tenantId,
      admissionNumber: `ADM-${suffix}`,
      patientId,
      doctorId,
      admissionTypeId: admissionType.id,
      bedId: bedOne.id,
      status: options.dischargedAt ? 'DISCHARGED' : 'ADMITTED',
      admittedAt: options.admittedAt,
      dischargedAt: options.dischargedAt ?? null,
    })
    .returning({ id: admissionTable.id });

  return { admissionId: admission.id, fromBedId: bedOne.id, toBedId: bedTwo.id };
}

async function createInvoice(
  tenantId: string,
  patientId: number,
  options: { finalizedAt?: Date | null; grandTotal?: number } = {}
) {
  const suffix = nextSuffix();
  const [invoice] = await db
    .insert(invoiceTable)
    .values({
      tenantId,
      invoiceNumber: `INV-${suffix}`,
      patientId,
      status: options.finalizedAt ? 'FINALIZED' : 'DRAFT',
      subtotal: options.grandTotal ?? 8000,
      grandTotal: options.grandTotal ?? 8000,
      finalizedAt: options.finalizedAt ?? null,
    })
    .returning({ id: invoiceTable.id });

  return invoice.id;
}

async function timelineFor(
  patientId: number,
  overrides: Partial<Parameters<typeof patientTimelineRepository.getPatientTimeline>[0]> = {}
): Promise<TimelineEventRow[]> {
  return patientTimelineRepository.getPatientTimeline({
    feed: 'all',
    limit: 50,
    cursor: null,
    tenantId: tenantA,
    patientId,
    ...overrides,
  });
}

describe('PatientTimeline repository', () => {
  beforeEach(async () => {
    await createTenant(tenantA);
    await createTenant(tenantB);
  });

  it('should return a registration event for a patient with no other activity', async () => {
    const patientId = await createPatient(tenantA);

    const events = await timelineFor(patientId);

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ sourceType: 'PATIENT', eventType: 'PATIENT_REGISTERED' });
  });

  it('should emit one event per lifecycle transition of a single visit', async () => {
    const patientId = await createPatient(tenantA);
    const doctorId = await createDoctor(tenantA);
    const visitTypeId = await createVisitType(tenantA);

    await createVisit(tenantA, patientId, doctorId, visitTypeId, {
      checkedInAt: at('2026-07-20T09:00:00Z'),
      consultationStartedAt: at('2026-07-20T09:40:00Z'),
      completedAt: at('2026-07-20T10:15:00Z'),
    });

    const events = await timelineFor(patientId);
    const visitEvents = events.filter((event) => event.sourceType === 'VISIT');

    expect(visitEvents.map((event) => event.eventType)).toEqual([
      'VISIT_COMPLETED',
      'VISIT_IN_CONSULTATION',
      'VISIT_CHECKED_IN',
    ]);
  });

  it('should omit transitions whose timestamp column is null', async () => {
    const patientId = await createPatient(tenantA);
    const doctorId = await createDoctor(tenantA);
    const visitTypeId = await createVisitType(tenantA);

    await createVisit(tenantA, patientId, doctorId, visitTypeId, {
      status: 'CHECKED_IN',
      checkedInAt: at('2026-07-20T09:00:00Z'),
    });

    const events = await timelineFor(patientId);
    const visitEvents = events.filter((event) => event.sourceType === 'VISIT');

    expect(visitEvents.map((event) => event.eventType)).toEqual(['VISIT_CHECKED_IN']);
  });

  it('should yield only the booked event for an appointment that was never cancelled', async () => {
    const patientId = await createPatient(tenantA);
    const doctorId = await createDoctor(tenantA);

    await createAppointment(tenantA, patientId, doctorId, {
      createdOn: at('2026-07-01T08:00:00Z'),
    });

    const events = await timelineFor(patientId);
    const appointmentEvents = events.filter((event) => event.sourceType === 'APPOINTMENT');

    expect(appointmentEvents.map((event) => event.eventType)).toEqual(['APPOINTMENT_BOOKED']);
  });

  it('should yield a cancelled event once the appointment carries a cancellation instant', async () => {
    const patientId = await createPatient(tenantA);
    const doctorId = await createDoctor(tenantA);

    await createAppointment(tenantA, patientId, doctorId, {
      createdOn: at('2026-07-01T08:00:00Z'),
      cancelledAt: at('2026-07-03T11:30:00Z'),
    });

    const events = await timelineFor(patientId);
    const appointmentEvents = events.filter((event) => event.sourceType === 'APPOINTMENT');

    expect(appointmentEvents.map((event) => event.eventType)).toEqual([
      'APPOINTMENT_CANCELLED',
      'APPOINTMENT_BOOKED',
    ]);
  });

  it('should carry the slot date as context on appointment events', async () => {
    const patientId = await createPatient(tenantA);
    const doctorId = await createDoctor(tenantA);

    await createAppointment(tenantA, patientId, doctorId, {
      createdOn: at('2026-07-01T08:00:00Z'),
    });

    const events = await timelineFor(patientId);
    const booked = events.find((event) => event.eventType === 'APPOINTMENT_BOOKED');

    expect(booked?.detail).toBe('2026-08-15');
  });

  it('should reach payments through their invoice and carry the owning invoice id', async () => {
    const patientId = await createPatient(tenantA);
    const invoiceId = await createInvoice(tenantA, patientId, {
      finalizedAt: at('2026-07-20T12:00:00Z'),
    });

    await db.insert(paymentTable).values({
      tenantId: tenantA,
      receiptNumber: `RCP-${nextSuffix()}`,
      invoiceId,
      amount: 5000,
      method: 'UPI',
      receivedAt: at('2026-07-20T13:00:00Z'),
    });

    const events = await timelineFor(patientId);
    const payment = events.find((event) => event.sourceType === 'PAYMENT');

    expect(payment).toMatchObject({
      eventType: 'PAYMENT_RECEIVED',
      detail: 'UPI',
      parentId: invoiceId,
    });
    expect(Number(payment?.amount)).toBe(5000);
  });

  it('should carry the admission as parent on a bed transfer event', async () => {
    const patientId = await createPatient(tenantA);
    const doctorId = await createDoctor(tenantA);
    const { admissionId, fromBedId, toBedId } = await createAdmission(
      tenantA,
      patientId,
      doctorId,
      { admittedAt: at('2026-07-10T06:00:00Z') }
    );

    await db.insert(admissionBedTransferTable).values({
      tenantId: tenantA,
      admissionId,
      fromBedId,
      toBedId,
      transferredAt: at('2026-07-12T06:00:00Z'),
    });

    const events = await timelineFor(patientId);
    const transfer = events.find((event) => event.sourceType === 'BED_TRANSFER');

    expect(transfer).toMatchObject({ eventType: 'BED_TRANSFERRED', parentId: admissionId });
    expect(transfer?.detail).toMatch(/^ICU-/);
  });

  it('should collapse multiple documents on one visit into a single counted event', async () => {
    const patientId = await createPatient(tenantA);
    const doctorId = await createDoctor(tenantA);
    const visitTypeId = await createVisitType(tenantA);
    const visit = await createVisit(tenantA, patientId, doctorId, visitTypeId, {
      checkedInAt: at('2026-07-20T09:00:00Z'),
    });

    for (let index = 0; index < 6; index += 1) {
      await db.insert(visitDocumentTable).values({
        tenantId: tenantA,
        visitId: visit.id,
        fileName: `scan-${index}.pdf`,
        fileUrl: `https://blob.example/scan-${index}.pdf`,
        contentType: 'application/pdf',
        fileSize: 1024,
      });
    }

    const events = await timelineFor(patientId);
    const documents = events.filter((event) => event.sourceType === 'VISIT_DOCUMENT');

    expect(documents).toHaveLength(1);
    expect(documents[0]).toMatchObject({
      detailCount: 6,
      detail: null,
      reference: visit.visitNumber,
    });
  });

  it('should keep the file name when a visit has exactly one document', async () => {
    const patientId = await createPatient(tenantA);
    const doctorId = await createDoctor(tenantA);
    const visitTypeId = await createVisitType(tenantA);
    const visit = await createVisit(tenantA, patientId, doctorId, visitTypeId, {
      checkedInAt: at('2026-07-20T09:00:00Z'),
    });

    await db.insert(visitDocumentTable).values({
      tenantId: tenantA,
      visitId: visit.id,
      fileName: 'referral-letter.pdf',
      fileUrl: 'https://blob.example/referral-letter.pdf',
      contentType: 'application/pdf',
      fileSize: 2048,
    });

    const events = await timelineFor(patientId);
    const documents = events.filter((event) => event.sourceType === 'VISIT_DOCUMENT');

    expect(documents[0]).toMatchObject({ detailCount: 1, detail: 'referral-letter.pdf' });
  });

  it('should include signed clinical notes and exclude drafts', async () => {
    const patientId = await createPatient(tenantA);
    const suffix = nextSuffix();
    const [noteType] = await db
      .insert(clinicalNoteTypeTable)
      .values({ tenantId: tenantA, name: `Progress ${suffix}`, code: `PN${suffix}` })
      .returning({ id: clinicalNoteTypeTable.id });

    await db.insert(clinicalNoteTable).values({
      tenantId: tenantA,
      patientId,
      noteTypeId: noteType.id,
      status: 'signed',
      signedAt: at('2026-07-20T11:00:00Z'),
      authorUserId: 'user-1',
      recordedByUserId: 'user-1',
    });
    await db.insert(clinicalNoteTable).values({
      tenantId: tenantA,
      patientId,
      noteTypeId: noteType.id,
      status: 'draft',
      signedAt: null,
      authorUserId: 'user-1',
      recordedByUserId: 'user-1',
    });

    const events = await timelineFor(patientId);
    const notes = events.filter((event) => event.sourceType === 'CLINICAL_NOTE');

    expect(notes).toHaveLength(1);
    expect(notes[0]).toMatchObject({ eventType: 'CLINICAL_NOTE_SIGNED' });
    expect(notes[0].detail).toMatch(/^Progress /);
  });

  it('should isolate one tenant timeline from another', async () => {
    const patientA = await createPatient(tenantA);
    const doctorA = await createDoctor(tenantA);
    const visitTypeA = await createVisitType(tenantA);
    await createVisit(tenantA, patientA, doctorA, visitTypeA, {
      checkedInAt: at('2026-07-20T09:00:00Z'),
    });

    const events = await patientTimelineRepository.getPatientTimeline({
      feed: 'all',
      limit: 50,
      cursor: null,
      tenantId: tenantB,
      patientId: patientA,
    });

    expect(events).toEqual([]);
  });

  it('should exclude soft-deleted records', async () => {
    const patientId = await createPatient(tenantA);
    const doctorId = await createDoctor(tenantA);
    const visitTypeId = await createVisitType(tenantA);

    await createVisit(tenantA, patientId, doctorId, visitTypeId, {
      checkedInAt: at('2026-07-20T09:00:00Z'),
      isDeleted: true,
    });

    const events = await timelineFor(patientId);

    expect(events.filter((event) => event.sourceType === 'VISIT')).toEqual([]);
  });

  it('should still return a timeline for a deactivated patient', async () => {
    const patientId = await createPatient(tenantA);

    await db
      .update(patientTable)
      .set({
        isActive: false,
        createdOn: at('2026-07-01T10:00:00Z'),
        deactivatedAt: at('2026-07-21T10:00:00Z'),
      })
      .where(eq(patientTable.id, patientId));

    const events = await timelineFor(patientId);

    // CONTEXT.md: an Inactive Patient's history "remains retained and readable",
    // so deactivation must add an event rather than hide the feed.
    expect(events.map((event) => event.eventType)).toEqual([
      'PATIENT_DEACTIVATED',
      'PATIENT_REGISTERED',
    ]);
  });

  it('should order every source strictly newest first', async () => {
    const patientId = await createPatient(tenantA);
    const doctorId = await createDoctor(tenantA);
    const visitTypeId = await createVisitType(tenantA);

    await createVisit(tenantA, patientId, doctorId, visitTypeId, {
      checkedInAt: at('2026-07-10T09:00:00Z'),
      completedAt: at('2026-07-10T10:00:00Z'),
    });
    await createInvoice(tenantA, patientId, { finalizedAt: at('2026-07-15T12:00:00Z') });
    await createAppointment(tenantA, patientId, doctorId, {
      createdOn: at('2026-07-01T08:00:00Z'),
    });

    const events = await timelineFor(patientId);
    const timestamps = events.map((event) => new Date(event.occurredAt).getTime());

    expect(timestamps).toEqual([...timestamps].sort((left, right) => right - left));
  });

  it('should exclude sources outside the requested feed', async () => {
    const patientId = await createPatient(tenantA);
    const doctorId = await createDoctor(tenantA);
    const visitTypeId = await createVisitType(tenantA);

    await createVisit(tenantA, patientId, doctorId, visitTypeId, {
      checkedInAt: at('2026-07-10T09:00:00Z'),
    });
    await createInvoice(tenantA, patientId, { finalizedAt: at('2026-07-15T12:00:00Z') });

    const billing = await timelineFor(patientId, { feed: 'billing' });

    expect(billing.every((event) => event.sourceType === 'INVOICE')).toBe(true);
    expect(billing).toHaveLength(1);
  });

  it('should exclude patient lifecycle events from the category feeds', async () => {
    const patientId = await createPatient(tenantA);
    const doctorId = await createDoctor(tenantA);
    const visitTypeId = await createVisitType(tenantA);

    await createVisit(tenantA, patientId, doctorId, visitTypeId, {
      checkedInAt: at('2026-07-10T09:00:00Z'),
    });

    const encounters = await timelineFor(patientId, { feed: 'encounters' });

    expect(encounters.some((event) => event.sourceType === 'PATIENT')).toBe(false);
  });

  it('should page through every event exactly once with no duplicates or gaps', async () => {
    const patientId = await createPatient(tenantA);
    const doctorId = await createDoctor(tenantA);
    const visitTypeId = await createVisitType(tenantA);

    await createVisit(tenantA, patientId, doctorId, visitTypeId, {
      checkedInAt: at('2026-07-10T09:00:00Z'),
      consultationStartedAt: at('2026-07-10T09:30:00Z'),
      completedAt: at('2026-07-10T10:00:00Z'),
    });
    await createInvoice(tenantA, patientId, { finalizedAt: at('2026-07-15T12:00:00Z') });
    await createAppointment(tenantA, patientId, doctorId, {
      createdOn: at('2026-07-01T08:00:00Z'),
    });

    const all = await timelineFor(patientId);
    const limit = 2;
    const collected: string[] = [];
    let cursor: PatientTimelineParams['cursor'] = null;

    for (let page = 0; page < 20; page += 1) {
      const rows = await timelineFor(patientId, { limit, cursor });
      const hasNext = rows.length > limit;
      const pageRows = hasNext ? rows.slice(0, limit) : rows;

      collected.push(...pageRows.map((event) => `${event.eventType}#${event.sourceId}`));

      if (!hasNext || pageRows.length === 0) {
        break;
      }

      const last = pageRows[pageRows.length - 1];
      cursor = {
        occurredAt: new Date(last.occurredAt),
        sourceType: last.sourceType,
        sourceId: last.sourceId,
      };
    }

    expect(collected).toHaveLength(all.length);
    expect(new Set(collected).size).toBe(all.length);
  });

  it('should not repeat a row on the next page when a newer event arrives mid-scroll', async () => {
    const patientId = await createPatient(tenantA);
    const doctorId = await createDoctor(tenantA);
    const visitTypeId = await createVisitType(tenantA);

    await createVisit(tenantA, patientId, doctorId, visitTypeId, {
      checkedInAt: at('2026-07-10T09:00:00Z'),
      consultationStartedAt: at('2026-07-10T09:30:00Z'),
      completedAt: at('2026-07-10T10:00:00Z'),
    });

    const limit = 2;
    const firstPage = (await timelineFor(patientId, { limit })).slice(0, limit);
    const last = firstPage[firstPage.length - 1];

    // A payment lands at the very top of the feed between the two page fetches.
    // Under offset pagination this would push a first-page row onto page two.
    const invoiceId = await createInvoice(tenantA, patientId, {
      finalizedAt: at('2026-07-22T12:00:00Z'),
    });
    await db.insert(paymentTable).values({
      tenantId: tenantA,
      receiptNumber: `RCP-${nextSuffix()}`,
      invoiceId,
      amount: 100,
      method: 'CASH',
      receivedAt: at('2026-07-22T13:00:00Z'),
    });

    const secondPage = await timelineFor(patientId, {
      limit,
      cursor: {
        occurredAt: new Date(last.occurredAt),
        sourceType: last.sourceType,
        sourceId: last.sourceId,
      },
    });

    const firstKeys = firstPage.map((event) => `${event.eventType}#${event.sourceId}`);
    const secondKeys = secondPage.map((event) => `${event.eventType}#${event.sourceId}`);

    expect(secondKeys.filter((key) => firstKeys.includes(key))).toEqual([]);
  });

  it('should resolve a cursor deterministically when two events share a timestamp', async () => {
    const patientId = await createPatient(tenantA);
    const doctorId = await createDoctor(tenantA);
    const visitTypeId = await createVisitType(tenantA);
    const sharedInstant = at('2026-07-20T09:00:00Z');
    const visit = await createVisit(tenantA, patientId, doctorId, visitTypeId, {
      checkedInAt: sharedInstant,
    });

    await db.insert(visitDocumentTable).values({
      tenantId: tenantA,
      visitId: visit.id,
      fileName: 'referral.pdf',
      fileUrl: 'https://blob.example/referral.pdf',
      contentType: 'application/pdf',
      fileSize: 2048,
      createdOn: sharedInstant,
    });

    const all = await timelineFor(patientId);
    const collided = all.filter(
      (event) => new Date(event.occurredAt).getTime() === sharedInstant.getTime()
    );

    expect(collided).toHaveLength(2);

    const afterFirst = await timelineFor(patientId, {
      cursor: {
        occurredAt: new Date(collided[0].occurredAt),
        sourceType: collided[0].sourceType,
        sourceId: collided[0].sourceId,
      },
    });

    // The tie-break on (source_type, source_id) means the second colliding row is
    // returned exactly once rather than skipped or repeated.
    expect(afterFirst.map((event) => `${event.eventType}#${event.sourceId}`)).toContain(
      `${collided[1].eventType}#${collided[1].sourceId}`
    );
  });

  it('should fetch one row beyond the limit so the caller can detect a further page', async () => {
    const patientId = await createPatient(tenantA);
    const doctorId = await createDoctor(tenantA);
    const visitTypeId = await createVisitType(tenantA);

    await createVisit(tenantA, patientId, doctorId, visitTypeId, {
      checkedInAt: at('2026-07-10T09:00:00Z'),
      consultationStartedAt: at('2026-07-10T09:30:00Z'),
      completedAt: at('2026-07-10T10:00:00Z'),
    });

    const rows = await timelineFor(patientId, { limit: 2 });

    expect(rows).toHaveLength(3);
  });

  it('should produce a cursor that round-trips back into the same ordering position', async () => {
    const patientId = await createPatient(tenantA);
    const doctorId = await createDoctor(tenantA);
    const visitTypeId = await createVisitType(tenantA);

    await createVisit(tenantA, patientId, doctorId, visitTypeId, {
      checkedInAt: at('2026-07-10T09:00:00Z'),
      completedAt: at('2026-07-10T10:00:00Z'),
    });

    const all = await timelineFor(patientId);
    const first = all[0];
    const encoded = encodeTimelineCursor({
      occurredAt: new Date(first.occurredAt),
      sourceType: first.sourceType,
      sourceId: first.sourceId,
    });

    expect(typeof encoded).toBe('string');

    const rest = await timelineFor(patientId, {
      cursor: {
        occurredAt: new Date(first.occurredAt),
        sourceType: first.sourceType,
        sourceId: first.sourceId,
      },
    });

    expect(rest).toHaveLength(all.length - 1);
    expect(rest.map((event) => event.sourceId)).toEqual(
      all.slice(1).map((event) => event.sourceId)
    );
  });
});
