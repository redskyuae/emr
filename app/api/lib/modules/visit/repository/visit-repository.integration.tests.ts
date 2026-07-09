import { describe, expect, it } from 'vitest';

import { db } from '@/app/db';
import { organization, user } from '@/app/db/schema/auth';
import { role as roleTable } from '@/app/db/schema/role';
import { specialty as specialtyTable } from '@/app/db/schema/specialty';
import { appointmentTypeRepository } from '../../appointment-type/repository/appointment-type-repository';
import { doctorRepository } from '../../doctor/repository/doctor-repository';
import { patientRepository } from '../../patient/repository/patient-repository';
import { visitStatusRepository } from '../../visit-status/repository/visit-status-repository';
import { visitRepository } from './visit-repository';

let sequence = 0;

async function createTenant(tenantId: string) {
  await db.insert(organization).values({
    id: tenantId,
    name: `Hospital ${tenantId}`,
    slug: `hospital-${tenantId}`,
    createdAt: new Date(),
  });
}

async function createUser(id: string, name = 'Admin User') {
  sequence += 1;
  await db.insert(user).values({ id, name, email: `${id}-${sequence}@example.com` });
}

async function createDoctorFixture(tenantId: string, userId: string) {
  await createUser(userId, 'Anita Mehta');
  const [role] = await db
    .insert(roleTable)
    .values({
      name: 'Doctor',
      code: 'DOCTOR',
      tenantId,
      isSystem: true,
      description: 'Doctor role',
    })
    .returning({ id: roleTable.id });
  const [specialty] = await db
    .insert(specialtyTable)
    .values({ name: 'Cardiology', code: 'CARD', tenantId })
    .returning({ id: specialtyTable.id });

  return doctorRepository.createDoctor({
    name: 'Anita Mehta',
    email: `${userId}@example.com`,
    password: 'password123',
    userId,
    tenantId,
    roleId: role.id,
    assignedBy: userId,
    specialtyId: specialty.id,
  });
}

async function createPatient(tenantId: string) {
  return patientRepository.createPatient({
    tenantId,
    firstName: 'Asha',
    lastName: 'Rao',
    gender: 'female',
    dateOfBirth: '1990-05-14',
    phone: '9876543210',
  });
}

async function createAppointmentType(tenantId: string, code = 'NEW', name = 'New Consultation') {
  return appointmentTypeRepository.createAppointmentType({
    tenantId,
    name,
    code,
    description: undefined,
  });
}

async function createVisitStatus(
  tenantId: string,
  category: 'WAITING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED',
  code: string
) {
  return visitStatusRepository.createVisitStatus({
    tenantId,
    name: category,
    code,
    category,
    color: '#6B7280',
    description: undefined,
  });
}

const tenantA = 'tenant-a-test';
const tenantB = 'tenant-b-test';

