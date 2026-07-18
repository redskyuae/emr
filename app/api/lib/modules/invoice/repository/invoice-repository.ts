import { and, asc, count, desc, eq, ilike, inArray, or, sql } from 'drizzle-orm';

import { db } from '@/app/db';
import { admission as admissionTable } from '@/app/db/schema/admission';
import { admissionBedTransfer as admissionBedTransferTable } from '@/app/db/schema/admission-bed-transfer';
import { bed as bedTable } from '@/app/db/schema/bed';
import {
  invoice as invoiceTable,
  invoiceNumberCounter as invoiceNumberCounterTable,
  receiptNumberCounter as receiptNumberCounterTable,
} from '@/app/db/schema/invoice';
import { invoiceLine as invoiceLineTable } from '@/app/db/schema/invoice-line';
import { patient as patientTable } from '@/app/db/schema/patient';
import { payment as paymentTable } from '@/app/db/schema/payment';
import { room as roomTable } from '@/app/db/schema/room';
import { roomType as roomTypeTable } from '@/app/db/schema/room-type';
import { visit as visitTable } from '@/app/db/schema/visit';
import { ward as wardTable } from '@/app/db/schema/ward';
import {
  type CreateInvoiceData,
  type Invoice,
  type InvoiceLine,
  type InvoiceLineSource,
  type InvoiceListItem,
  type InvoiceListParams,
  type InvoiceStatus,
  type Payment,
  type PaymentMethod,
  roundMoney,
} from '../schemas/invoice-schema';
import { formatInvoiceNumber, formatReceiptNumber } from './invoice-number';

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Executor = typeof db | Transaction;

const invoiceBaseColumns = {
  id: invoiceTable.id,
  tenantId: invoiceTable.tenantId,
  invoiceNumber: invoiceTable.invoiceNumber,
  status: invoiceTable.status,
  subtotal: invoiceTable.subtotal,
  discountAmount: invoiceTable.discountAmount,
  grandTotal: invoiceTable.grandTotal,
  amountPaid: invoiceTable.amountPaid,
  notes: invoiceTable.notes,
  finalizedAt: invoiceTable.finalizedAt,
  voidedAt: invoiceTable.voidedAt,
  voidReason: invoiceTable.voidReason,
  createdOn: invoiceTable.createdOn,
  modifiedOn: invoiceTable.modifiedOn,
  patient: {
    id: patientTable.id,
    mrn: patientTable.mrn,
    firstName: patientTable.firstName,
    lastName: patientTable.lastName,
  },
  visit: {
    id: visitTable.id,
    visitNumber: visitTable.visitNumber,
  },
  admission: {
    id: admissionTable.id,
    admissionNumber: admissionTable.admissionNumber,
  },
};

type InvoiceBaseRow = {
  status: string;
  visit: { id: number | null; visitNumber: string | null } | null;
  admission: { id: number | null; admissionNumber: string | null } | null;
} & Omit<Invoice, 'status' | 'visit' | 'admission' | 'balanceDue' | 'lines' | 'payments'>;

function baseSelect(executor: Executor) {
  return executor
    .select(invoiceBaseColumns)
    .from(invoiceTable)
    .innerJoin(
      patientTable,
      and(
        eq(patientTable.id, invoiceTable.patientId),
        eq(patientTable.tenantId, invoiceTable.tenantId)
      )
    )
    .leftJoin(
      visitTable,
      and(eq(visitTable.id, invoiceTable.visitId), eq(visitTable.tenantId, invoiceTable.tenantId))
    )
    .leftJoin(
      admissionTable,
      and(
        eq(admissionTable.id, invoiceTable.admissionId),
        eq(admissionTable.tenantId, invoiceTable.tenantId)
      )
    );
}

function toVisit(value: { id: number | null; visitNumber: string | null } | null) {
  return value && value.id != null && value.visitNumber != null
    ? { id: value.id, visitNumber: value.visitNumber }
    : null;
}

function toAdmissionSummary(value: { id: number | null; admissionNumber: string | null } | null) {
  return value && value.id != null && value.admissionNumber != null
    ? { id: value.id, admissionNumber: value.admissionNumber }
    : null;
}

