import { randomUUID } from 'node:crypto';

import { and, eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';

import { db } from '@/app/db';
import { appointment as appointmentTable } from '@/app/db/schema/appointment';
import { appointmentMode as appointmentModeTable } from '@/app/db/schema/appointment-mode';
import { appointmentReason as appointmentReasonTable } from '@/app/db/schema/appointment-reason';
import { appointmentStatus as appointmentStatusTable } from '@/app/db/schema/appointment-status';
import { appointmentType as appointmentTypeTable } from '@/app/db/schema/appointment-type';
import { organization, user } from '@/app/db/schema/auth';
import { doctor as doctorTable } from '@/app/db/schema/doctor';
import { patient as patientTable } from '@/app/db/schema/patient';
import { specialty as specialtyTable } from '@/app/db/schema/specialty';
import { visitType as visitTypeTable } from '@/app/db/schema/visit-type';
import type { AppointmentStatusCategory } from '../../appointment-status/schemas/appointment-status-schema';
import type { ValidatedCheckInVisitData } from '../schemas/visit-schema';
import { visitRepository } from './visit-repository';

const tenantA = 'tenant-a-test';
const tenantB = 'tenant-b-test';
const TODAY = '2026-07-16';

type TenantFixtures = {
  doctorId: number;
  patientId: number;
  visitTypeId: number;
};

async function createTenant(tenantId: string) {
  await db
    .insert(organization)
    .values({ id: tenantId, name: tenantId, slug: tenantId, createdAt: new Date() })
    .onConflictDoNothing();
}

async function createDoctor(tenantId: string, name = 'Dr Mehta') {
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

let mrnSequence = 0;

async function createPatient(tenantId: string, firstName = 'Asha') {
  mrnSequence += 1;
  const [patient] = await db
    .insert(patientTable)
    .values({
      tenantId,
      mrn: `MRN-${String(1000 + mrnSequence)}`,
      firstName,
      lastName: 'Rao',
      phone: '+91-9876543210',
      registrationStatus: 'registered',
    })
    .returning({ id: patientTable.id });

  return patient.id;
}

async function createVisitType(tenantId: string) {
  const [visitType] = await db
    .insert(visitTypeTable)
    .values({ tenantId, name: 'OPD Consultation', code: 'OPD' })
    .returning({ id: visitTypeTable.id });

  return visitType.id;
}

async function createTenantFixtures(tenantId: string): Promise<TenantFixtures> {
  await createTenant(tenantId);

  return {
    doctorId: await createDoctor(tenantId),
    patientId: await createPatient(tenantId),
    visitTypeId: await createVisitType(tenantId),
  };
}

async function createAppointment(
  tenantId: string,
  fixtures: TenantFixtures,
  category: AppointmentStatusCategory = 'SCHEDULED'
) {
  const [mode] = await db
    .insert(appointmentModeTable)
    .values({ tenantId, name: 'In-person', code: 'INP' })
    .returning({ id: appointmentModeTable.id });
  const [type] = await db
    .insert(appointmentTypeTable)
    .values({ tenantId, name: 'New Consultation', code: 'NEW' })
    .returning({ id: appointmentTypeTable.id });
  const [reason] = await db
    .insert(appointmentReasonTable)
    .values({ tenantId, name: 'Consultation', code: 'CONS' })
    .returning({ id: appointmentReasonTable.id });

  // Every system category must exist so the Visit transitions can resolve them.
  const statuses = await db
    .insert(appointmentStatusTable)
    .values(
      (['SCHEDULED', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED', 'NO_SHOW'] as const).map(
        (statusCategory) => ({
          tenantId,
          name: statusCategory,
          code: statusCategory.slice(0, 3),
          category: statusCategory,
          isSystem: true,
        })
      )
    )
    .returning({ id: appointmentStatusTable.id, category: appointmentStatusTable.category });

  const statusId = statuses.find((status) => status.category === category)!.id;

  const [appointment] = await db
    .insert(appointmentTable)
    .values({
      tenantId,
      bookingNumber: `APT-${String(1000 + Math.floor(Math.random() * 8999))}`,
      patientId: fixtures.patientId,
      doctorId: fixtures.doctorId,
      appointmentModeId: mode.id,
      appointmentTypeId: type.id,
      appointmentReasonId: reason.id,
      appointmentStatusId: statusId,
      slotDate: TODAY,
      rotaName: 'Morning',
    })
    .returning({ id: appointmentTable.id });

  return {
    appointmentId: appointment.id,
    statusIdsByCategory: new Map(statuses.map((status) => [status.category, status.id])),
  };
}

const checkInData = (
  tenantId: string,
  fixtures: TenantFixtures,
  overrides: Partial<ValidatedCheckInVisitData> = {}
): ValidatedCheckInVisitData => ({
  tenantId,
  patientId: fixtures.patientId,
  doctorId: fixtures.doctorId,
  visitTypeId: fixtures.visitTypeId,
  visitDate: TODAY,
  ...overrides,
});

async function appointmentStatusCategoryOf(appointmentId: number) {
  const [row] = await db
    .select({ category: appointmentStatusTable.category })
    .from(appointmentTable)
    .innerJoin(
      appointmentStatusTable,
      eq(appointmentStatusTable.id, appointmentTable.appointmentStatusId)
    )
    .where(eq(appointmentTable.id, appointmentId));

  return row.category;
}

describe('Visit repository', () => {
  let fixturesA: TenantFixtures;

  beforeEach(async () => {
    mrnSequence = 0;
    fixturesA = await createTenantFixtures(tenantA);
  });

  describe('checkInVisit', () => {
    it('should create a walk-in visit with a generated visit number and first queue token', async () => {
      const result = await visitRepository.checkInVisit(checkInData(tenantA, fixturesA));

      expect(result).toMatchObject({
        success: true,
        data: {
          visitNumber: 'VST-1001',
          queueToken: 1,
          status: 'CHECKED_IN',
          visitDate: '16-07-2026',
          appointment: null,
        },
      });
    });

    it('should embed the patient, doctor and visit type in the created visit', async () => {
      const result = await visitRepository.checkInVisit(checkInData(tenantA, fixturesA));

      expect(result).toMatchObject({
        success: true,
        data: {
          patient: { id: fixturesA.patientId, mrn: 'MRN-1001', firstName: 'Asha' },
          doctor: { id: fixturesA.doctorId, name: 'Dr Mehta' },
          visitType: { code: 'OPD' },
        },
      });
    });

    it('should increment the visit number sequence per tenant', async () => {
      await visitRepository.checkInVisit(checkInData(tenantA, fixturesA));
      const secondPatient = await createPatient(tenantA, 'Bilal');

      const second = await visitRepository.checkInVisit(
        checkInData(tenantA, fixturesA, { patientId: secondPatient })
      );

      expect(second).toMatchObject({ success: true, data: { visitNumber: 'VST-1002' } });
    });

    it('should start each tenant visit number sequence independently', async () => {
      const fixturesB = await createTenantFixtures(tenantB);

      await visitRepository.checkInVisit(checkInData(tenantA, fixturesA));
      const tenantBVisit = await visitRepository.checkInVisit(checkInData(tenantB, fixturesB));

      expect(tenantBVisit).toMatchObject({ success: true, data: { visitNumber: 'VST-1001' } });
    });

    it('should increment the queue token per doctor per day', async () => {
      const secondPatient = await createPatient(tenantA, 'Bilal');

      await visitRepository.checkInVisit(checkInData(tenantA, fixturesA));
      const second = await visitRepository.checkInVisit(
        checkInData(tenantA, fixturesA, { patientId: secondPatient })
      );

      expect(second).toMatchObject({ success: true, data: { queueToken: 2 } });
    });

    it('should give each doctor their own token 1 on the same day', async () => {
      const otherDoctor = await createDoctor(tenantA, 'Dr Iyer');
      const secondPatient = await createPatient(tenantA, 'Bilal');

      await visitRepository.checkInVisit(checkInData(tenantA, fixturesA));
      const second = await visitRepository.checkInVisit(
        checkInData(tenantA, fixturesA, { patientId: secondPatient, doctorId: otherDoctor })
      );

      expect(second).toMatchObject({ success: true, data: { queueToken: 1 } });
    });

    it('should restart the queue token on the next day', async () => {
      const secondPatient = await createPatient(tenantA, 'Bilal');

      await visitRepository.checkInVisit(checkInData(tenantA, fixturesA));
      const nextDay = await visitRepository.checkInVisit(
        checkInData(tenantA, fixturesA, { patientId: secondPatient, visitDate: '2026-07-17' })
      );

      expect(nextDay).toMatchObject({ success: true, data: { queueToken: 1 } });
    });

    it('should not reuse the queue token of a cancelled visit', async () => {
      const secondPatient = await createPatient(tenantA, 'Bilal');
      const first = await visitRepository.checkInVisit(checkInData(tenantA, fixturesA));

      if (!first.success) throw new Error('check-in failed');
      await visitRepository.cancelVisit(first.data.id, tenantA, 'Patient left');

      const second = await visitRepository.checkInVisit(
        checkInData(tenantA, fixturesA, { patientId: secondPatient })
      );

      expect(second).toMatchObject({ success: true, data: { queueToken: 2 } });
    });

    it('should move the linked appointment to its checked-in status', async () => {
      const { appointmentId } = await createAppointment(tenantA, fixturesA);

      await visitRepository.checkInVisit(checkInData(tenantA, fixturesA, { appointmentId }));

      await expect(appointmentStatusCategoryOf(appointmentId)).resolves.toBe('CHECKED_IN');
    });

    it('should embed the linked appointment booking number in the visit', async () => {
      const { appointmentId } = await createAppointment(tenantA, fixturesA);

      const result = await visitRepository.checkInVisit(
        checkInData(tenantA, fixturesA, { appointmentId })
      );

      expect(result).toMatchObject({
        success: true,
        data: { appointment: { id: appointmentId } },
      });
    });

    it('should reject a second active visit for the same patient', async () => {
      await visitRepository.checkInVisit(checkInData(tenantA, fixturesA));

      await expect(visitRepository.checkInVisit(checkInData(tenantA, fixturesA))).rejects.toThrow();
    });

    it('should allow a new visit once the previous one is completed', async () => {
      const first = await visitRepository.checkInVisit(checkInData(tenantA, fixturesA));
      if (!first.success) throw new Error('check-in failed');

      await visitRepository.startConsultation(first.data.id, tenantA);
      await visitRepository.completeVisit(first.data.id, tenantA);

      await expect(
        visitRepository.checkInVisit(checkInData(tenantA, fixturesA))
      ).resolves.toMatchObject({ success: true });
    });

    it('should allow re-check-in of the same appointment after its visit is cancelled', async () => {
      const { appointmentId } = await createAppointment(tenantA, fixturesA);
      const first = await visitRepository.checkInVisit(
        checkInData(tenantA, fixturesA, { appointmentId })
      );
      if (!first.success) throw new Error('check-in failed');

      await visitRepository.cancelVisit(first.data.id, tenantA, 'Wrong patient');

      await expect(
        visitRepository.checkInVisit(checkInData(tenantA, fixturesA, { appointmentId }))
      ).resolves.toMatchObject({ success: true });
    });

    it('should reject a second non-cancelled visit for the same appointment', async () => {
      const { appointmentId } = await createAppointment(tenantA, fixturesA);
      const first = await visitRepository.checkInVisit(
        checkInData(tenantA, fixturesA, { appointmentId })
      );
      if (!first.success) throw new Error('check-in failed');

      // Free the patient so only the appointment index can reject the second check-in.
      await visitRepository.startConsultation(first.data.id, tenantA);
      await visitRepository.completeVisit(first.data.id, tenantA);

      await expect(
        visitRepository.checkInVisit(checkInData(tenantA, fixturesA, { appointmentId }))
      ).rejects.toThrow();
    });

    it('should return the not-configured outcome and roll back when no system checked-in status exists', async () => {
      const [status] = await db
        .insert(appointmentStatusTable)
        .values({
          tenantId: tenantA,
          name: 'Scheduled',
          code: 'SCH',
          category: 'SCHEDULED',
          isSystem: true,
        })
        .returning({ id: appointmentStatusTable.id });
      const [mode] = await db
        .insert(appointmentModeTable)
        .values({ tenantId: tenantA, name: 'In-person', code: 'INP' })
        .returning({ id: appointmentModeTable.id });
      const [type] = await db
        .insert(appointmentTypeTable)
        .values({ tenantId: tenantA, name: 'New', code: 'NEW' })
        .returning({ id: appointmentTypeTable.id });
      const [reason] = await db
        .insert(appointmentReasonTable)
        .values({ tenantId: tenantA, name: 'Consultation', code: 'CONS' })
        .returning({ id: appointmentReasonTable.id });
      const [appointment] = await db
        .insert(appointmentTable)
        .values({
          tenantId: tenantA,
          bookingNumber: 'APT-1001',
          patientId: fixturesA.patientId,
          doctorId: fixturesA.doctorId,
          appointmentModeId: mode.id,
          appointmentTypeId: type.id,
          appointmentReasonId: reason.id,
          appointmentStatusId: status.id,
          slotDate: TODAY,
          rotaName: 'Morning',
        })
        .returning({ id: appointmentTable.id });

      // The caller gets the typed outcome, not a thrown TransactionRollbackError,
      // so the command can map it to a clean 409 rather than a 500.
      await expect(
        visitRepository.checkInVisit(
          checkInData(tenantA, fixturesA, { appointmentId: appointment.id })
        )
      ).resolves.toEqual({ success: false, outcome: 'appointment-status-not-configured' });

      // The rollback must leave no half-created Visit behind.
      await expect(
        visitRepository.findActiveVisitByPatientId(tenantA, fixturesA.patientId)
      ).resolves.toBeUndefined();
    });
  });

  describe('transitions', () => {
    it('should start a consultation and stamp the timestamp', async () => {
      const created = await visitRepository.checkInVisit(checkInData(tenantA, fixturesA));
      if (!created.success) throw new Error('check-in failed');

      const result = await visitRepository.startConsultation(created.data.id, tenantA);

      expect(result.outcome).toBe('updated');
      expect(result).toMatchObject({ data: { status: 'IN_CONSULTATION' } });
      if (result.outcome === 'updated') {
        expect(result.data.consultationStartedAt).toBeInstanceOf(Date);
      }
    });

    it('should reject starting a visit that is already in consultation', async () => {
      const created = await visitRepository.checkInVisit(checkInData(tenantA, fixturesA));
      if (!created.success) throw new Error('check-in failed');
      await visitRepository.startConsultation(created.data.id, tenantA);

      const result = await visitRepository.startConsultation(created.data.id, tenantA);

      expect(result.outcome).toBe('invalid-status');
    });

    it('should reject completing a visit that has not started', async () => {
      const created = await visitRepository.checkInVisit(checkInData(tenantA, fixturesA));
      if (!created.success) throw new Error('check-in failed');

      const result = await visitRepository.completeVisit(created.data.id, tenantA);

      expect(result.outcome).toBe('invalid-status');
    });

    it('should complete a visit and move the appointment to completed', async () => {
      const { appointmentId } = await createAppointment(tenantA, fixturesA);
      const created = await visitRepository.checkInVisit(
        checkInData(tenantA, fixturesA, { appointmentId })
      );
      if (!created.success) throw new Error('check-in failed');
      await visitRepository.startConsultation(created.data.id, tenantA);

      const result = await visitRepository.completeVisit(created.data.id, tenantA);

      expect(result).toMatchObject({ outcome: 'updated', data: { status: 'COMPLETED' } });
      await expect(appointmentStatusCategoryOf(appointmentId)).resolves.toBe('COMPLETED');
    });

    it('should cancel a checked-in visit and return the appointment to scheduled', async () => {
      const { appointmentId } = await createAppointment(tenantA, fixturesA);
      const created = await visitRepository.checkInVisit(
        checkInData(tenantA, fixturesA, { appointmentId })
      );
      if (!created.success) throw new Error('check-in failed');
      await expect(appointmentStatusCategoryOf(appointmentId)).resolves.toBe('CHECKED_IN');

      const result = await visitRepository.cancelVisit(created.data.id, tenantA, 'Patient left');

      expect(result).toMatchObject({
        outcome: 'updated',
        data: { status: 'CANCELLED', cancellationReason: 'Patient left' },
      });
      await expect(appointmentStatusCategoryOf(appointmentId)).resolves.toBe('SCHEDULED');
    });

    it('should cancel a visit that is in consultation', async () => {
      const created = await visitRepository.checkInVisit(checkInData(tenantA, fixturesA));
      if (!created.success) throw new Error('check-in failed');
      await visitRepository.startConsultation(created.data.id, tenantA);

      const result = await visitRepository.cancelVisit(created.data.id, tenantA, 'Patient left');

      expect(result).toMatchObject({ outcome: 'updated', data: { status: 'CANCELLED' } });
    });

    it('should reject cancelling a completed visit', async () => {
      const created = await visitRepository.checkInVisit(checkInData(tenantA, fixturesA));
      if (!created.success) throw new Error('check-in failed');
      await visitRepository.startConsultation(created.data.id, tenantA);
      await visitRepository.completeVisit(created.data.id, tenantA);

      const result = await visitRepository.cancelVisit(created.data.id, tenantA, 'Too late');

      expect(result.outcome).toBe('invalid-status');
    });

    it('should return the not-configured outcome and roll back when the completed status is missing', async () => {
      // Seed every category except COMPLETED, so check-in succeeds but completing cannot.
      const { appointmentId } = await createAppointment(tenantA, fixturesA);
      await db
        .delete(appointmentStatusTable)
        .where(
          and(
            eq(appointmentStatusTable.tenantId, tenantA),
            eq(appointmentStatusTable.category, 'COMPLETED')
          )
        );

      const created = await visitRepository.checkInVisit(
        checkInData(tenantA, fixturesA, { appointmentId })
      );
      if (!created.success) throw new Error('check-in failed');
      await visitRepository.startConsultation(created.data.id, tenantA);

      await expect(visitRepository.completeVisit(created.data.id, tenantA)).resolves.toEqual({
        outcome: 'appointment-status-not-configured',
      });

      // The Visit must not be left Completed when its Appointment could not follow.
      await expect(visitRepository.getVisitById(created.data.id, tenantA)).resolves.toMatchObject({
        status: 'IN_CONSULTATION',
      });
      await expect(appointmentStatusCategoryOf(appointmentId)).resolves.toBe('CHECKED_IN');
    });

    it('should not transition a visit belonging to another tenant', async () => {
      const created = await visitRepository.checkInVisit(checkInData(tenantA, fixturesA));
      if (!created.success) throw new Error('check-in failed');

      await expect(
        visitRepository.startConsultation(created.data.id, tenantB)
      ).resolves.toMatchObject({ outcome: 'not-found' });
    });

    it('should return not-found for an unknown visit', async () => {
      await expect(visitRepository.completeVisit(9999, tenantA)).resolves.toMatchObject({
        outcome: 'not-found',
      });
    });

    it('should leave a walk-in transition unaffected by appointment status wiring', async () => {
      const created = await visitRepository.checkInVisit(checkInData(tenantA, fixturesA));
      if (!created.success) throw new Error('check-in failed');
      await visitRepository.startConsultation(created.data.id, tenantA);

      await expect(visitRepository.completeVisit(created.data.id, tenantA)).resolves.toMatchObject({
        outcome: 'updated',
        data: { status: 'COMPLETED', appointment: null },
      });
    });
  });

  describe('reads', () => {
    it('should not read a visit created by another tenant', async () => {
      const created = await visitRepository.checkInVisit(checkInData(tenantA, fixturesA));
      if (!created.success) throw new Error('check-in failed');

      await expect(visitRepository.getVisitById(created.data.id, tenantB)).resolves.toBeUndefined();
    });

    it('should exclude soft-deleted visits from reads', async () => {
      const created = await visitRepository.checkInVisit(checkInData(tenantA, fixturesA));
      if (!created.success) throw new Error('check-in failed');

      await visitRepository.deleteVisit(created.data.id, tenantA);

      await expect(visitRepository.getVisitById(created.data.id, tenantA)).resolves.toBeUndefined();
    });

    it('should return the visit when soft deleting and free the patient', async () => {
      const created = await visitRepository.checkInVisit(checkInData(tenantA, fixturesA));
      if (!created.success) throw new Error('check-in failed');

      await expect(visitRepository.deleteVisit(created.data.id, tenantA)).resolves.toMatchObject({
        visitNumber: 'VST-1001',
      });
      await expect(
        visitRepository.findActiveVisitByPatientId(tenantA, fixturesA.patientId)
      ).resolves.toBeUndefined();
    });

    it('should not soft-delete a visit belonging to another tenant', async () => {
      const created = await visitRepository.checkInVisit(checkInData(tenantA, fixturesA));
      if (!created.success) throw new Error('check-in failed');

      await expect(visitRepository.deleteVisit(created.data.id, tenantB)).resolves.toBeUndefined();
      await expect(visitRepository.getVisitById(created.data.id, tenantA)).resolves.toBeDefined();
    });

    it('should find the active visit for a patient and stop after it closes', async () => {
      const created = await visitRepository.checkInVisit(checkInData(tenantA, fixturesA));
      if (!created.success) throw new Error('check-in failed');

      await expect(
        visitRepository.findActiveVisitByPatientId(tenantA, fixturesA.patientId)
      ).resolves.toMatchObject({ id: created.data.id });

      await visitRepository.cancelVisit(created.data.id, tenantA, 'Left');

      await expect(
        visitRepository.findActiveVisitByPatientId(tenantA, fixturesA.patientId)
      ).resolves.toBeUndefined();
    });

    it('should isolate the active-visit lookup by tenant', async () => {
      await visitRepository.checkInVisit(checkInData(tenantA, fixturesA));

      await expect(
        visitRepository.findActiveVisitByPatientId(tenantB, fixturesA.patientId)
      ).resolves.toBeUndefined();
    });

    it('should find a non-cancelled visit by appointment and ignore cancelled ones', async () => {
      const { appointmentId } = await createAppointment(tenantA, fixturesA);
      const created = await visitRepository.checkInVisit(
        checkInData(tenantA, fixturesA, { appointmentId })
      );
      if (!created.success) throw new Error('check-in failed');

      await expect(
        visitRepository.findNonCancelledVisitByAppointmentId(tenantA, appointmentId)
      ).resolves.toMatchObject({ id: created.data.id });

      await visitRepository.cancelVisit(created.data.id, tenantA, 'Left');

      await expect(
        visitRepository.findNonCancelledVisitByAppointmentId(tenantA, appointmentId)
      ).resolves.toBeUndefined();
    });

    it('should expose the clinical capture context and isolate it by tenant', async () => {
      const created = await visitRepository.checkInVisit(checkInData(tenantA, fixturesA));
      if (!created.success) throw new Error('check-in failed');

      await expect(
        visitRepository.getVisitForClinicalCapture(tenantA, created.data.id)
      ).resolves.toEqual({
        id: created.data.id,
        patientId: fixturesA.patientId,
        status: 'CHECKED_IN',
      });
      await expect(
        visitRepository.getVisitForClinicalCapture(tenantB, created.data.id)
      ).resolves.toBeUndefined();
    });

    it('should update the chief complaint and remarks', async () => {
      const created = await visitRepository.checkInVisit(checkInData(tenantA, fixturesA));
      if (!created.success) throw new Error('check-in failed');

      await expect(
        visitRepository.updateVisit(created.data.id, tenantA, {
          chiefComplaint: 'Fever for 3 days',
          remarks: 'Referred by GP',
        })
      ).resolves.toMatchObject({ chiefComplaint: 'Fever for 3 days', remarks: 'Referred by GP' });
    });

    it('should not update a visit belonging to another tenant', async () => {
      const created = await visitRepository.checkInVisit(checkInData(tenantA, fixturesA));
      if (!created.success) throw new Error('check-in failed');

      await expect(
        visitRepository.updateVisit(created.data.id, tenantB, { chiefComplaint: 'Hijacked' })
      ).resolves.toBeUndefined();
    });
  });

  describe('getVisits', () => {
    it('should list only the tenant visits for a day ordered by queue token', async () => {
      const fixturesB = await createTenantFixtures(tenantB);
      const secondPatient = await createPatient(tenantA, 'Bilal');

      await visitRepository.checkInVisit(checkInData(tenantA, fixturesA));
      await visitRepository.checkInVisit(
        checkInData(tenantA, fixturesA, { patientId: secondPatient })
      );
      await visitRepository.checkInVisit(checkInData(tenantB, fixturesB));

      const result = await visitRepository.getVisits({ tenantId: tenantA, visitDate: TODAY });

      expect(result.total).toBe(2);
      expect(result.data.map((visit) => visit.queueToken)).toEqual([1, 2]);
    });

    it('should filter by visit date', async () => {
      const secondPatient = await createPatient(tenantA, 'Bilal');
      await visitRepository.checkInVisit(checkInData(tenantA, fixturesA));
      await visitRepository.checkInVisit(
        checkInData(tenantA, fixturesA, { patientId: secondPatient, visitDate: '2026-07-17' })
      );

      const result = await visitRepository.getVisits({
        tenantId: tenantA,
        visitDate: '2026-07-17',
      });

      expect(result.total).toBe(1);
      expect(result.data[0].visitDate).toBe('17-07-2026');
    });

    it('should filter by doctor, status and patient', async () => {
      const otherDoctor = await createDoctor(tenantA, 'Dr Iyer');
      const secondPatient = await createPatient(tenantA, 'Bilal');
      const first = await visitRepository.checkInVisit(checkInData(tenantA, fixturesA));
      if (!first.success) throw new Error('check-in failed');
      await visitRepository.startConsultation(first.data.id, tenantA);
      await visitRepository.checkInVisit(
        checkInData(tenantA, fixturesA, { patientId: secondPatient, doctorId: otherDoctor })
      );

      await expect(
        visitRepository.getVisits({ tenantId: tenantA, doctorId: otherDoctor })
      ).resolves.toMatchObject({ total: 1 });
      await expect(
        visitRepository.getVisits({ tenantId: tenantA, status: 'IN_CONSULTATION' })
      ).resolves.toMatchObject({ total: 1 });
      await expect(
        visitRepository.getVisits({ tenantId: tenantA, patientId: secondPatient })
      ).resolves.toMatchObject({ total: 1 });
    });

    it('should search by visit number, mrn and patient name', async () => {
      await visitRepository.checkInVisit(checkInData(tenantA, fixturesA));

      await expect(
        visitRepository.getVisits({ tenantId: tenantA, query: 'VST-1001' })
      ).resolves.toMatchObject({ total: 1 });
      await expect(
        visitRepository.getVisits({ tenantId: tenantA, query: 'MRN-1001' })
      ).resolves.toMatchObject({ total: 1 });
      await expect(
        visitRepository.getVisits({ tenantId: tenantA, query: 'asha' })
      ).resolves.toMatchObject({ total: 1 });
      await expect(
        visitRepository.getVisits({ tenantId: tenantA, query: 'nobody' })
      ).resolves.toMatchObject({ total: 0 });
    });

    it('should exclude soft-deleted visits from the list', async () => {
      const created = await visitRepository.checkInVisit(checkInData(tenantA, fixturesA));
      if (!created.success) throw new Error('check-in failed');
      await visitRepository.deleteVisit(created.data.id, tenantA);

      await expect(visitRepository.getVisits({ tenantId: tenantA })).resolves.toMatchObject({
        total: 0,
      });
    });

    it('should paginate results', async () => {
      const secondPatient = await createPatient(tenantA, 'Bilal');
      await visitRepository.checkInVisit(checkInData(tenantA, fixturesA));
      await visitRepository.checkInVisit(
        checkInData(tenantA, fixturesA, { patientId: secondPatient })
      );

      const page = await visitRepository.getVisits({
        tenantId: tenantA,
        visitDate: TODAY,
        page: 2,
        limit: 1,
      });

      expect(page.total).toBe(2);
      expect(page.data.map((visit) => visit.queueToken)).toEqual([2]);
    });
  });
});