describe('Visit repository', () => {
  it('should allocate visit numbers starting at 1001 per tenant and read back the joined projection', async () => {
    await createTenant(tenantA);
    const patient = await createPatient(tenantA);
    const otherPatient = await createPatient(tenantA);
    const appointmentType = await createAppointmentType(tenantA);
    const status = await createVisitStatus(tenantA, 'WAITING', 'WAIT');

    const first = await visitRepository.createVisit({
      tenantId: tenantA,
      patientId: patient.id,
      appointmentTypeId: appointmentType.id,
      statusId: status.id,
    });
    const second = await visitRepository.createVisit({
      tenantId: tenantA,
      patientId: otherPatient.id,
      appointmentTypeId: appointmentType.id,
      statusId: status.id,
    });

    expect(first.visitNumber).toBe('VST-1001');
    expect(second.visitNumber).toBe('VST-1002');
    expect(first).toMatchObject({
      tenantId: tenantA,
      patient: { id: patient.id, mrn: patient.mrn, name: 'Asha Rao' },
      appointmentType: { id: appointmentType.id, code: 'NEW' },
      status: { id: status.id, category: 'WAITING' },
      doctor: null,
    });
  });

  it('should reject creating a second open visit for a patient that already has one', async () => {
    await createTenant(tenantA);
    const patient = await createPatient(tenantA);
    const appointmentType = await createAppointmentType(tenantA);
    const status = await createVisitStatus(tenantA, 'WAITING', 'WAIT');

    await visitRepository.createVisit({
      tenantId: tenantA,
      patientId: patient.id,
      appointmentTypeId: appointmentType.id,
      statusId: status.id,
    });

    await expect(
      visitRepository.createVisit({
        tenantId: tenantA,
        patientId: patient.id,
        appointmentTypeId: appointmentType.id,
        statusId: status.id,
      })
    ).rejects.toThrow('already has an Open Visit');
  });

  it('should allocate visit numbers independently per tenant', async () => {
    await createTenant(tenantA);
    await createTenant(tenantB);
    const patientA = await createPatient(tenantA);
    const patientB = await createPatient(tenantB);
    const typeA = await createAppointmentType(tenantA);
    const typeB = await createAppointmentType(tenantB);
    const statusA = await createVisitStatus(tenantA, 'WAITING', 'WAIT');
    const statusB = await createVisitStatus(tenantB, 'WAITING', 'WAIT');

    const visitA = await visitRepository.createVisit({
      tenantId: tenantA,
      patientId: patientA.id,
      appointmentTypeId: typeA.id,
      statusId: statusA.id,
    });
    const visitB = await visitRepository.createVisit({
      tenantId: tenantB,
      patientId: patientB.id,
      appointmentTypeId: typeB.id,
      statusId: statusB.id,
    });

    expect(visitA.visitNumber).toBe('VST-1001');
    expect(visitB.visitNumber).toBe('VST-1001');
  });

  it('should join an assigned doctor onto the visit', async () => {
    await createTenant(tenantA);
    const patient = await createPatient(tenantA);
    const appointmentType = await createAppointmentType(tenantA);
    const status = await createVisitStatus(tenantA, 'WAITING', 'WAIT');
    const doctor = await createDoctorFixture(tenantA, 'doctor-1');

    const created = await visitRepository.createVisit({
      tenantId: tenantA,
      patientId: patient.id,
      doctorId: doctor.id,
      appointmentTypeId: appointmentType.id,
      statusId: status.id,
    });

    expect(created.doctor).toMatchObject({ id: doctor.id, name: 'Anita Mehta' });
  });

  it('should not get a visit created by another tenant', async () => {
    await createTenant(tenantA);
    await createTenant(tenantB);
    const patient = await createPatient(tenantA);
    const appointmentType = await createAppointmentType(tenantA);
    const status = await createVisitStatus(tenantA, 'WAITING', 'WAIT');

    const created = await visitRepository.createVisit({
      tenantId: tenantA,
      patientId: patient.id,
      appointmentTypeId: appointmentType.id,
      statusId: status.id,
    });

    await expect(visitRepository.getVisitById(created.id, tenantB)).resolves.toBeUndefined();
  });

  it('should find the open visit for a patient and ignore completed ones', async () => {
    await createTenant(tenantA);
    const patient = await createPatient(tenantA);
    const appointmentType = await createAppointmentType(tenantA);
    const waiting = await createVisitStatus(tenantA, 'WAITING', 'WAIT');
    const completed = await createVisitStatus(tenantA, 'COMPLETED', 'DONE');

    const created = await visitRepository.createVisit({
      tenantId: tenantA,
      patientId: patient.id,
      appointmentTypeId: appointmentType.id,
      statusId: waiting.id,
    });

    await expect(
      visitRepository.findOpenVisitByPatientId(tenantA, patient.id)
    ).resolves.toMatchObject({ id: created.id });

    await visitRepository.updateVisitStatusTransition(created.id, tenantA, {
      statusId: completed.id,
      expectedStatusId: waiting.id,
      timestampField: 'completedOn',
    });

    await expect(
      visitRepository.findOpenVisitByPatientId(tenantA, patient.id)
    ).resolves.toBeUndefined();
  });

  it('should update visit editable fields and exclude soft-deleted visits from future reads', async () => {
    await createTenant(tenantA);
    const patient = await createPatient(tenantA);
    const appointmentType = await createAppointmentType(tenantA);
    const otherType = await createAppointmentType(tenantA, 'FLUP', 'Follow-up');
    const status = await createVisitStatus(tenantA, 'WAITING', 'WAIT');

    const created = await visitRepository.createVisit({
      tenantId: tenantA,
      patientId: patient.id,
      appointmentTypeId: appointmentType.id,
      statusId: status.id,
      chiefComplaint: 'Fever',
    });

    const updated = await visitRepository.updateVisit(created.id, {
      tenantId: tenantA,
      appointmentTypeId: otherType.id,
      chiefComplaint: 'Fever and cough',
    });

    expect(updated).toMatchObject({
      appointmentType: { id: otherType.id },
      chiefComplaint: 'Fever and cough',
    });

    const deleted = await visitRepository.deleteVisit(created.id, tenantA);
    expect(deleted).toMatchObject({ id: created.id });
    await expect(visitRepository.getVisitById(created.id, tenantA)).resolves.toBeUndefined();
  });

  it('should apply the correct lifecycle timestamp per transition', async () => {
    await createTenant(tenantA);
    const patient = await createPatient(tenantA);
    const appointmentType = await createAppointmentType(tenantA);
    const waiting = await createVisitStatus(tenantA, 'WAITING', 'WAIT');
    const inProgress = await createVisitStatus(tenantA, 'IN_PROGRESS', 'INPROG');
    const cancelled = await createVisitStatus(tenantA, 'CANCELLED', 'CANC');

    const created = await visitRepository.createVisit({
      tenantId: tenantA,
      patientId: patient.id,
      appointmentTypeId: appointmentType.id,
      statusId: waiting.id,
    });

    const started = await visitRepository.updateVisitStatusTransition(created.id, tenantA, {
      statusId: inProgress.id,
      expectedStatusId: waiting.id,
      timestampField: 'startedOn',
    });
    expect(started?.startedOn).not.toBeNull();
    expect(started?.completedOn).toBeNull();

    const cancelledVisit = await visitRepository.updateVisitStatusTransition(created.id, tenantA, {
      statusId: cancelled.id,
      expectedStatusId: inProgress.id,
      timestampField: 'cancelledOn',
      cancelledReason: 'Patient left',
    });
    expect(cancelledVisit?.cancelledOn).not.toBeNull();
    expect(cancelledVisit?.cancelledReason).toBe('Patient left');
    expect(cancelledVisit?.status.category).toBe('CANCELLED');
  });

  it('should reject a transition whose expected status no longer matches (concurrent transition)', async () => {
    await createTenant(tenantA);
    const patient = await createPatient(tenantA);
    const appointmentType = await createAppointmentType(tenantA);
    const waiting = await createVisitStatus(tenantA, 'WAITING', 'WAIT');
    const inProgress = await createVisitStatus(tenantA, 'IN_PROGRESS', 'INPROG');
    const completed = await createVisitStatus(tenantA, 'COMPLETED', 'DONE');
    const cancelled = await createVisitStatus(tenantA, 'CANCELLED', 'CANC');

    const created = await visitRepository.createVisit({
      tenantId: tenantA,
      patientId: patient.id,
      appointmentTypeId: appointmentType.id,
      statusId: waiting.id,
    });

    // Simulate a concurrent completion that already moved the visit past IN_PROGRESS.
    await visitRepository.updateVisitStatusTransition(created.id, tenantA, {
      statusId: inProgress.id,
      expectedStatusId: waiting.id,
      timestampField: 'startedOn',
    });
    await visitRepository.updateVisitStatusTransition(created.id, tenantA, {
      statusId: completed.id,
      expectedStatusId: inProgress.id,
      timestampField: 'completedOn',
    });

    // A cancel request that read the visit while it was still IN_PROGRESS now races in late.
    await expect(
      visitRepository.updateVisitStatusTransition(created.id, tenantA, {
        statusId: cancelled.id,
        expectedStatusId: inProgress.id,
        timestampField: 'cancelledOn',
        cancelledReason: 'Patient left',
      })
    ).rejects.toThrow('Visit status changed since it was loaded');

    const finalVisit = await visitRepository.getVisitById(created.id, tenantA);
    expect(finalVisit?.status.category).toBe('COMPLETED');
    expect(finalVisit?.cancelledOn).toBeNull();
  });

  it('should report status usage for isStatusInUse', async () => {
    await createTenant(tenantA);
    const patient = await createPatient(tenantA);
    const appointmentType = await createAppointmentType(tenantA);
    const waiting = await createVisitStatus(tenantA, 'WAITING', 'WAIT');
    const unused = await createVisitStatus(tenantA, 'COMPLETED', 'DONE');

    await visitRepository.createVisit({
      tenantId: tenantA,
      patientId: patient.id,
      appointmentTypeId: appointmentType.id,
      statusId: waiting.id,
    });

    await expect(visitRepository.isStatusInUse(waiting.id, tenantA)).resolves.toBe(true);
    await expect(visitRepository.isStatusInUse(unused.id, tenantA)).resolves.toBe(false);
  });

  it('should search by visit number, patient name, and MRN', async () => {
    await createTenant(tenantA);
    const patient = await createPatient(tenantA);
    const appointmentType = await createAppointmentType(tenantA);
    const status = await createVisitStatus(tenantA, 'WAITING', 'WAIT');

    const created = await visitRepository.createVisit({
      tenantId: tenantA,
      patientId: patient.id,
      appointmentTypeId: appointmentType.id,
      statusId: status.id,
    });

    await expect(
      visitRepository.getVisits({ tenantId: tenantA, query: created.visitNumber })
    ).resolves.toMatchObject({ total: 1 });
    await expect(
      visitRepository.getVisits({ tenantId: tenantA, query: 'Asha' })
    ).resolves.toMatchObject({ total: 1 });
    await expect(
      visitRepository.getVisits({ tenantId: tenantA, query: patient.mrn })
    ).resolves.toMatchObject({ total: 1 });
    await expect(
      visitRepository.getVisits({ tenantId: tenantA, query: 'no-match' })
    ).resolves.toMatchObject({ total: 0 });
  });

  it('should filter by status category and doctor', async () => {
    await createTenant(tenantA);
    const patient = await createPatient(tenantA);
    const otherPatient = await createPatient(tenantA);
    const appointmentType = await createAppointmentType(tenantA);
    const waiting = await createVisitStatus(tenantA, 'WAITING', 'WAIT');
    const inProgress = await createVisitStatus(tenantA, 'IN_PROGRESS', 'INPROG');
    const doctor = await createDoctorFixture(tenantA, 'doctor-2');

    await visitRepository.createVisit({
      tenantId: tenantA,
      patientId: patient.id,
      appointmentTypeId: appointmentType.id,
      statusId: waiting.id,
    });
    const withDoctor = await visitRepository.createVisit({
      tenantId: tenantA,
      patientId: otherPatient.id,
      doctorId: doctor.id,
      appointmentTypeId: appointmentType.id,
      statusId: inProgress.id,
    });

    await expect(
      visitRepository.getVisits({ tenantId: tenantA, statusCategory: 'IN_PROGRESS' })
    ).resolves.toMatchObject({ total: 1, data: [{ id: withDoctor.id }] });
    await expect(
      visitRepository.getVisits({ tenantId: tenantA, doctorId: doctor.id })
    ).resolves.toMatchObject({ total: 1, data: [{ id: withDoctor.id }] });
  });

  it('should paginate list results and return total', async () => {
    await createTenant(tenantA);
    const appointmentType = await createAppointmentType(tenantA);
    const status = await createVisitStatus(tenantA, 'WAITING', 'WAIT');

    for (let i = 0; i < 3; i += 1) {
      const patient = await createPatient(tenantA);
      await visitRepository.createVisit({
        tenantId: tenantA,
        patientId: patient.id,
        appointmentTypeId: appointmentType.id,
        statusId: status.id,
      });
    }

    const result = await visitRepository.getVisits({ tenantId: tenantA, page: 2, limit: 2 });
    expect(result.total).toBe(3);
    expect(result.data).toHaveLength(1);
  });

  it('should enforce a full unique index on visit number, including soft-deleted rows', async () => {
    await createTenant(tenantA);
    const patient = await createPatient(tenantA);
    const appointmentType = await createAppointmentType(tenantA);
    const status = await createVisitStatus(tenantA, 'WAITING', 'WAIT');

    const created = await visitRepository.createVisit({
      tenantId: tenantA,
      patientId: patient.id,
      appointmentTypeId: appointmentType.id,
      statusId: status.id,
    });
    await visitRepository.deleteVisit(created.id, tenantA);

    const { visit: visitTable } = await import('@/app/db/schema/visit');
    await expect(
      db.insert(visitTable).values({
        tenantId: tenantA,
        visitNumber: created.visitNumber,
        patientId: patient.id,
        appointmentTypeId: appointmentType.id,
        statusId: status.id,
      })
    ).rejects.toMatchObject({ cause: { code: '23505' } });
  });
});