async function loadLines(
  executor: Executor,
  tenantId: string,
  invoiceId: number
): Promise<InvoiceLine[]> {
  return executor
    .select({
      id: invoiceLineTable.id,
      invoiceId: invoiceLineTable.invoiceId,
      chargeItemId: invoiceLineTable.chargeItemId,
      description: invoiceLineTable.description,
      quantity: invoiceLineTable.quantity,
      unitPrice: invoiceLineTable.unitPrice,
      amount: invoiceLineTable.amount,
      source: invoiceLineTable.source,
    })
    .from(invoiceLineTable)
    .where(
      and(
        eq(invoiceLineTable.tenantId, tenantId),
        eq(invoiceLineTable.invoiceId, invoiceId),
        eq(invoiceLineTable.isDeleted, false)
      )
    )
    .orderBy(asc(invoiceLineTable.id))
    .then((rows) => rows.map((row) => ({ ...row, source: row.source as InvoiceLineSource })));
}

async function loadPayments(
  executor: Executor,
  tenantId: string,
  invoiceId: number
): Promise<Payment[]> {
  return executor
    .select({
      id: paymentTable.id,
      invoiceId: paymentTable.invoiceId,
      receiptNumber: paymentTable.receiptNumber,
      amount: paymentTable.amount,
      method: paymentTable.method,
      reference: paymentTable.reference,
      notes: paymentTable.notes,
      receivedAt: paymentTable.receivedAt,
    })
    .from(paymentTable)
    .where(
      and(
        eq(paymentTable.tenantId, tenantId),
        eq(paymentTable.invoiceId, invoiceId),
        eq(paymentTable.isDeleted, false)
      )
    )
    .orderBy(asc(paymentTable.receivedAt), asc(paymentTable.id))
    .then((rows) => rows.map((row) => ({ ...row, method: row.method as PaymentMethod })));
}

async function assembleInvoice(
  executor: Executor,
  tenantId: string,
  id: number
): Promise<Invoice | undefined> {
  const [row] = await baseSelect(executor)
    .where(
      and(
        eq(invoiceTable.id, id),
        eq(invoiceTable.tenantId, tenantId),
        eq(invoiceTable.isDeleted, false)
      )
    )
    .limit(1);

  if (!row) {
    return undefined;
  }

  const base = row as InvoiceBaseRow;
  const [lines, payments] = await Promise.all([
    loadLines(executor, tenantId, id),
    loadPayments(executor, tenantId, id),
  ]);

  return {
    ...base,
    status: base.status as InvoiceStatus,
    balanceDue: roundMoney(base.grandTotal - base.amountPaid),
    visit: toVisit(base.visit),
    admission: toAdmissionSummary(base.admission),
    lines,
    payments,
  };
}

async function getInvoiceById(tenantId: string, id: number): Promise<Invoice | undefined> {
  return assembleInvoice(db, tenantId, id);
}

async function getInvoices({
  tenantId,
  statuses,
  patientId,
  query,
  page = 1,
  limit = 10,
}: InvoiceListParams) {
  const offset = (page - 1) * limit;
  const trimmedQuery = query?.trim();
  const searchCondition = trimmedQuery
    ? or(
        ilike(invoiceTable.invoiceNumber, `%${trimmedQuery}%`),
        ilike(patientTable.mrn, `%${trimmedQuery}%`),
        ilike(patientTable.firstName, `%${trimmedQuery}%`),
        ilike(patientTable.lastName, `%${trimmedQuery}%`)
      )
    : undefined;
  const statusCondition =
    statuses && statuses.length > 0
      ? or(...statuses.map((status) => eq(invoiceTable.status, status)))
      : undefined;
  const whereClause = and(
    eq(invoiceTable.tenantId, tenantId),
    eq(invoiceTable.isDeleted, false),
    patientId ? eq(invoiceTable.patientId, patientId) : undefined,
    statusCondition,
    searchCondition
  );

  const [rows, [{ total }]] = await Promise.all([
    baseSelect(db)
      .where(whereClause)
      .orderBy(desc(invoiceTable.createdOn), desc(invoiceTable.id))
      .limit(limit)
      .offset(offset),
    db
      .select({ total: count() })
      .from(invoiceTable)
      .innerJoin(
        patientTable,
        and(
          eq(patientTable.id, invoiceTable.patientId),
          eq(patientTable.tenantId, invoiceTable.tenantId)
        )
      )
      .where(whereClause),
  ]);

  const data: InvoiceListItem[] = rows.map((row) => {
    const base = row as InvoiceBaseRow;
    return {
      id: base.id,
      invoiceNumber: base.invoiceNumber,
      status: base.status as InvoiceStatus,
      grandTotal: base.grandTotal,
      amountPaid: base.amountPaid,
      balanceDue: roundMoney(base.grandTotal - base.amountPaid),
      createdOn: base.createdOn,
      patient: base.patient,
      visit: toVisit(base.visit),
      admission: toAdmissionSummary(base.admission),
    };
  });

  return { data, total };
}

