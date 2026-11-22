import { eq, sql } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { db } from '@/app/db';
import { auditEvent as auditEventTable } from '@/app/db/schema/audit-event';
import { patient as patientTable } from '@/app/db/schema/patient';
import { seedOrganization } from '@/test/helpers';
import type { AuditAction } from '../schemas/audit-action-catalogue';
import { AUDIT_ACTIONS } from '../schemas/audit-action-catalogue';
import { auditLogRepository } from './audit-log-repository';

const tenantA = 'tenant-a-audit-test';
const tenantB = 'tenant-b-audit-test';
const timeZone = 'Asia/Dubai';

let mrnSequence = 0;

async function createPatient(tenantId: string, firstName: string) {
  mrnSequence += 1;
  await seedOrganization(tenantId);
  const [row] = await db
    .insert(patientTable)
    .values({
      tenantId,
      mrn: `MRN-${String(5000 + mrnSequence)}`,
      firstName,
      lastName: 'Khan',
      phone: '+971-501234567',
      registrationStatus: 'registered',
    })
    .returning({ id: patientTable.id, mrn: patientTable.mrn });

  return row;
}

function record(
  tenantId: string,
  action: AuditAction,
  extra: { patientId?: number; visitId?: number; actorName?: string; entityLabel?: string } = {}
) {
  const { category, entityType } = AUDIT_ACTIONS[action];

  return auditLogRepository.recordAuditEvent({
    tenantId,
    action,
    category,
    entityType,
    actorUserId: 'user-1',
    actorName: extra.actorName ?? 'Dr. Sara Ali',
    actorEmail: 'sara.ali@hospital.example',
    patientId: extra.patientId,
    visitId: extra.visitId,
    entityLabel: extra.entityLabel,
  });
}

async function setOccurredOn(id: number, isoInstant: string) {
  // Tests only: the append-only trigger blocks UPDATE, so disable it for this one row write.
  await db.transaction(async (tx) => {
    await tx.execute(sql`ALTER TABLE audit_event DISABLE TRIGGER audit_event_append_only`);
    await tx
      .update(auditEventTable)
      .set({ occurredOn: new Date(isoInstant) })
      .where(eq(auditEventTable.id, id));
    await tx.execute(sql`ALTER TABLE audit_event ENABLE TRIGGER audit_event_append_only`);
  });
}

