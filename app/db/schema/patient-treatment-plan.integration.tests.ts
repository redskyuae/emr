import { and, eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { db } from '@/app/db';
import { getDatabaseError } from '@/app/api/lib/utils/db-errors';
import { appointment as appointmentTable } from './appointment';
import { appointmentStatus as appointmentStatusTable } from './appointment-status';
import { organization, user } from './auth';
import { doctor as doctorTable } from './doctor';
import { patient as patientTable } from './patient';
import {
  patientTreatmentPlan as planTable,
  patientTreatmentPlanSession as sessionTable,
  patientTreatmentPlanSessionReservation as reservationTable,
} from './patient-treatment-plan';
import { treatment as treatmentTable, treatmentSession as templateTable } from './treatment';
import { specialty as specialtyTable } from './specialty';
import { visit as visitTable } from './visit';
import { visitType as visitTypeTable } from './visit-type';

const tenantId = 'tenant-plan-test';

async function fixture() {
  const [patient] = await db
    .insert(patientTable)
    .values({ tenantId, mrn: 'MRN-1', firstName: 'Test', lastName: 'Patient', phone: '1234567890' })
    .returning();
  const [treatment] = await db
    .insert(treatmentTable)
    .values({ tenantId, name: 'Original treatment', code: 'TRT-1', sessionStructure: 'REPEATABLE' })
    .returning();
  const [template] = await db
    .insert(templateTable)
    .values({
      tenantId,
      treatmentId: treatment.id,
      sessionNumber: 1,
      label: 'Original label',
      procedure: 'Original procedure',
    })
    .returning();
  const [plan] = await db
    .insert(planTable)
    .values({
      tenantId,
      patientId: patient.id,
      treatmentId: treatment.id,
      treatmentName: treatment.name,
      treatmentCode: treatment.code,
      sessionStructure: 'REPEATABLE',
      totalSessions: 20,
    })
    .returning();
  const [status] = await db
    .insert(appointmentStatusTable)
    .values({ tenantId, name: 'Scheduled', code: 'SCH', category: 'SCHEDULED' })
    .returning();
  const createAppointment = async (bookingNumber: string) => {
    const [appointment] = await db
      .insert(appointmentTable)
      .values({
        tenantId,
        patientId: patient.id,
        bookingPath: 'PROCEDURE',
        bookingNumber,
        appointmentStatusId: status.id,
        slotDate: '2026-10-01',
        startTime: '09:00',
        endTime: '10:00',
      })
      .returning();
    return appointment;
  };
  return { patient, treatment, template, plan, createAppointment };
}

describe('Patient Treatment Plan database invariants', () => {
  it('should retain Plan legacy source identity uniqueness after soft deletion', async () => {
    const { patient } = await fixture();
    const data = {
      tenantId,
      patientId: patient.id,
      treatmentName: 'Legacy treatment',
      treatmentCode: 'LEG',
      sessionStructure: 'REPEATABLE' as const,
      totalSessions: 1,
      legacySourceIdentity: 'MRN-1:VISIT-1:LEG_Treatment',
    };
    const [plan] = await db.insert(planTable).values(data).returning();
    await db
      .update(planTable)
      .set({ isDeleted: true, deletedOn: new Date() })
      .where(eq(planTable.id, plan.id));

    await expect(db.insert(planTable).values(data).catch(getDatabaseError)).resolves.toMatchObject({
      code: '23505',
      constraint: 'patient_treatment_plan_tenant_legacy_source_idx',
    });
    await expect(
      db
        .insert(planTable)
        .values({ ...data, legacySourceIdentity: 'MRN-1:VISIT-2:LEG_Treatment' })
        .returning()
    ).resolves.toHaveLength(1);
  });

  it('should persist VISIT completion and reject a real Visit reference without its completion timestamp', async () => {
    const { patient, plan } = await fixture();
    await db
      .insert(organization)
      .values({ id: tenantId, name: 'Plan test tenant', slug: tenantId, createdAt: new Date() });
    await db
      .insert(user)
      .values({ id: 'plan-test-doctor', name: 'Test Doctor', email: 'plan-doctor@example.test' });
    const [specialty] = await db
      .insert(specialtyTable)
      .values({ tenantId, name: 'General', code: 'GEN' })
      .returning();
    const [doctor] = await db
      .insert(doctorTable)
      .values({ tenantId, userId: 'plan-test-doctor', specialtyId: specialty.id })
      .returning();
    const [visitType] = await db
      .insert(visitTypeTable)
      .values({ tenantId, name: 'Procedure', code: 'PROC' })
      .returning();
    const completedAt = new Date('2026-10-01T05:00:00Z');
    const [visit] = await db
      .insert(visitTable)
      .values({
        tenantId,
        patientId: patient.id,
        doctorId: doctor.id,
        visitTypeId: visitType.id,
        visitNumber: 'VST-1001',
        visitDate: '2026-10-01',
        queueToken: 1,
        status: 'COMPLETED',
        completedAt,
      })
      .returning();
    const data = {
      tenantId,
      patientTreatmentPlanId: plan.id,
      completionStatus: 'COMPLETED' as const,
      completionSource: 'VISIT' as const,
      completedVisitId: visit.id,
    };
    const [session] = await db
      .insert(sessionTable)
      .values({ ...data, sessionNumber: 1, completedAt })
      .returning();
    expect(session).toMatchObject({
      completionStatus: 'COMPLETED',
      completionSource: 'VISIT',
      completedVisitId: visit.id,
      completedAt,
    });

    await expect(
      db
        .insert(sessionTable)
        .values({ ...data, sessionNumber: 2 })
        .catch(getDatabaseError)
    ).resolves.toMatchObject({
      code: '23514',
      constraint: 'patient_treatment_plan_session_completion_check',
    });
  });

  it('should persist authoritative snapshots and more than twelve repeated Sessions', async () => {
    const { plan, template, treatment } = await fixture();
    await db.insert(sessionTable).values(
      Array.from({ length: 20 }, (_, index) => ({
        tenantId,
        patientTreatmentPlanId: plan.id,
        treatmentSessionId: template.id,
        sessionNumber: index + 1,
        label: template.label,
        procedure: template.procedure,
      }))
    );
    await db
      .update(treatmentTable)
      .set({ name: 'Changed master' })
      .where(eq(treatmentTable.id, treatment.id));
    await db
      .update(templateTable)
      .set({ label: 'Changed template' })
      .where(eq(templateTable.id, template.id));
    const [saved] = await db
      .select()
      .from(planTable)
      .where(and(eq(planTable.tenantId, tenantId), eq(planTable.id, plan.id)));
    const sessions = await db
      .select()
      .from(sessionTable)
      .where(
        and(eq(sessionTable.tenantId, tenantId), eq(sessionTable.patientTreatmentPlanId, plan.id))
      )
      .orderBy(sessionTable.sessionNumber);
    expect(saved).toMatchObject({ treatmentName: 'Original treatment', totalSessions: 20 });
    expect(sessions).toHaveLength(20);
    expect(sessions[19]).toMatchObject({
      sessionNumber: 20,
      label: 'Original label',
      durationMinutes: null,
      setupMinutes: null,
      cleaningMinutes: null,
    });
    expect(await db.select().from(planTable).where(eq(planTable.tenantId, 'other-tenant'))).toEqual(
      []
    );
  });

  it('should enforce positive totals and Session numbers and one active number per Plan', async () => {
    const { plan } = await fixture();
    await expect(
      db.update(planTable).set({ totalSessions: 0 }).where(eq(planTable.id, plan.id))
    ).rejects.toThrow();
    const data = { tenantId, patientTreatmentPlanId: plan.id, sessionNumber: 1 };
    await expect(db.insert(sessionTable).values({ ...data, sessionNumber: 0 })).rejects.toThrow();
    const [session] = await db.insert(sessionTable).values(data).returning();
    await expect(db.insert(sessionTable).values(data)).rejects.toThrow();
    await db
      .update(sessionTable)
      .set({ isDeleted: true, deletedOn: new Date() })
      .where(eq(sessionTable.id, session.id));
    await expect(db.insert(sessionTable).values(data).returning()).resolves.toHaveLength(1);
  });

  it('should enforce exclusive active Session and Appointment reservations and permit released reuse', async () => {
    const { plan, createAppointment } = await fixture();
    const sessions = await db
      .insert(sessionTable)
      .values(
        [1, 2].map((sessionNumber) => ({
          tenantId,
          patientTreatmentPlanId: plan.id,
          sessionNumber,
        }))
      )
      .returning();
    const first = await createAppointment('APT-1001');
    const second = await createAppointment('APT-1002');
    const data = {
      tenantId,
      patientTreatmentPlanSessionId: sessions[0].id,
      appointmentId: first.id,
    };
    const [reservation] = await db.insert(reservationTable).values(data).returning();
    await expect(
      db.insert(reservationTable).values({ ...data, appointmentId: second.id })
    ).rejects.toThrow();
    await expect(
      db.insert(reservationTable).values({ ...data, patientTreatmentPlanSessionId: sessions[1].id })
    ).rejects.toThrow();
    await db
      .update(reservationTable)
      .set({ isDeleted: true, deletedOn: new Date() })
      .where(eq(reservationTable.id, reservation.id));
    await expect(
      db
        .insert(reservationTable)
        .values({ ...data, appointmentId: second.id })
        .returning()
    ).resolves.toHaveLength(1);
  });

  it('should retain null historical Appointment Plan references and require a pair for new links', async () => {
    const { plan, createAppointment } = await fixture();
    const appointment = await createAppointment('APT-1001');
    expect(appointment).toMatchObject({
      patientTreatmentPlanId: null,
      patientTreatmentPlanSessionId: null,
    });
    await expect(
      db
        .update(appointmentTable)
        .set({ patientTreatmentPlanId: plan.id })
        .where(eq(appointmentTable.id, appointment.id))
    ).rejects.toThrow();
    const [session] = await db
      .insert(sessionTable)
      .values({ tenantId, patientTreatmentPlanId: plan.id, sessionNumber: 1 })
      .returning();
    await expect(
      db
        .update(appointmentTable)
        .set({ patientTreatmentPlanSessionId: session.id })
        .where(eq(appointmentTable.id, appointment.id))
    ).rejects.toThrow();
    await expect(
      db
        .update(appointmentTable)
        .set({ patientTreatmentPlanId: plan.id, patientTreatmentPlanSessionId: session.id })
        .where(eq(appointmentTable.id, appointment.id))
        .returning()
    ).resolves.toHaveLength(1);
  });

  it('should allow legacy completion without a Visit or timestamp but reject inconsistent completion', async () => {
    const { plan } = await fixture();
    const data = { tenantId, patientTreatmentPlanId: plan.id, sessionNumber: 1 };
    const [session] = await db
      .insert(sessionTable)
      .values({
        ...data,
        completionStatus: 'COMPLETED',
        completionSource: 'LEGACY_IMPORT',
        legacyConductionNote: null,
      })
      .returning();
    expect(session).toMatchObject({
      completedVisitId: null,
      completedAt: null,
      completionSource: 'LEGACY_IMPORT',
    });
    await expect(
      db.insert(sessionTable).values({ ...data, sessionNumber: 2, completionStatus: 'COMPLETED' })
    ).rejects.toThrow();
    await expect(
      db
        .insert(sessionTable)
        .values({ ...data, sessionNumber: 2, completionSource: 'LEGACY_IMPORT' })
    ).rejects.toThrow();
    await expect(
      db.insert(sessionTable).values({
        ...data,
        sessionNumber: 2,
        completionStatus: 'COMPLETED',
        completionSource: 'VISIT',
        completedAt: new Date(),
      })
    ).rejects.toThrow();
    await expect(
      db.insert(sessionTable).values({ ...data, sessionNumber: 2, completedAt: new Date() })
    ).rejects.toThrow();
    await expect(
      db.insert(sessionTable).values({ ...data, sessionNumber: 2, patientTreatmentPlanId: 999999 })
    ).rejects.toThrow();
  });
});