export type InvoiceRow = {
  id: number;
  invoiceNumber: string;
  status: InvoiceStatus;
  patientId: number;
  visitId: number | null;
  admissionId: number | null;
  subtotal: number;
  discountAmount: number;
  grandTotal: number;
  amountPaid: number;
};

async function findInvoiceById(tenantId: string, id: number): Promise<InvoiceRow | undefined> {
  const [row] = await db
    .select({
      id: invoiceTable.id,
      invoiceNumber: invoiceTable.invoiceNumber,
      status: invoiceTable.status,
      patientId: invoiceTable.patientId,
      visitId: invoiceTable.visitId,
      admissionId: invoiceTable.admissionId,
      subtotal: invoiceTable.subtotal,
      discountAmount: invoiceTable.discountAmount,
      grandTotal: invoiceTable.grandTotal,
      amountPaid: invoiceTable.amountPaid,
    })
    .from(invoiceTable)
    .where(
      and(
        eq(invoiceTable.id, id),
        eq(invoiceTable.tenantId, tenantId),
        eq(invoiceTable.isDeleted, false)
      )
    )
    .limit(1);

  return row ? { ...row, status: row.status as InvoiceStatus } : undefined;
}

// Locks the Invoice row so a mutation and its total recompute serialize against
// any concurrent edit, then reports whether the caller may proceed on a Draft.
async function lockDraft(
  tx: Transaction,
  tenantId: string,
  id: number
): Promise<
  { state: 'draft'; discountAmount: number } | { state: 'not-found' } | { state: 'not-draft' }
> {
  const [row] = await tx
    .select({ status: invoiceTable.status, discountAmount: invoiceTable.discountAmount })
    .from(invoiceTable)
    .where(
      and(
        eq(invoiceTable.id, id),
        eq(invoiceTable.tenantId, tenantId),
        eq(invoiceTable.isDeleted, false)
      )
    )
    .for('update')
    .limit(1);

  if (!row) {
    return { state: 'not-found' };
  }

  if (row.status !== 'DRAFT') {
    return { state: 'not-draft' };
  }

  return { state: 'draft', discountAmount: row.discountAmount };
}

// Sums the Draft's live lines and rewrites subtotal/grandTotal, clamping the
// Discount down if a line removal dropped the subtotal below it (ADR 0037).
async function recomputeDraftTotals(
  tx: Transaction,
  tenantId: string,
  id: number,
  currentDiscount: number
) {
  const [{ subtotal }] = await tx
    .select({
      subtotal: sql<number>`coalesce(sum(${invoiceLineTable.amount}), 0)`.mapWith(Number),
    })
    .from(invoiceLineTable)
    .where(
      and(
        eq(invoiceLineTable.tenantId, tenantId),
        eq(invoiceLineTable.invoiceId, id),
        eq(invoiceLineTable.isDeleted, false)
      )
    );

  const roundedSubtotal = roundMoney(subtotal);
  const discountAmount = Math.min(currentDiscount, roundedSubtotal);
  const grandTotal = roundMoney(roundedSubtotal - discountAmount);

  await tx
    .update(invoiceTable)
    .set({ subtotal: roundedSubtotal, discountAmount, grandTotal, modifiedOn: new Date() })
    .where(and(eq(invoiceTable.id, id), eq(invoiceTable.tenantId, tenantId)));
}

export type DraftMutationResult =
  | { outcome: 'updated'; data: Invoice }
  | { outcome: 'not-found' }
  | { outcome: 'not-draft'; data: Invoice }
  | { outcome: 'line-not-found'; data: Invoice };

async function reloadOrThrow(tx: Transaction, tenantId: string, id: number): Promise<Invoice> {
  const invoice = await assembleInvoice(tx, tenantId, id);

  if (!invoice) {
    throw new Error('Invoice could not be read after mutation');
  }

  return invoice;
}

