import { randomUUID } from 'node:crypto';

import { beforeEach, describe, expect, it } from 'vitest';

import { db } from '@/app/db';
import { admission as admissionTable } from '@/app/db/schema/admission';
import { admissionType as admissionTypeTable } from '@/app/db/schema/admission-type';
import { organization, user } from '@/app/db/schema/auth';
import { bed as bedTable } from '@/app/db/schema/bed';
import { doctor as doctorTable } from '@/app/db/schema/doctor';
import { patient as patientTable } from '@/app/db/schema/patient';
import { room as roomTable } from '@/app/db/schema/room';
import { roomType as roomTypeTable } from '@/app/db/schema/room-type';
import { specialty as specialtyTable } from '@/app/db/schema/specialty';
import { ward as wardTable } from '@/app/db/schema/ward';
import { chargeItemRepository } from '../../charge-item/repository/charge-item-repository';
import { invoiceRepository } from './invoice-repository';

const tenantA = 'tenant-a-test';
const tenantB = 'tenant-b-test';

async function seedTenant(tenantId: string) {
  await db
    .insert(organization)
    .values({ id: tenantId, name: tenantId, slug: tenantId, createdAt: new Date() })
    .onConflictDoNothing();
}

let mrnSequence = 0;

async function seedPatient(tenantId: string) {
  mrnSequence += 1;
  const [patient] = await db
    .insert(patientTable)
    .values({
      tenantId,
      mrn: `MRN-${String(1000 + mrnSequence)}`,
      firstName: 'Asha',
      lastName: 'Rao',
      phone: '+91-9876543210',
      registrationStatus: 'registered',
    })
    .returning({ id: patientTable.id });

  return patient.id;
}

async function seedChargeItem(tenantId: string, code: string, unitPrice: number) {
  const chargeItem = await chargeItemRepository.createChargeItem({
    tenantId,
    name: `Item ${code}`,
    code,
    category: 'PROCEDURE',
    unitPrice,
    description: undefined,
    isActive: true,
  });

  return chargeItem.id;
}

async function seedDraftInvoice(tenantId: string, patientId?: number) {
  const resolvedPatientId = patientId ?? (await seedPatient(tenantId));
  return invoiceRepository.createInvoice({
    tenantId,
    patientId: resolvedPatientId,
    notes: undefined,
  });
}

async function seedDoctor(tenantId: string) {
  const userId = randomUUID();
  await db.insert(user).values({ id: userId, name: 'Dr Mehta', email: `${userId}@example.com` });
  const [specialty] = await db
    .insert(specialtyTable)
    .values({ tenantId, name: `Cardiology ${userId.slice(0, 6)}`, code: userId.slice(0, 6) })
    .returning({ id: specialtyTable.id });
  const [doctor] = await db
    .insert(doctorTable)
    .values({ tenantId, userId, specialtyId: specialty.id })
    .returning({ id: doctorTable.id });

  return doctor.id;
}

async function seedAdmissionType(tenantId: string) {
  const [admissionType] = await db
    .insert(admissionTypeTable)
    .values({ tenantId, name: 'Emergency', code: 'EMER' })
    .returning({ id: admissionTypeTable.id });

  return admissionType.id;
}

beforeEach(async () => {
  await seedTenant(tenantA);
  await seedTenant(tenantB);
});

