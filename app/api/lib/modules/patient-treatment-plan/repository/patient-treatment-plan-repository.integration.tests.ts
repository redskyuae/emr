import { and, eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { db } from '@/app/db';
import { appointment as appointmentTable } from '@/app/db/schema/appointment';
import { appointmentStatus as appointmentStatusTable } from '@/app/db/schema/appointment-status';
import { organization, user } from '@/app/db/schema/auth';
import { doctor as doctorTable } from '@/app/db/schema/doctor';
import { patient as patientTable } from '@/app/db/schema/patient';
import {
  patientTreatmentPlan as planTable,
  patientTreatmentPlanSession as sessionTable,
  patientTreatmentPlanSessionReservation as reservationTable,
} from '@/app/db/schema/patient-treatment-plan';
import { specialty as specialtyTable } from '@/app/db/schema/specialty';
import {
  treatment as treatmentTable,
  treatmentSession as templateTable,
} from '@/app/db/schema/treatment';
import { visit as visitTable } from '@/app/db/schema/visit';
import { visitType as visitTypeTable } from '@/app/db/schema/visit-type';
import { patientTreatmentPlanRepository } from './patient-treatment-plan-repository';

const tenantA = 'tenant-plan-read-a';
const tenantB = 'tenant-plan-read-b';

async function createPatient(tenantId: string, mrn: string) {
  const [patient] = await db
    .insert(patientTable)
    .values({ tenantId, mrn, firstName: 'Plan', lastName: 'Patient', phone: '0500000000' })
    .returning();

  return patient;
}

async function createTreatment(
  tenantId: string,
  sessionStructure: 'REPEATABLE' | 'SEQUENCED',
  code: string
) {
  const [treatment] = await db
    .insert(treatmentTable)
    .values({
      tenantId,
      code,
      sessionStructure,
      name: `${code} master name`,
      legacySourceIdentity: `${code}_source`,
      legacySourceSystem: 'TEST',
    })
    .returning();

  return treatment;
}

async function createTemplate(
  tenantId: string,
  treatmentId: number,
  sessionNumber: number,
  overrides: Partial<typeof templateTable.$inferInsert> = {}
) {
  const [template] = await db
    .insert(templateTable)
    .values({
      tenantId,
      treatmentId,
      sessionNumber,
      label: `Template ${sessionNumber}`,
      procedure: `Procedure ${sessionNumber}`,
      durationMinutes: 45,
      setupMinutes: 5,
      cleaningMinutes: 10,
      preparation: 'Prepare',
      warning: 'Caution',
      equipment: 'Table',
      roomType: 'Therapy room',
      therapistSkill: 'Therapy',
      ...overrides,
    })
    .returning();

  return template;
}

async function createPlan(
  tenantId: string,
  patientId: number,
  treatmentId: number | null,
  totalSessions: number,
  overrides: Partial<typeof planTable.$inferInsert> = {}
) {
  const [plan] = await db
    .insert(planTable)
    .values({
      tenantId,
      patientId,
      treatmentId,
      totalSessions,
      treatmentName: 'Assigned snapshot name',
      treatmentCode: 'SNAP-1',
      treatmentSourceIdentity: 'SNAP-1_source',
      sessionStructure: 'REPEATABLE',
      ...overrides,
    })
    .returning();

  return plan;
}

async function createPlanSession(
  tenantId: string,
  patientTreatmentPlanId: number,
  sessionNumber: number,
  overrides: Partial<typeof sessionTable.$inferInsert> = {}
) {
  const [session] = await db
    .insert(sessionTable)
    .values({
      tenantId,
      patientTreatmentPlanId,
      sessionNumber,
      label: `Snapshot ${sessionNumber}`,
      procedure: `Snapshot procedure ${sessionNumber}`,
      durationMinutes: null,
      setupMinutes: null,
      cleaningMinutes: null,
      preparation: null,
      warning: null,
      equipment: null,
      roomType: null,
      therapistSkill: null,
      legacyConductionNote: null,
      ...overrides,
    })
    .returning();

  return session;
}

async function createAppointment(
  tenantId: string,
  patientId: number,
  bookingNumber: string,
  planId?: number,
  sessionId?: number
) {
  const [status] = await db
    .insert(appointmentStatusTable)
    .values({
      tenantId,
      name: `Scheduled ${bookingNumber}`,
      code: `S${bookingNumber}`,
      category: 'SCHEDULED',
    })
    .returning();
  const [appointment] = await db
    .insert(appointmentTable)
    .values({
      tenantId,
      patientId,
      bookingNumber,
      bookingPath: 'PROCEDURE',
      appointmentStatusId: status.id,
      patientTreatmentPlanId: planId,
      patientTreatmentPlanSessionId: sessionId,
      slotDate: '2026-10-01',
      startTime: '09:00',
      endTime: '10:00',
    })
    .returning();

  return appointment;
}

describe('Patient Treatment Plan repository', () => {
  it('should return only current Tenant-scoped Plans with derived progress and snapshot availability', async () => {
    const patient = await createPatient(tenantA, 'MRN-A');
    const otherPatient = await createPatient(tenantA, 'MRN-B');
    const otherTenantPatient = await createPatient(tenantB, 'MRN-A');
    const treatment = await createTreatment(tenantA, 'REPEATABLE', 'MASTER-A');

    const pendingPlan = await createPlan(tenantA, patient.id, treatment.id, 2);
    const pendingSecond = await createPlanSession(tenantA, pendingPlan.id, 2);
    const pendingFirst = await createPlanSession(tenantA, pendingPlan.id, 1);
    const releasedAppointment = await createAppointment(
      tenantA,
      patient.id,
      'APT-REL',
      pendingPlan.id,
      pendingSecond.id
    );
    await db.insert(reservationTable).values({
      tenantId: tenantA,
      appointmentId: releasedAppointment.id,
      patientTreatmentPlanSessionId: pendingSecond.id,
      isDeleted: true,
      deletedOn: new Date('2026-09-01T00:00:00Z'),
    });

    const inProgressPlan = await createPlan(tenantA, patient.id, treatment.id, 3, {
      treatmentName: 'Historical snapshot name',
    });
    const reservedSession = await createPlanSession(tenantA, inProgressPlan.id, 3);
    const completedSession = await createPlanSession(tenantA, inProgressPlan.id, 1, {
      completionStatus: 'COMPLETED',
      completionSource: 'LEGACY_IMPORT',
    });
    await createPlanSession(tenantA, inProgressPlan.id, 2);
    const completedAppointment = await createAppointment(
      tenantA,
      patient.id,
      'APT-CMP',
      inProgressPlan.id,
      completedSession.id
    );
    await db.insert(reservationTable).values({
      tenantId: tenantA,
      appointmentId: completedAppointment.id,
      patientTreatmentPlanSessionId: completedSession.id,
    });
    const activeAppointment = await createAppointment(
      tenantA,
      patient.id,
      'APT-ACT',
      inProgressPlan.id,
      reservedSession.id
    );
    await db.insert(reservationTable).values({
      tenantId: tenantA,
      appointmentId: activeAppointment.id,
      patientTreatmentPlanSessionId: reservedSession.id,
    });

    const completedPlan = await createPlan(tenantA, patient.id, treatment.id, 1);
    await createPlanSession(tenantA, completedPlan.id, 1, {
      completionStatus: 'COMPLETED',
      completionSource: 'LEGACY_IMPORT',
    });
    const stoppedPlan = await createPlan(tenantA, patient.id, treatment.id, 1, {
      statusOverride: 'STOPPED',
    });
    await createPlanSession(tenantA, stoppedPlan.id, 1);
    const anotherPatientPlan = await createPlan(tenantA, otherPatient.id, treatment.id, 1);
    await createPlanSession(tenantA, anotherPatientPlan.id, 1);
    const otherTenantTreatment = await createTreatment(tenantB, 'REPEATABLE', 'MASTER-B');
    const otherTenantPlan = await createPlan(
      tenantB,
      otherTenantPatient.id,
      otherTenantTreatment.id,
      1
    );
    await createPlanSession(tenantB, otherTenantPlan.id, 1);

    await db
      .update(treatmentTable)
      .set({ name: 'Changed master name' })
      .where(eq(treatmentTable.id, treatment.id));

    const result = await patientTreatmentPlanRepository.getCurrentByPatientId(patient.id, tenantA);

    expect(result).toHaveLength(2);
    expect(result).toEqual([
      expect.objectContaining({
        id: pendingPlan.id,
        status: 'PENDING',
        totalSessions: 2,
        completedSessions: 0,
        treatmentName: 'Assigned snapshot name',
        sessions: [
          expect.objectContaining({
            id: pendingFirst.id,
            sessionNumber: 1,
            isReserved: false,
            isBookable: true,
            unavailableReason: null,
            durationMinutes: null,
            legacyConductionNote: null,
          }),
          expect.objectContaining({
            id: pendingSecond.id,
            sessionNumber: 2,
            isReserved: false,
            isBookable: true,
            unavailableReason: null,
          }),
        ],
      }),
      expect.objectContaining({
        id: inProgressPlan.id,
        status: 'IN_PROGRESS',
        totalSessions: 3,
        completedSessions: 1,
        treatmentName: 'Historical snapshot name',
        sessions: [
          expect.objectContaining({
            id: completedSession.id,
            sessionNumber: 1,
            isReserved: true,
            isBookable: false,
            unavailableReason: 'COMPLETED',
          }),
          expect.objectContaining({ sessionNumber: 2, isBookable: true }),
          expect.objectContaining({
            id: reservedSession.id,
            sessionNumber: 3,
            isReserved: true,
            isBookable: false,
            unavailableReason: 'RESERVED',
            reservedAppointment: {
              bookingNumber: 'APT-ACT',
              slotDate: '2026-10-01',
              startTime: '09:00',
              endTime: '10:00',
            },
          }),
        ],
      }),
    ]);
  });

  it('should lock and return only a current Session belonging to the requested Patient, Plan, and Tenant', async () => {
    const patient = await createPatient(tenantA, 'MRN-A');
    const otherPatient = await createPatient(tenantA, 'MRN-B');
    const treatment = await createTreatment(tenantA, 'REPEATABLE', 'MASTER-A');
    const plan = await createPlan(tenantA, patient.id, treatment.id, 2);
    const session = await createPlanSession(tenantA, plan.id, 1, {
      treatmentSessionId: (await createTemplate(tenantA, treatment.id, 1)).id,
    });
    const anotherPlan = await createPlan(tenantA, patient.id, treatment.id, 1);
    const anotherSession = await createPlanSession(tenantA, anotherPlan.id, 1);

    await db.transaction(async (tx) => {
      await expect(
        patientTreatmentPlanRepository.getPlanSessionForBooking(
          plan.id,
          session.id,
          patient.id,
          tenantA,
          tx
        )
      ).resolves.toMatchObject({
        patientTreatmentPlanId: plan.id,
        patientTreatmentPlanSessionId: session.id,
        treatmentId: treatment.id,
        sessionNumber: 1,
      });
      await expect(
        patientTreatmentPlanRepository.getPlanSessionForBooking(
          plan.id,
          session.id,
          otherPatient.id,
          tenantA,
          tx
        )
      ).resolves.toBeUndefined();
      await expect(
        patientTreatmentPlanRepository.getPlanSessionForBooking(
          plan.id,
          anotherSession.id,
          patient.id,
          tenantA,
          tx
        )
      ).resolves.toBeUndefined();
      await expect(
        patientTreatmentPlanRepository.getPlanSessionForBooking(
          plan.id,
          session.id,
          patient.id,
          tenantB,
          tx
        )
      ).resolves.toBeUndefined();
    });
  });

  it('should reject completed, stopped, reserved, and soft-deleted selections from booking context', async () => {
    const patient = await createPatient(tenantA, 'MRN-A');
    const treatment = await createTreatment(tenantA, 'REPEATABLE', 'MASTER-A');
    const completedPlan = await createPlan(tenantA, patient.id, treatment.id, 1);
    const completed = await createPlanSession(tenantA, completedPlan.id, 1, {
      completionStatus: 'COMPLETED',
      completionSource: 'LEGACY_IMPORT',
    });
    const stoppedPlan = await createPlan(tenantA, patient.id, treatment.id, 1, {
      statusOverride: 'STOPPED',
    });
    const stopped = await createPlanSession(tenantA, stoppedPlan.id, 1);
    const reservedPlan = await createPlan(tenantA, patient.id, treatment.id, 1);
    const reserved = await createPlanSession(tenantA, reservedPlan.id, 1);
    const deletedPlan = await createPlan(tenantA, patient.id, treatment.id, 1);
    const sessionOnDeletedPlan = await createPlanSession(tenantA, deletedPlan.id, 1);
    const activePlan = await createPlan(tenantA, patient.id, treatment.id, 1);
    const deletedSession = await createPlanSession(tenantA, activePlan.id, 1);
    const deletedOn = new Date('2026-09-16T08:00:00Z');
    await db
      .update(planTable)
      .set({ isDeleted: true, deletedOn })
      .where(eq(planTable.id, deletedPlan.id));
    await db
      .update(sessionTable)
      .set({ isDeleted: true, deletedOn })
      .where(eq(sessionTable.id, deletedSession.id));
    const appointment = await createAppointment(
      tenantA,
      patient.id,
      'APT-ACT',
      reservedPlan.id,
      reserved.id
    );
    await db.insert(reservationTable).values({
      tenantId: tenantA,
      appointmentId: appointment.id,
      patientTreatmentPlanSessionId: reserved.id,
    });

    await db.transaction(async (tx) => {
      for (const [planId, sessionId] of [
        [completedPlan.id, completed.id],
        [stoppedPlan.id, stopped.id],
        [reservedPlan.id, reserved.id],
        [deletedPlan.id, sessionOnDeletedPlan.id],
        [activePlan.id, deletedSession.id],
      ]) {
        await expect(
          patientTreatmentPlanRepository.getPlanSessionForBooking(
            planId,
            sessionId,
            patient.id,
            tenantA,
            tx
          )
        ).resolves.toBeUndefined();
      }
    });
  });

  it('should create Repeatable and Sequenced Plans from immutable Treatment snapshots in the caller transaction', async () => {
    const patient = await createPatient(tenantA, 'MRN-A');
    const repeatable = await createTreatment(tenantA, 'REPEATABLE', 'MASTER-R');
    const repeatedTemplate = await createTemplate(tenantA, repeatable.id, 1, {
      durationMinutes: null,
      setupMinutes: null,
      cleaningMinutes: null,
    });
    const sequenced = await createTreatment(tenantA, 'SEQUENCED', 'MASTER-S');
    const secondTemplate = await createTemplate(tenantA, sequenced.id, 2);
    const firstTemplate = await createTemplate(tenantA, sequenced.id, 1);

    const [repeatableCreated, sequencedCreated] = await db.transaction(async (tx) => {
      const createdRepeatable = await patientTreatmentPlanRepository.createPlanFromTreatment(
        {
          tenantId: tenantA,
          patientId: patient.id,
          treatmentId: repeatable.id,
          totalSessions: 20,
        },
        tx
      );
      const createdSequenced = await patientTreatmentPlanRepository.createPlanFromTreatment(
        { tenantId: tenantA, patientId: patient.id, treatmentId: sequenced.id },
        tx
      );
      return [createdRepeatable, createdSequenced];
    });

    expect(repeatableCreated).toMatchObject({
      patientTreatmentPlanId: expect.any(Number),
      totalSessions: 20,
    });
    expect(repeatableCreated.sessions).toHaveLength(20);
    expect(repeatableCreated.sessions[0]).toMatchObject({
      sessionNumber: 1,
      treatmentSessionId: repeatedTemplate.id,
      durationMinutes: null,
    });
    expect(repeatableCreated.sessions[19]).toMatchObject({
      sessionNumber: 20,
      treatmentSessionId: repeatedTemplate.id,
    });
    expect(sequencedCreated).toMatchObject({
      totalSessions: 2,
      sessions: [
        expect.objectContaining({ sessionNumber: 1, treatmentSessionId: firstTemplate.id }),
        expect.objectContaining({ sessionNumber: 2, treatmentSessionId: secondTemplate.id }),
      ],
    });

    await db
      .update(treatmentTable)
      .set({ name: 'Changed after assignment' })
      .where(eq(treatmentTable.id, repeatable.id));
    await db
      .update(templateTable)
      .set({ label: 'Changed after assignment' })
      .where(eq(templateTable.id, repeatedTemplate.id));
    const [savedPlan] = await db
      .select()
      .from(planTable)
      .where(eq(planTable.id, repeatableCreated.patientTreatmentPlanId));
    const [savedSession] = await db
      .select()
      .from(sessionTable)
      .where(eq(sessionTable.id, repeatableCreated.sessions[0].patientTreatmentPlanSessionId));
    expect(savedPlan.treatmentName).toBe('MASTER-R master name');
    expect(savedSession.label).toBe('Template 1');
  });

  it('should reject a caller-supplied Session count for a Sequenced Treatment', async () => {
    const patient = await createPatient(tenantA, 'MRN-A');
    const treatment = await createTreatment(tenantA, 'SEQUENCED', 'MASTER-S');
    await createTemplate(tenantA, treatment.id, 1);
    await createTemplate(tenantA, treatment.id, 2);

    await expect(
      db.transaction((tx) =>
        patientTreatmentPlanRepository.createPlanFromTreatment(
          { tenantId: tenantA, patientId: patient.id, treatmentId: treatment.id, totalSessions: 9 },
          tx
        )
      )
    ).rejects.toThrow('Sequenced Treatment derives its count from Session templates');

    await expect(
      db
        .select()
        .from(planTable)
        .where(and(eq(planTable.tenantId, tenantA), eq(planTable.patientId, patient.id)))
    ).resolves.toEqual([]);
  });

  it('should roll back Plan creation with the caller transaction', async () => {
    const patient = await createPatient(tenantA, 'MRN-A');
    const treatment = await createTreatment(tenantA, 'REPEATABLE', 'MASTER-A');
    await createTemplate(tenantA, treatment.id, 1);

    await expect(
      db.transaction(async (tx) => {
        await patientTreatmentPlanRepository.createPlanFromTreatment(
          { tenantId: tenantA, patientId: patient.id, treatmentId: treatment.id, totalSessions: 2 },
          tx
        );
        throw new Error('force rollback');
      })
    ).rejects.toThrow('force rollback');

    const plans = await db
      .select()
      .from(planTable)
      .where(and(eq(planTable.tenantId, tenantA), eq(planTable.patientId, patient.id)));
    expect(plans).toEqual([]);
  });

  it('should reserve and release a Tenant-scoped Session using the caller transaction', async () => {
    const patient = await createPatient(tenantA, 'MRN-A');
    const treatment = await createTreatment(tenantA, 'REPEATABLE', 'MASTER-A');
    const plan = await createPlan(tenantA, patient.id, treatment.id, 1);
    const session = await createPlanSession(tenantA, plan.id, 1);
    const appointment = await createAppointment(
      tenantA,
      patient.id,
      'APT-ACT',
      plan.id,
      session.id
    );

    await db.transaction(async (tx) => {
      await patientTreatmentPlanRepository.reserveSession(session.id, appointment.id, tenantA, tx);
    });
    await expect(
      db
        .select()
        .from(reservationTable)
        .where(
          and(
            eq(reservationTable.tenantId, tenantA),
            eq(reservationTable.appointmentId, appointment.id),
            eq(reservationTable.isDeleted, false)
          )
        )
    ).resolves.toHaveLength(1);

    await db.transaction((tx) =>
      patientTreatmentPlanRepository.releaseReservationForAppointment(appointment.id, tenantA, tx)
    );
    const [released] = await db
      .select()
      .from(reservationTable)
      .where(eq(reservationTable.appointmentId, appointment.id));
    expect(released).toMatchObject({ isDeleted: true, deletedOn: expect.any(Date) });
  });

  it('should complete the Appointment Plan Session only from its completed Tenant-scoped Visit', async () => {
    const patient = await createPatient(tenantA, 'MRN-A');
    const treatment = await createTreatment(tenantA, 'REPEATABLE', 'MASTER-A');
    const plan = await createPlan(tenantA, patient.id, treatment.id, 1);
    const session = await createPlanSession(tenantA, plan.id, 1);
    const appointment = await createAppointment(
      tenantA,
      patient.id,
      'APT-ACT',
      plan.id,
      session.id
    );
    await db.insert(organization).values({
      id: tenantA,
      name: 'Plan tenant',
      slug: tenantA,
      createdAt: new Date(),
    });
    await db.insert(user).values({
      id: 'plan-read-doctor',
      name: 'Plan Doctor',
      email: 'plan-read-doctor@example.test',
    });
    const [specialty] = await db
      .insert(specialtyTable)
      .values({ tenantId: tenantA, name: 'General', code: 'GEN' })
      .returning();
    const [doctor] = await db
      .insert(doctorTable)
      .values({ tenantId: tenantA, userId: 'plan-read-doctor', specialtyId: specialty.id })
      .returning();
    const [visitType] = await db
      .insert(visitTypeTable)
      .values({ tenantId: tenantA, name: 'Procedure', code: 'PROC' })
      .returning();
    const completedAt = new Date('2026-10-01T06:00:00Z');
    const [visit] = await db
      .insert(visitTable)
      .values({
        tenantId: tenantA,
        appointmentId: appointment.id,
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

    await db.transaction((tx) =>
      patientTreatmentPlanRepository.completeSessionForVisit(visit.id, appointment.id, tenantA, tx)
    );

    const [completed] = await db
      .select()
      .from(sessionTable)
      .where(and(eq(sessionTable.id, session.id), eq(sessionTable.tenantId, tenantA)));
    expect(completed).toMatchObject({
      completionStatus: 'COMPLETED',
      completionSource: 'VISIT',
      completedVisitId: visit.id,
      completedAt,
    });

    const changedVisitCompletedAt = new Date('2026-10-01T07:00:00Z');
    await db
      .update(visitTable)
      .set({ completedAt: changedVisitCompletedAt })
      .where(eq(visitTable.id, visit.id));
    await db.transaction((tx) =>
      patientTreatmentPlanRepository.completeSessionForVisit(visit.id, appointment.id, tenantA, tx)
    );
    const [stillCompleted] = await db
      .select()
      .from(sessionTable)
      .where(and(eq(sessionTable.id, session.id), eq(sessionTable.tenantId, tenantA)));
    expect(stillCompleted.completedAt).toEqual(completedAt);
  });

  it('should leave Plan Sessions unchanged for a historical Appointment without Plan references', async () => {
    const patient = await createPatient(tenantA, 'MRN-A');
    const treatment = await createTreatment(tenantA, 'REPEATABLE', 'MASTER-A');
    const plan = await createPlan(tenantA, patient.id, treatment.id, 1);
    const unrelatedSession = await createPlanSession(tenantA, plan.id, 1);
    const historicalAppointment = await createAppointment(tenantA, patient.id, 'APT-HIST');
    await db.insert(organization).values({
      id: tenantA,
      name: 'Plan tenant',
      slug: tenantA,
      createdAt: new Date(),
    });
    await db.insert(user).values({
      id: 'plan-history-doctor',
      name: 'Plan History Doctor',
      email: 'plan-history-doctor@example.test',
    });
    const [specialty] = await db
      .insert(specialtyTable)
      .values({ tenantId: tenantA, name: 'General', code: 'GEN' })
      .returning();
    const [doctor] = await db
      .insert(doctorTable)
      .values({ tenantId: tenantA, userId: 'plan-history-doctor', specialtyId: specialty.id })
      .returning();
    const [visitType] = await db
      .insert(visitTypeTable)
      .values({ tenantId: tenantA, name: 'Procedure', code: 'PROC' })
      .returning();
    const [visit] = await db
      .insert(visitTable)
      .values({
        tenantId: tenantA,
        appointmentId: historicalAppointment.id,
        patientId: patient.id,
        doctorId: doctor.id,
        visitTypeId: visitType.id,
        visitNumber: 'VST-1001',
        visitDate: '2026-10-01',
        queueToken: 1,
        status: 'COMPLETED',
        completedAt: new Date('2026-10-01T06:00:00Z'),
      })
      .returning();

    await db.transaction((tx) =>
      patientTreatmentPlanRepository.completeSessionForVisit(
        visit.id,
        historicalAppointment.id,
        tenantA,
        tx
      )
    );

    const [unchangedAppointment] = await db
      .select({
        planId: appointmentTable.patientTreatmentPlanId,
        sessionId: appointmentTable.patientTreatmentPlanSessionId,
      })
      .from(appointmentTable)
      .where(eq(appointmentTable.id, historicalAppointment.id));
    const [unchanged] = await db
      .select()
      .from(sessionTable)
      .where(eq(sessionTable.id, unrelatedSession.id));
    expect(unchangedAppointment).toEqual({ planId: null, sessionId: null });
    expect(unchanged).toMatchObject({
      completionStatus: 'PENDING',
      completionSource: null,
      completedVisitId: null,
      completedAt: null,
    });
  });
});