async function createInvoice(data: CreateInvoiceData): Promise<Invoice> {
  return db.transaction(async (tx) => {
    const [numberCounter] = await tx
      .insert(invoiceNumberCounterTable)
      .values({ tenantId: data.tenantId, lastNumber: 1001 })
      .onConflictDoUpdate({
        target: invoiceNumberCounterTable.tenantId,
        set: { lastNumber: sql`${invoiceNumberCounterTable.lastNumber} + 1` },
      })
      .returning({ lastNumber: invoiceNumberCounterTable.lastNumber });

    const [created] = await tx
      .insert(invoiceTable)
      .values({
        tenantId: data.tenantId,
        invoiceNumber: formatInvoiceNumber(numberCounter.lastNumber),
        patientId: data.patientId,
        visitId: data.visitId ?? null,
        admissionId: data.admissionId ?? null,
        status: 'DRAFT',
        notes: data.notes ?? null,
      })
      .returning({ id: invoiceTable.id });

    return reloadOrThrow(tx, data.tenantId, created.id);
  });
}

async function addInvoiceLine(
  tenantId: string,
  invoiceId: number,
  line: {
    chargeItemId: number;
    description: string;
    quantity: number;
    unitPrice: number;
  }
): Promise<DraftMutationResult> {
  return db.transaction(async (tx) => {
    const lock = await lockDraft(tx, tenantId, invoiceId);

    if (lock.state === 'not-found') {
      return { outcome: 'not-found' };
    }

    if (lock.state === 'not-draft') {
      return { outcome: 'not-draft', data: await reloadOrThrow(tx, tenantId, invoiceId) };
    }

    await tx.insert(invoiceLineTable).values({
      tenantId,
      invoiceId,
      chargeItemId: line.chargeItemId,
      description: line.description,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      amount: roundMoney(line.quantity * line.unitPrice),
      source: 'MANUAL',
    });

    await recomputeDraftTotals(tx, tenantId, invoiceId, lock.discountAmount);

    return { outcome: 'updated', data: await reloadOrThrow(tx, tenantId, invoiceId) };
  });
}

async function removeInvoiceLine(
  tenantId: string,
  invoiceId: number,
  lineId: number
): Promise<DraftMutationResult> {
  return db.transaction(async (tx) => {
    const lock = await lockDraft(tx, tenantId, invoiceId);

    if (lock.state === 'not-found') {
      return { outcome: 'not-found' };
    }

    if (lock.state === 'not-draft') {
      return { outcome: 'not-draft', data: await reloadOrThrow(tx, tenantId, invoiceId) };
    }

    const deletedOn = new Date();
    const removed = await tx
      .update(invoiceLineTable)
      .set({ isDeleted: true, modifiedOn: deletedOn, deletedOn })
      .where(
        and(
          eq(invoiceLineTable.id, lineId),
          eq(invoiceLineTable.tenantId, tenantId),
          eq(invoiceLineTable.invoiceId, invoiceId),
          eq(invoiceLineTable.isDeleted, false)
        )
      )
      .returning({ id: invoiceLineTable.id });

    if (removed.length === 0) {
      return { outcome: 'line-not-found', data: await reloadOrThrow(tx, tenantId, invoiceId) };
    }

    await recomputeDraftTotals(tx, tenantId, invoiceId, lock.discountAmount);

    return { outcome: 'updated', data: await reloadOrThrow(tx, tenantId, invoiceId) };
  });
}

async function updateDraftInvoice(
  tenantId: string,
  invoiceId: number,
  data: { discountAmount: number; notes?: string }
): Promise<DraftMutationResult> {
  return db.transaction(async (tx) => {
    const lock = await lockDraft(tx, tenantId, invoiceId);

    if (lock.state === 'not-found') {
      return { outcome: 'not-found' };
    }

    if (lock.state === 'not-draft') {
      return { outcome: 'not-draft', data: await reloadOrThrow(tx, tenantId, invoiceId) };
    }

    const [{ subtotal }] = await tx
      .select({
        subtotal: sql<number>`coalesce(sum(${invoiceLineTable.amount}), 0)`.mapWith(Number),
      })
      .from(invoiceLineTable)
      .where(
        and(
          eq(invoiceLineTable.tenantId, tenantId),
          eq(invoiceLineTable.invoiceId, invoiceId),
          eq(invoiceLineTable.isDeleted, false)
        )
      );

    const roundedSubtotal = roundMoney(subtotal);
    const discountAmount = Math.min(roundMoney(data.discountAmount), roundedSubtotal);
    const grandTotal = roundMoney(roundedSubtotal - discountAmount);

    await tx
      .update(invoiceTable)
      .set({
        subtotal: roundedSubtotal,
        discountAmount,
        grandTotal,
        notes: data.notes ?? null,
        modifiedOn: new Date(),
      })
      .where(and(eq(invoiceTable.id, invoiceId), eq(invoiceTable.tenantId, tenantId)));

    return { outcome: 'updated', data: await reloadOrThrow(tx, tenantId, invoiceId) };
  });
}