describe('Audit Log repository', () => {
  it('should record an event and return it with derived fields intact', async () => {
    const event = await auditLogRepository.recordAuditEvent({
      tenantId: tenantA,
      action: 'visit.amend',
      category: 'update',
      entityType: 'visit',
      actorUserId: 'user-1',
      actorName: 'Dr. Sara Ali',
      entityId: '12',
      visitId: 12,
      reason: 'Corrected chief complaint',
      changes: [{ field: 'chiefComplaint', label: 'Chief complaint', from: 'Back', to: 'Neck' }],
    });

    expect(event).toMatchObject({
      id: 1,
      action: 'visit.amend',
      outcome: 'success',
      reason: 'Corrected chief complaint',
      changes: [{ field: 'chiefComplaint', from: 'Back', to: 'Neck' }],
    });
    expect(event.occurredOn).toBeInstanceOf(Date);
  });

  it('should reject updating or deleting an Audit Event', async () => {
    const event = await record(tenantA, 'patient.view');

    await expect(
      db
        .update(auditEventTable)
        .set({ actorName: 'Someone else' })
        .where(eq(auditEventTable.id, event.id))
    ).rejects.toThrow();
    await expect(
      db.delete(auditEventTable).where(eq(auditEventTable.id, event.id))
    ).rejects.toThrow();

    const [row] = await db.select().from(auditEventTable).where(eq(auditEventTable.id, event.id));
    expect(row.actorName).toBe('Dr. Sara Ali');
  });

  it('should never list another Tenant’s events', async () => {
    await record(tenantA, 'visit.view');
    await record(tenantB, 'visit.view');

    const { data, total } = await auditLogRepository.getAuditEvents({
      tenantId: tenantA,
      timeZone,
    });

    expect(total).toBe(1);
    expect(data.every((event) => event.tenantId === tenantA)).toBe(true);
  });

  it('should join the Patient only from the same Tenant', async () => {
    const patientA = await createPatient(tenantA, 'Ahmed');
    const patientB = await createPatient(tenantB, 'Layla');
    await record(tenantA, 'patient.view', { patientId: patientA.id });
    // An id pointing at another Tenant's Patient must not surface that Patient.
    await record(tenantA, 'patient.view', { patientId: patientB.id });

    const { data } = await auditLogRepository.getAuditEvents({ tenantId: tenantA, timeZone });
    const byPatient = new Map(data.map((event) => [event.patientId, event.patient]));

    expect(byPatient.get(patientA.id)).toMatchObject({ mrn: patientA.mrn, firstName: 'Ahmed' });
    expect(byPatient.get(patientB.id)).toBeNull();
  });

  it('should filter by Patient, Visit, category and action', async () => {
    const patient = await createPatient(tenantA, 'Ahmed');
    await record(tenantA, 'visit.view', { patientId: patient.id, visitId: 12 });
    await record(tenantA, 'visit.amend', { patientId: patient.id, visitId: 12 });
    await record(tenantA, 'visit.view', { visitId: 99 });

    const list = (filters: Record<string, unknown>) =>
      auditLogRepository.getAuditEvents({ tenantId: tenantA, timeZone, ...filters });

    expect((await list({ patientId: patient.id })).total).toBe(2);
    expect((await list({ visitId: 12 })).total).toBe(2);
    expect((await list({ category: 'access' })).total).toBe(2);
    expect((await list({ action: 'visit.amend' })).total).toBe(1);
  });

  it('should search actor, target label and Patient name case-insensitively', async () => {
    const patient = await createPatient(tenantA, 'Ahmed');
    await record(tenantA, 'visit.view', { actorName: 'Nurse Priya', entityLabel: 'V-2026-00012' });
    await record(tenantA, 'patient.view', { patientId: patient.id });

    const search = (query: string) =>
      auditLogRepository.getAuditEvents({ tenantId: tenantA, timeZone, query });

    expect((await search('priya')).total).toBe(1);
    expect((await search('v-2026-00012')).total).toBe(1);
    expect((await search('AHMED')).total).toBe(1);
    // LIKE wildcards in the term are matched literally.
    expect((await search('%')).total).toBe(0);
  });

  it('should treat From/To as the Tenant’s local days', async () => {
    const lateEvening = await record(tenantA, 'visit.view');
    const nextMorning = await record(tenantA, 'visit.view');
    // 23:30 on 20 Nov in Dubai (UTC+4) is 19:30 UTC; 00:30 on 21 Nov is 20:30 UTC on the 20th.
    await setOccurredOn(lateEvening.id, '2026-11-20T19:30:00Z');
    await setOccurredOn(nextMorning.id, '2026-11-20T20:30:00Z');

    const day = (date: string) =>
      auditLogRepository.getAuditEvents({
        tenantId: tenantA,
        timeZone,
        fromDate: date,
        toDate: date,
      });

    expect((await day('2026-11-20')).data.map(({ id }) => id)).toEqual([lateEvening.id]);
    expect((await day('2026-11-21')).data.map(({ id }) => id)).toEqual([nextMorning.id]);
  });

  it('should list newest first and paginate', async () => {
    const first = await record(tenantA, 'visit.view');
    const second = await record(tenantA, 'visit.view');
    const third = await record(tenantA, 'visit.view');

    const page1 = await auditLogRepository.getAuditEvents({
      tenantId: tenantA,
      timeZone,
      limit: 2,
    });
    const page2 = await auditLogRepository.getAuditEvents({
      tenantId: tenantA,
      timeZone,
      limit: 2,
      page: 2,
    });

    expect(page1.total).toBe(3);
    expect(page1.data.map(({ id }) => id)).toEqual([third.id, second.id]);
    expect(page2.data.map(({ id }) => id)).toEqual([first.id]);
  });

  it('should count and export with the same filters, capped at the given limit', async () => {
    await record(tenantA, 'visit.view', { visitId: 5 });
    await record(tenantA, 'visit.view', { visitId: 5 });
    await record(tenantA, 'visit.view', { visitId: 6 });

    const params = { tenantId: tenantA, timeZone, visitId: 5 };

    await expect(auditLogRepository.countAuditEvents(params)).resolves.toBe(2);
    await expect(auditLogRepository.getAuditEventsForExport(params, 1)).resolves.toHaveLength(1);
  });
  it('should store the actor Roles and derive Module and Operation from the action', async () => {
    const recorded = await auditLogRepository.recordAuditEvent({
      tenantId: tenantA,
      action: 'clinical-note.amend',
      category: 'update',
      entityType: 'clinical-note',
      actorUserId: 'user-1',
      actorName: 'Dr. Sara Ali',
      actorRoles: 'Doctor, Tenant Admin',
    });

    expect(recorded).toMatchObject({
      actorRoles: 'Doctor, Tenant Admin',
      module: 'Visits',
      operation: 'Amend',
    });

    const { data } = await auditLogRepository.getAuditEvents({ tenantId: tenantA, timeZone });
    expect(data[0]).toMatchObject({ actorRoles: 'Doctor, Tenant Admin', module: 'Visits' });
  });

  it('should filter by Module and Operation, and search the actor Roles', async () => {
    await record(tenantA, 'visit.amend');
    await record(tenantA, 'clinical-note.amend');
    await record(tenantA, 'patient.update');
    await record(tenantA, 'invoice.void');
    await auditLogRepository.recordAuditEvent({
      tenantId: tenantA,
      action: 'patient.view',
      category: 'access',
      entityType: 'patient',
      actorUserId: 'user-2',
      actorName: 'Front desk',
      actorRoles: 'Receptionist',
    });

    const list = (filters: Record<string, unknown>) =>
      auditLogRepository.getAuditEvents({ tenantId: tenantA, timeZone, ...filters });

    expect((await list({ module: 'Visits' })).total).toBe(2);
    expect((await list({ operation: 'Amend' })).total).toBe(2);
    expect((await list({ module: 'Patients', operation: 'Update' })).total).toBe(1);
    expect((await list({ module: 'Billing', operation: 'Amend' })).total).toBe(0);
    expect((await list({ query: 'recept' })).total).toBe(1);
  });
});