describe('Invoice repository', () => {
  it('should create a draft invoice with a tenant-scoped INV number', async () => {
    const first = await seedDraftInvoice(tenantA);
    const second = await seedDraftInvoice(tenantA);
    const other = await seedDraftInvoice(tenantB);

    expect(first.invoiceNumber).toBe('INV-1001');
    expect(second.invoiceNumber).toBe('INV-1002');
    expect(other.invoiceNumber).toBe('INV-1001');
    expect(first.status).toBe('DRAFT');
    expect(first.balanceDue).toBe(0);
  });

  it('should not read an invoice belonging to another tenant', async () => {
    const invoice = await seedDraftInvoice(tenantA);

    await expect(invoiceRepository.getInvoiceById(tenantB, invoice.id)).resolves.toBeUndefined();
  });

  it('should snapshot line description and price and recompute totals', async () => {
    const invoice = await seedDraftInvoice(tenantA);
    const chargeItemId = await seedChargeItem(tenantA, 'CONS', 500);

    const result = await invoiceRepository.addInvoiceLine(tenantA, invoice.id, {
      chargeItemId,
      description: 'General Consultation',
      quantity: 2,
      unitPrice: 500,
    });

    expect(result.outcome).toBe('updated');
    if (result.outcome !== 'updated') return;
    expect(result.data.subtotal).toBe(1000);
    expect(result.data.grandTotal).toBe(1000);
    expect(result.data.lines).toHaveLength(1);
    expect(result.data.lines[0]).toMatchObject({
      description: 'General Consultation',
      quantity: 2,
      unitPrice: 500,
      amount: 1000,
      source: 'MANUAL',
    });
  });

  it('should clamp the discount down when a line removal drops the subtotal below it', async () => {
    const invoice = await seedDraftInvoice(tenantA);
    const chargeItemId = await seedChargeItem(tenantA, 'PROC', 600);

    await invoiceRepository.addInvoiceLine(tenantA, invoice.id, {
      chargeItemId,
      description: 'Procedure A',
      quantity: 1,
      unitPrice: 600,
    });
    const withSecond = await invoiceRepository.addInvoiceLine(tenantA, invoice.id, {
      chargeItemId,
      description: 'Procedure B',
      quantity: 1,
      unitPrice: 600,
    });
    if (withSecond.outcome !== 'updated') throw new Error('expected updated');

    await invoiceRepository.updateDraftInvoice(tenantA, invoice.id, { discountAmount: 900 });

    const lineToRemove = withSecond.data.lines[0].id;
    const removed = await invoiceRepository.removeInvoiceLine(tenantA, invoice.id, lineToRemove);

    expect(removed.outcome).toBe('updated');
    if (removed.outcome !== 'updated') return;
    expect(removed.data.subtotal).toBe(600);
    expect(removed.data.discountAmount).toBe(600);
    expect(removed.data.grandTotal).toBe(0);
  });

  it('should finalize a draft with lines and reject edits afterwards', async () => {
    const invoice = await seedDraftInvoice(tenantA);
    const chargeItemId = await seedChargeItem(tenantA, 'CONS', 500);
    await invoiceRepository.addInvoiceLine(tenantA, invoice.id, {
      chargeItemId,
      description: 'Consultation',
      quantity: 1,
      unitPrice: 500,
    });

    const finalized = await invoiceRepository.finalizeInvoice(tenantA, invoice.id);
    expect(finalized.outcome).toBe('finalized');
    if (finalized.outcome !== 'finalized') return;
    expect(finalized.data.status).toBe('FINALIZED');
    expect(finalized.data.finalizedAt).not.toBeNull();

    const edit = await invoiceRepository.addInvoiceLine(tenantA, invoice.id, {
      chargeItemId,
      description: 'Late add',
      quantity: 1,
      unitPrice: 100,
    });
    expect(edit.outcome).toBe('not-draft');
  });

  it('should finalize a zero-total invoice straight to PAID', async () => {
    const invoice = await seedDraftInvoice(tenantA);
    const chargeItemId = await seedChargeItem(tenantA, 'FREE', 0);
    await invoiceRepository.addInvoiceLine(tenantA, invoice.id, {
      chargeItemId,
      description: 'Free camp',
      quantity: 1,
      unitPrice: 0,
    });

    const finalized = await invoiceRepository.finalizeInvoice(tenantA, invoice.id);
    if (finalized.outcome !== 'finalized') throw new Error('expected finalized');
    expect(finalized.data.status).toBe('PAID');
    expect(finalized.data.balanceDue).toBe(0);
  });

  it('should refuse to finalize a draft left with zero lines, even without the validator pre-check', async () => {
    // Reproduces the race the validator's own (unlocked) line-count read cannot
    // close: a line is removed after validation passes but before the finalize
    // transaction acquires its row lock. Calling the repository directly here
    // (skipping validateFinalizeInvoice) simulates exactly that window and
    // proves the transactional guard inside finalizeInvoice is the real backstop.
    const invoice = await seedDraftInvoice(tenantA);
    const chargeItemId = await seedChargeItem(tenantA, 'CONS', 500);
    const withLine = await invoiceRepository.addInvoiceLine(tenantA, invoice.id, {
      chargeItemId,
      description: 'Consultation',
      quantity: 1,
      unitPrice: 500,
    });
    if (withLine.outcome !== 'updated') throw new Error('expected updated');

    await invoiceRepository.removeInvoiceLine(tenantA, invoice.id, withLine.data.lines[0].id);

    const finalized = await invoiceRepository.finalizeInvoice(tenantA, invoice.id);
    expect(finalized.outcome).toBe('no-lines');
    if (finalized.outcome !== 'no-lines') return;
    expect(finalized.data.status).toBe('DRAFT');
  });

  it('should record partial then full payments with RCP numbers and status sync', async () => {
    const invoice = await seedDraftInvoice(tenantA);
    const chargeItemId = await seedChargeItem(tenantA, 'CONS', 800);
    await invoiceRepository.addInvoiceLine(tenantA, invoice.id, {
      chargeItemId,
      description: 'Consultation',
      quantity: 1,
      unitPrice: 800,
    });
    await invoiceRepository.finalizeInvoice(tenantA, invoice.id);

    const first = await invoiceRepository.recordPayment(tenantA, invoice.id, {
      amount: 300,
      method: 'CASH',
    });
    expect(first.outcome).toBe('recorded');
    if (first.outcome !== 'recorded') return;
    expect(first.payment.receiptNumber).toBe('RCP-1001');
    expect(first.data.status).toBe('PARTIALLY_PAID');
    expect(first.data.amountPaid).toBe(300);
    expect(first.data.balanceDue).toBe(500);

    const second = await invoiceRepository.recordPayment(tenantA, invoice.id, {
      amount: 500,
      method: 'UPI',
    });
    if (second.outcome !== 'recorded') throw new Error('expected recorded');
    expect(second.payment.receiptNumber).toBe('RCP-1002');
    expect(second.data.status).toBe('PAID');
    expect(second.data.balanceDue).toBe(0);
  });

  it('should reject a payment that exceeds the balance due', async () => {
    const invoice = await seedDraftInvoice(tenantA);
    const chargeItemId = await seedChargeItem(tenantA, 'CONS', 500);
    await invoiceRepository.addInvoiceLine(tenantA, invoice.id, {
      chargeItemId,
      description: 'Consultation',
      quantity: 1,
      unitPrice: 500,
    });
    await invoiceRepository.finalizeInvoice(tenantA, invoice.id);

    const result = await invoiceRepository.recordPayment(tenantA, invoice.id, {
      amount: 600,
      method: 'CASH',
    });
    expect(result.outcome).toBe('over-balance');
  });

  it('should not record a payment on a draft invoice', async () => {
    const invoice = await seedDraftInvoice(tenantA);

    const result = await invoiceRepository.recordPayment(tenantA, invoice.id, {
      amount: 100,
      method: 'CASH',
    });
    expect(result.outcome).toBe('not-payable');
  });

  it('should void an unpaid finalized invoice but not one with payments', async () => {
    const invoice = await seedDraftInvoice(tenantA);
    const chargeItemId = await seedChargeItem(tenantA, 'CONS', 500);
    await invoiceRepository.addInvoiceLine(tenantA, invoice.id, {
      chargeItemId,
      description: 'Consultation',
      quantity: 1,
      unitPrice: 500,
    });
    await invoiceRepository.finalizeInvoice(tenantA, invoice.id);

    const voided = await invoiceRepository.voidInvoice(tenantA, invoice.id, 'Duplicate bill');
    expect(voided.outcome).toBe('voided');

    const second = await seedDraftInvoice(tenantA);
    await invoiceRepository.addInvoiceLine(tenantA, second.id, {
      chargeItemId,
      description: 'Consultation',
      quantity: 1,
      unitPrice: 500,
    });
    await invoiceRepository.finalizeInvoice(tenantA, second.id);
    await invoiceRepository.recordPayment(tenantA, second.id, { amount: 100, method: 'CASH' });

    const rejected = await invoiceRepository.voidInvoice(tenantA, second.id, 'Too late');
    expect(rejected.outcome).toBe('not-voidable');
  });

  it('should soft-delete a draft but not a finalized invoice', async () => {
    const draft = await seedDraftInvoice(tenantA);
    const deleted = await invoiceRepository.deleteInvoice(tenantA, draft.id);
    expect(deleted.outcome).toBe('deleted');
    await expect(invoiceRepository.getInvoiceById(tenantA, draft.id)).resolves.toBeUndefined();

    const finalizable = await seedDraftInvoice(tenantA);
    const chargeItemId = await seedChargeItem(tenantA, 'CONS', 500);
    await invoiceRepository.addInvoiceLine(tenantA, finalizable.id, {
      chargeItemId,
      description: 'Consultation',
      quantity: 1,
      unitPrice: 500,
    });
    await invoiceRepository.finalizeInvoice(tenantA, finalizable.id);

    const blocked = await invoiceRepository.deleteInvoice(tenantA, finalizable.id);
    expect(blocked.outcome).toBe('not-deletable');
  });

  it('should list only the tenant invoices filtered by status', async () => {
    const paid = await seedDraftInvoice(tenantA);
    const chargeItemId = await seedChargeItem(tenantA, 'CONS', 500);
    await invoiceRepository.addInvoiceLine(tenantA, paid.id, {
      chargeItemId,
      description: 'Consultation',
      quantity: 1,
      unitPrice: 500,
    });
    await invoiceRepository.finalizeInvoice(tenantA, paid.id);
    await seedDraftInvoice(tenantA);
    await seedDraftInvoice(tenantB);

    const drafts = await invoiceRepository.getInvoices({ tenantId: tenantA, statuses: ['DRAFT'] });
    expect(drafts.total).toBe(1);
    expect(drafts.data[0].status).toBe('DRAFT');

    const all = await invoiceRepository.getInvoices({ tenantId: tenantA });
    expect(all.total).toBe(2);
  });

  it('should derive occupancy segments and replace only BED_AUTO lines idempotently', async () => {
    const patientId = await seedPatient(tenantA);
    const [ward] = await db
      .insert(wardTable)
      .values({ tenantId: tenantA, name: 'ICU', code: 'ICU' })
      .returning({ id: wardTable.id });
    const [roomType] = await db
      .insert(roomTypeTable)
      .values({
        tenantId: tenantA,
        name: 'ICU Room',
        code: 'ICUR',
        color: '#2563EB',
        dailyRate: 5000,
      })
      .returning({ id: roomTypeTable.id });
    const [room] = await db
      .insert(roomTable)
      .values({ tenantId: tenantA, roomNumber: 'R-1', roomTypeId: roomType.id, status: 'OCCUPIED' })
      .returning({ id: roomTable.id });
    const [bed] = await db
      .insert(bedTable)
      .values({
        tenantId: tenantA,
        bedNumber: 'ICU-01',
        wardId: ward.id,
        roomId: room.id,
        status: 'OCCUPIED',
      })
      .returning({ id: bedTable.id });
    const doctorId = await seedDoctor(tenantA);
    const admissionTypeId = await seedAdmissionType(tenantA);
    const [admission] = await db
      .insert(admissionTable)
      .values({
        tenantId: tenantA,
        admissionNumber: 'ADM-1001',
        patientId,
        doctorId,
        admissionTypeId,
        bedId: bed.id,
        status: 'DISCHARGED',
        admittedAt: new Date('2026-03-10T04:00:00Z'),
        dischargedAt: new Date('2026-03-13T04:00:00Z'),
        dischargeDisposition: 'ROUTINE',
      })
      .returning({ id: admissionTable.id });

    const source = await invoiceRepository.getOccupancySource(tenantA, admission.id);
    expect(source?.beds).toHaveLength(1);
    expect(source?.beds[0]).toMatchObject({
      bedNumber: 'ICU-01',
      wardCode: 'ICU',
      dailyRate: 5000,
    });

    const invoice = await seedDraftInvoice(tenantA, patientId);
    const manualCharge = await seedChargeItem(tenantA, 'MISC', 200);
    await invoiceRepository.addInvoiceLine(tenantA, invoice.id, {
      chargeItemId: manualCharge,
      description: 'Misc',
      quantity: 1,
      unitPrice: 200,
    });

    const firstGen = await invoiceRepository.replaceBedAutoLines(tenantA, invoice.id, [
      {
        description: 'Bed charges — ICU-01 (ICU), 3 days @ 5000.00',
        quantity: 3,
        unitPrice: 5000,
        amount: 15000,
      },
    ]);
    if (firstGen.outcome !== 'updated') throw new Error('expected updated');
    expect(firstGen.data.lines.filter((line) => line.source === 'BED_AUTO')).toHaveLength(1);
    expect(firstGen.data.lines.filter((line) => line.source === 'MANUAL')).toHaveLength(1);
    expect(firstGen.data.subtotal).toBe(15200);

    const secondGen = await invoiceRepository.replaceBedAutoLines(tenantA, invoice.id, [
      {
        description: 'Bed charges — ICU-01 (ICU), 3 days @ 5000.00',
        quantity: 3,
        unitPrice: 5000,
        amount: 15000,
      },
    ]);
    if (secondGen.outcome !== 'updated') throw new Error('expected updated');
    expect(secondGen.data.lines.filter((line) => line.source === 'BED_AUTO')).toHaveLength(1);
    expect(secondGen.data.subtotal).toBe(15200);
  });
});