export type FinalizeInvoiceResult =
  | { outcome: 'finalized'; data: Invoice }
  | { outcome: 'not-found' }
  | { outcome: 'not-draft'; data: Invoice }
  | { outcome: 'no-lines'; data: Invoice };

async function finalizeInvoice(
  tenantId: string,
  invoiceId: number
): Promise<FinalizeInvoiceResult> {
  return db.transaction(async (tx) => {
    const lock = await lockDraft(tx, tenantId, invoiceId);

    if (lock.state === 'not-found') {
      return { outcome: 'not-found' };
    }

    if (lock.state === 'not-draft') {
      return { outcome: 'not-draft', data: await reloadOrThrow(tx, tenantId, invoiceId) };
    }

    // Re-checked under the Invoice's row lock: the validator's own check reads
    // an unlocked snapshot, so a concurrent line removal between that read and
    // this transaction could otherwise finalize a truly line-less Invoice
    // straight to PAID (distinct from the zero-priced-line PAID path, ADR 0037).
    const [{ lineCount }] = await tx
      .select({ lineCount: count() })
      .from(invoiceLineTable)
      .where(
        and(
          eq(invoiceLineTable.tenantId, tenantId),
          eq(invoiceLineTable.invoiceId, invoiceId),
          eq(invoiceLineTable.isDeleted, false)
        )
      );

    if (lineCount === 0) {
      return { outcome: 'no-lines', data: await reloadOrThrow(tx, tenantId, invoiceId) };
    }

    await recomputeDraftTotals(tx, tenantId, invoiceId, lock.discountAmount);

    const [{ grandTotal }] = await tx
      .select({ grandTotal: invoiceTable.grandTotal })
      .from(invoiceTable)
      .where(and(eq(invoiceTable.id, invoiceId), eq(invoiceTable.tenantId, tenantId)))
      .limit(1);

    const now = new Date();
    // A zero-total Invoice is nothing to collect, so it finalizes straight to
    // PAID (ADR 0037) — supports free camps and charity cases.
    const status: InvoiceStatus = grandTotal === 0 ? 'PAID' : 'FINALIZED';

    await tx
      .update(invoiceTable)
      .set({ status, finalizedAt: now, modifiedOn: now })
      .where(and(eq(invoiceTable.id, invoiceId), eq(invoiceTable.tenantId, tenantId)));

    return { outcome: 'finalized', data: await reloadOrThrow(tx, tenantId, invoiceId) };
  });
}

export type VoidInvoiceResult =
  | { outcome: 'voided'; data: Invoice }
  | { outcome: 'not-found' }
  | { outcome: 'not-voidable'; data: Invoice };

async function voidInvoice(
  tenantId: string,
  invoiceId: number,
  voidReason: string
): Promise<VoidInvoiceResult> {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .select({ status: invoiceTable.status, amountPaid: invoiceTable.amountPaid })
      .from(invoiceTable)
      .where(
        and(
          eq(invoiceTable.id, invoiceId),
          eq(invoiceTable.tenantId, tenantId),
          eq(invoiceTable.isDeleted, false)
        )
      )
      .for('update')
      .limit(1);

    if (!row) {
      return { outcome: 'not-found' };
    }

    const voidable = (row.status === 'DRAFT' || row.status === 'FINALIZED') && row.amountPaid === 0;

    if (!voidable) {
      return { outcome: 'not-voidable', data: await reloadOrThrow(tx, tenantId, invoiceId) };
    }

    const now = new Date();

    await tx
      .update(invoiceTable)
      .set({ status: 'VOID', voidedAt: now, voidReason, modifiedOn: now })
      .where(and(eq(invoiceTable.id, invoiceId), eq(invoiceTable.tenantId, tenantId)));

    return { outcome: 'voided', data: await reloadOrThrow(tx, tenantId, invoiceId) };
  });
}

export type RecordPaymentResult =
  | { outcome: 'recorded'; data: Invoice; payment: Payment }
  | { outcome: 'not-found' }
  | { outcome: 'not-payable'; data: Invoice }
  | { outcome: 'over-balance'; data: Invoice };

async function recordPayment(
  tenantId: string,
  invoiceId: number,
  input: {
    amount: number;
    method: PaymentMethod;
    reference?: string;
    notes?: string;
    receivedAt?: Date;
  }
): Promise<RecordPaymentResult> {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .select({
        status: invoiceTable.status,
        grandTotal: invoiceTable.grandTotal,
        amountPaid: invoiceTable.amountPaid,
      })
      .from(invoiceTable)
      .where(
        and(
          eq(invoiceTable.id, invoiceId),
          eq(invoiceTable.tenantId, tenantId),
          eq(invoiceTable.isDeleted, false)
        )
      )
      .for('update')
      .limit(1);

    if (!row) {
      return { outcome: 'not-found' };
    }

    if (row.status !== 'FINALIZED' && row.status !== 'PARTIALLY_PAID') {
      return { outcome: 'not-payable', data: await reloadOrThrow(tx, tenantId, invoiceId) };
    }

    const amount = roundMoney(input.amount);
    const newPaid = roundMoney(row.amountPaid + amount);

    if (newPaid > row.grandTotal) {
      return { outcome: 'over-balance', data: await reloadOrThrow(tx, tenantId, invoiceId) };
    }

    const [receiptCounter] = await tx
      .insert(receiptNumberCounterTable)
      .values({ tenantId, lastNumber: 1001 })
      .onConflictDoUpdate({
        target: receiptNumberCounterTable.tenantId,
        set: { lastNumber: sql`${receiptNumberCounterTable.lastNumber} + 1` },
      })
      .returning({ lastNumber: receiptNumberCounterTable.lastNumber });

    const receivedAt = input.receivedAt ?? new Date();

    const [insertedPayment] = await tx
      .insert(paymentTable)
      .values({
        tenantId,
        receiptNumber: formatReceiptNumber(receiptCounter.lastNumber),
        invoiceId,
        amount,
        method: input.method,
        reference: input.reference ?? null,
        notes: input.notes ?? null,
        receivedAt,
      })
      .returning({
        id: paymentTable.id,
        invoiceId: paymentTable.invoiceId,
        receiptNumber: paymentTable.receiptNumber,
        amount: paymentTable.amount,
        method: paymentTable.method,
        reference: paymentTable.reference,
        notes: paymentTable.notes,
        receivedAt: paymentTable.receivedAt,
      });

    const now = new Date();
    const status: InvoiceStatus = newPaid >= row.grandTotal ? 'PAID' : 'PARTIALLY_PAID';

    await tx
      .update(invoiceTable)
      .set({ amountPaid: newPaid, status, modifiedOn: now })
      .where(and(eq(invoiceTable.id, invoiceId), eq(invoiceTable.tenantId, tenantId)));

    return {
      outcome: 'recorded',
      data: await reloadOrThrow(tx, tenantId, invoiceId),
      payment: { ...insertedPayment, method: insertedPayment.method as PaymentMethod },
    };
  });
}

export type BedAutoLine = {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
};

async function replaceBedAutoLines(
  tenantId: string,
  invoiceId: number,
  lines: BedAutoLine[]
): Promise<DraftMutationResult> {
  return db.transaction(async (tx) => {
    const lock = await lockDraft(tx, tenantId, invoiceId);

    if (lock.state === 'not-found') {
      return { outcome: 'not-found' };
    }

    if (lock.state === 'not-draft') {
      return { outcome: 'not-draft', data: await reloadOrThrow(tx, tenantId, invoiceId) };
    }

    const deletedOn = new Date();

    await tx
      .update(invoiceLineTable)
      .set({ isDeleted: true, modifiedOn: deletedOn, deletedOn })
      .where(
        and(
          eq(invoiceLineTable.tenantId, tenantId),
          eq(invoiceLineTable.invoiceId, invoiceId),
          eq(invoiceLineTable.isDeleted, false),
          eq(invoiceLineTable.source, 'BED_AUTO')
        )
      );

    if (lines.length > 0) {
      await tx.insert(invoiceLineTable).values(
        lines.map((line) => ({
          tenantId,
          invoiceId,
          chargeItemId: null,
          description: line.description,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          amount: line.amount,
          source: 'BED_AUTO' as const,
        }))
      );
    }

    await recomputeDraftTotals(tx, tenantId, invoiceId, lock.discountAmount);

    return { outcome: 'updated', data: await reloadOrThrow(tx, tenantId, invoiceId) };
  });
}

export type OccupancyBed = {
  bedId: number;
  bedNumber: string;
  wardCode: string;
  dailyRate: number | null;
};

export type OccupancySourceRow = {
  admittedAt: Date;
  dischargedAt: Date | null;
  status: string;
  currentBedId: number;
  transfers: { fromBedId: number; toBedId: number; transferredAt: Date }[];
  beds: OccupancyBed[];
};

async function getOccupancySource(
  tenantId: string,
  admissionId: number
): Promise<OccupancySourceRow | undefined> {
  const [row] = await db
    .select({
      admittedAt: admissionTable.admittedAt,
      dischargedAt: admissionTable.dischargedAt,
      status: admissionTable.status,
      currentBedId: admissionTable.bedId,
    })
    .from(admissionTable)
    .where(
      and(
        eq(admissionTable.id, admissionId),
        eq(admissionTable.tenantId, tenantId),
        eq(admissionTable.isDeleted, false)
      )
    )
    .limit(1);

  if (!row) {
    return undefined;
  }

  const transfers = await db
    .select({
      fromBedId: admissionBedTransferTable.fromBedId,
      toBedId: admissionBedTransferTable.toBedId,
      transferredAt: admissionBedTransferTable.transferredAt,
    })
    .from(admissionBedTransferTable)
    .where(
      and(
        eq(admissionBedTransferTable.tenantId, tenantId),
        eq(admissionBedTransferTable.admissionId, admissionId),
        eq(admissionBedTransferTable.isDeleted, false)
      )
    )
    .orderBy(asc(admissionBedTransferTable.transferredAt), asc(admissionBedTransferTable.id));

  const bedIds = [
    ...new Set<number>([
      row.currentBedId,
      ...transfers.flatMap((transfer) => [transfer.fromBedId, transfer.toBedId]),
    ]),
  ];

  const beds = await db
    .select({
      bedId: bedTable.id,
      bedNumber: bedTable.bedNumber,
      wardCode: wardTable.code,
      dailyRate: roomTypeTable.dailyRate,
    })
    .from(bedTable)
    .innerJoin(wardTable, eq(wardTable.id, bedTable.wardId))
    .leftJoin(roomTable, eq(roomTable.id, bedTable.roomId))
    .leftJoin(roomTypeTable, eq(roomTypeTable.id, roomTable.roomTypeId))
    .where(and(eq(bedTable.tenantId, tenantId), inArray(bedTable.id, bedIds)));

  return {
    ...row,
    transfers,
    beds,
  };
}

export type DeleteInvoiceResult =
  | { outcome: 'deleted'; data: Invoice }
  | { outcome: 'not-found' }
  | { outcome: 'not-deletable'; data: Invoice };

async function deleteInvoice(tenantId: string, invoiceId: number): Promise<DeleteInvoiceResult> {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .select({ status: invoiceTable.status })
      .from(invoiceTable)
      .where(
        and(
          eq(invoiceTable.id, invoiceId),
          eq(invoiceTable.tenantId, tenantId),
          eq(invoiceTable.isDeleted, false)
        )
      )
      .for('update')
      .limit(1);

    if (!row) {
      return { outcome: 'not-found' };
    }

    if (row.status !== 'DRAFT' && row.status !== 'VOID') {
      return { outcome: 'not-deletable', data: await reloadOrThrow(tx, tenantId, invoiceId) };
    }

    const existing = await reloadOrThrow(tx, tenantId, invoiceId);
    const deletedOn = new Date();

    await tx
      .update(invoiceTable)
      .set({ isDeleted: true, modifiedOn: deletedOn, deletedOn })
      .where(and(eq(invoiceTable.id, invoiceId), eq(invoiceTable.tenantId, tenantId)));

    return { outcome: 'deleted', data: existing };
  });
}

export const invoiceRepository = {
  getInvoices,
  createInvoice,
  voidInvoice,
  deleteInvoice,
  addInvoiceLine,
  recordPayment,
  getInvoiceById,
  findInvoiceById,
  finalizeInvoice,
  removeInvoiceLine,
  updateDraftInvoice,
  getOccupancySource,
  replaceBedAutoLines,
};
