import { randomUUID } from 'node:crypto';

import { beforeEach, describe, expect, it } from 'vitest';

import { db } from '@/app/db';
import { organization, user } from '@/app/db/schema/auth';
import { doctor as doctorTable } from '@/app/db/schema/doctor';
import { patient as patientTable } from '@/app/db/schema/patient';
import { specialty as specialtyTable } from '@/app/db/schema/specialty';
import { admissionTypeRepository } from '../../admission-type/repository/admission-type-repository';
import { bedRepository } from '../../bed/repository/bed-repository';
import { wardRepository } from '../../ward/repository/ward-repository';
import type { ValidatedAdmitPatientData } from '../schemas/admission-schema';
import { admissionRepository } from './admission-repository';

const tenantA = 'tenant-a-test';
const tenantB = 'tenant-b-test';

type TenantFixtures = {
  wardId: number;
  bedId: number;
  bedNumber: string;
  doctorId: number;
  patientId: number;
  admissionTypeId: number;
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

let bedSequence = 0;

async function createBed(
  tenantId: string,
  wardId: number,
  status: 'AVAILABLE' | 'RESERVED' | 'MAINTENANCE' = 'AVAILABLE'
) {
  bedSequence += 1;
  const bedNumber = `BED-${String(100 + bedSequence)}`;
  const bed = await bedRepository.createBed({ tenantId, wardId, bedNumber, status });

  return { id: bed!.id, bedNumber };
}

async function createTenantFixtures(tenantId: string): Promise<TenantFixtures> {
  await createTenant(tenantId);

  const ward = await wardRepository.createWard({
    tenantId,
    name: 'ICU',
    code: 'ICU',
    description: undefined,
  });
  const bed = await createBed(tenantId, ward.id);
  const admissionType = await admissionTypeRepository.createAdmissionType({
    tenantId,
    name: 'Emergency',
    code: 'EMER',
    description: undefined,
  });

  return {
    wardId: ward.id,
    bedId: bed.id,
    bedNumber: bed.bedNumber,
    doctorId: await createDoctor(tenantId),
    patientId: await createPatient(tenantId),
    admissionTypeId: admissionType.id,
  };
}

function admitData(
  tenantId: string,
  fixtures: TenantFixtures,
  overrides: Partial<ValidatedAdmitPatientData> = {}
): ValidatedAdmitPatientData {
  return {
    tenantId,
    patientId: fixtures.patientId,
    doctorId: fixtures.doctorId,
    admissionTypeId: fixtures.admissionTypeId,
    bedId: fixtures.bedId,
    bedNumber: fixtures.bedNumber,
    ...overrides,
  };
}

describe('Admission repository', () => {
  let fixturesA: TenantFixtures;
  let fixturesB: TenantFixtures;

  beforeEach(async () => {
    mrnSequence = 0;
    bedSequence = 0;
    fixturesA = await createTenantFixtures(tenantA);
    fixturesB = await createTenantFixtures(tenantB);
  });

  it('should admit a patient with a generated Admission Number and occupy the bed', async () => {
    const result = await admissionRepository.admitPatient(
      admitData(tenantA, fixturesA, {
        admissionReason: 'Chest pain',
        expectedDischargeDate: '2026-07-20',
      })
    );

    expect(result.success).toBe(true);

    if (!result.success) {
      return;
    }

    expect(result.data).toMatchObject({
      admissionNumber: 'ADM-1001',
      status: 'ADMITTED',
      admissionReason: 'Chest pain',
      expectedDischargeDate: '20-07-2026',
      patient: { id: fixturesA.patientId },
      doctor: { id: fixturesA.doctorId },
      admissionType: { code: 'EMER' },
      bed: { id: fixturesA.bedId, bedNumber: fixturesA.bedNumber },
      ward: { id: fixturesA.wardId, name: 'ICU' },
      visit: null,
    });

    await expect(bedRepository.getBedById(fixturesA.bedId, tenantA)).resolves.toMatchObject({
      status: 'OCCUPIED',
    });
  });

  it('should draw tenant-scoped sequential admission numbers', async () => {
    const first = await admissionRepository.admitPatient(admitData(tenantA, fixturesA));
    const patient2 = await createPatient(tenantA, 'Vikram');
    const bed2 = await createBed(tenantA, fixturesA.wardId);
    const second = await admissionRepository.admitPatient(
      admitData(tenantA, fixturesA, {
        patientId: patient2,
        bedId: bed2.id,
        bedNumber: bed2.bedNumber,
      })
    );
    const other = await admissionRepository.admitPatient(admitData(tenantB, fixturesB));

    expect(first.success && first.data.admissionNumber).toBe('ADM-1001');
    expect(second.success && second.data.admissionNumber).toBe('ADM-1002');
    expect(other.success && other.data.admissionNumber).toBe('ADM-1001');
  });

  it('should admit into a RESERVED bed but not an unavailable one', async () => {
    const reserved = await createBed(tenantA, fixturesA.wardId, 'RESERVED');
    const maintenance = await createBed(tenantA, fixturesA.wardId, 'MAINTENANCE');

    const intoReserved = await admissionRepository.admitPatient(
      admitData(tenantA, fixturesA, { bedId: reserved.id, bedNumber: reserved.bedNumber })
    );

    expect(intoReserved.success).toBe(true);

    const patient2 = await createPatient(tenantA, 'Vikram');
    const intoMaintenance = await admissionRepository.admitPatient(
      admitData(tenantA, fixturesA, {
        patientId: patient2,
        bedId: maintenance.id,
        bedNumber: maintenance.bedNumber,
      })
    );

    expect(intoMaintenance).toEqual({ success: false, outcome: 'bed-not-available' });
  });

  it('should refuse a second active admission on the same bed via the guarded update', async () => {
    await admissionRepository.admitPatient(admitData(tenantA, fixturesA));
    const patient2 = await createPatient(tenantA, 'Vikram');

    const result = await admissionRepository.admitPatient(
      admitData(tenantA, fixturesA, { patientId: patient2 })
    );

    expect(result).toEqual({ success: false, outcome: 'bed-not-available' });
  });

  it('should enforce one active admission per patient at the database level', async () => {
    await admissionRepository.admitPatient(admitData(tenantA, fixturesA));
    const bed2 = await createBed(tenantA, fixturesA.wardId);

    await expect(
      admissionRepository.admitPatient(
        admitData(tenantA, fixturesA, { bedId: bed2.id, bedNumber: bed2.bedNumber })
      )
    ).rejects.toThrow();
  });

  it('should read an admission by id within the same tenant only', async () => {
    const created = await admissionRepository.admitPatient(admitData(tenantA, fixturesA));
    const id = created.success ? created.data.id : 0;

    await expect(admissionRepository.getAdmissionById(id, tenantA)).resolves.toMatchObject({ id });
    await expect(admissionRepository.getAdmissionById(id, tenantB)).resolves.toBeUndefined();
  });

  it('should transfer to a free bed, release the old one, and record history', async () => {
    const created = await admissionRepository.admitPatient(admitData(tenantA, fixturesA));
    const id = created.success ? created.data.id : 0;
    const bed2 = await createBed(tenantA, fixturesA.wardId);

    const result = await admissionRepository.transferBed(id, tenantA, bed2.id, 'Closer to nurses');

    expect(result).toMatchObject({
      outcome: 'transferred',
      data: { bed: { id: bed2.id, bedNumber: bed2.bedNumber } },
    });
    await expect(bedRepository.getBedById(fixturesA.bedId, tenantA)).resolves.toMatchObject({
      status: 'AVAILABLE',
    });
    await expect(bedRepository.getBedById(bed2.id, tenantA)).resolves.toMatchObject({
      status: 'OCCUPIED',
    });
    await expect(
      admissionRepository.getBedTransfersByAdmissionId(tenantA, id)
    ).resolves.toMatchObject([
      {
        reason: 'Closer to nurses',
        fromBed: { id: fixturesA.bedId },
        toBed: { id: bed2.id },
      },
    ]);
  });

  it('should refuse transfers to the same bed, an occupied bed, and on closed admissions', async () => {
    const created = await admissionRepository.admitPatient(admitData(tenantA, fixturesA));
    const id = created.success ? created.data.id : 0;

    await expect(
      admissionRepository.transferBed(id, tenantA, fixturesA.bedId, undefined)
    ).resolves.toMatchObject({ outcome: 'same-bed' });

    const patient2 = await createPatient(tenantA, 'Vikram');
    const bed2 = await createBed(tenantA, fixturesA.wardId);
    await admissionRepository.admitPatient(
      admitData(tenantA, fixturesA, {
        patientId: patient2,
        bedId: bed2.id,
        bedNumber: bed2.bedNumber,
      })
    );

    await expect(admissionRepository.transferBed(id, tenantA, bed2.id, undefined)).resolves.toEqual(
      {
        outcome: 'bed-not-available',
      }
    );

    await admissionRepository.dischargeAdmission(id, tenantA, 'ROUTINE', undefined);
    const bed3 = await createBed(tenantA, fixturesA.wardId);

    await expect(
      admissionRepository.transferBed(id, tenantA, bed3.id, undefined)
    ).resolves.toMatchObject({ outcome: 'invalid-status' });
  });

  it('should discharge an active admission, free the bed, and refuse a second discharge', async () => {
    const created = await admissionRepository.admitPatient(admitData(tenantA, fixturesA));
    const id = created.success ? created.data.id : 0;

    const result = await admissionRepository.dischargeAdmission(
      id,
      tenantA,
      'ROUTINE',
      'Recovered well.'
    );

    expect(result).toMatchObject({
      outcome: 'updated',
      data: {
        status: 'DISCHARGED',
        dischargeDisposition: 'ROUTINE',
        dischargeSummary: 'Recovered well.',
        dischargedAt: expect.any(Date),
      },
    });
    await expect(bedRepository.getBedById(fixturesA.bedId, tenantA)).resolves.toMatchObject({
      status: 'AVAILABLE',
    });

    await expect(
      admissionRepository.dischargeAdmission(id, tenantA, 'ROUTINE', undefined)
    ).resolves.toMatchObject({ outcome: 'invalid-status' });
  });

  it('should let a discharged patient be admitted again', async () => {
    const created = await admissionRepository.admitPatient(admitData(tenantA, fixturesA));
    const id = created.success ? created.data.id : 0;
    await admissionRepository.dischargeAdmission(id, tenantA, 'ROUTINE', undefined);

    const again = await admissionRepository.admitPatient(admitData(tenantA, fixturesA));

    expect(again.success && again.data.admissionNumber).toBe('ADM-1002');
  });

  it('should cancel an active admission with the reason and free the bed', async () => {
    const created = await admissionRepository.admitPatient(admitData(tenantA, fixturesA));
    const id = created.success ? created.data.id : 0;

    const result = await admissionRepository.cancelAdmission(id, tenantA, 'Admitted in error');

    expect(result).toMatchObject({
      outcome: 'updated',
      data: {
        status: 'CANCELLED',
        cancellationReason: 'Admitted in error',
        cancelledAt: expect.any(Date),
      },
    });
    await expect(bedRepository.getBedById(fixturesA.bedId, tenantA)).resolves.toMatchObject({
      status: 'AVAILABLE',
    });
  });

  it('should update reason, remarks, and expected discharge date in the requested tenant only', async () => {
    const created = await admissionRepository.admitPatient(admitData(tenantA, fixturesA));
    const id = created.success ? created.data.id : 0;

    await expect(
      admissionRepository.updateAdmission(id, tenantA, {
        admissionReason: 'Observation',
        remarks: 'Stable overnight',
        expectedDischargeDate: '2026-07-21',
      })
    ).resolves.toMatchObject({
      admissionReason: 'Observation',
      remarks: 'Stable overnight',
      expectedDischargeDate: '21-07-2026',
    });

    await expect(
      admissionRepository.updateAdmission(id, tenantB, { admissionReason: 'X' })
    ).resolves.toBeUndefined();
  });

  it('should not update a closed admission even within the same tenant', async () => {
    const created = await admissionRepository.admitPatient(admitData(tenantA, fixturesA));
    const id = created.success ? created.data.id : 0;

    await admissionRepository.dischargeAdmission(id, tenantA, 'ROUTINE', undefined);

    await expect(
      admissionRepository.updateAdmission(id, tenantA, { admissionReason: 'Edited after close' })
    ).resolves.toBeUndefined();

    await expect(admissionRepository.getAdmissionById(id, tenantA)).resolves.toMatchObject({
      status: 'DISCHARGED',
      admissionReason: null,
    });
  });

  it('should soft delete an active admission and free its bed', async () => {
    const created = await admissionRepository.admitPatient(admitData(tenantA, fixturesA));
    const id = created.success ? created.data.id : 0;

    const result = await admissionRepository.deleteAdmission(id, tenantA);

    expect(result).toMatchObject({ outcome: 'deleted' });
    await expect(admissionRepository.getAdmissionById(id, tenantA)).resolves.toBeUndefined();
    await expect(bedRepository.getBedById(fixturesA.bedId, tenantA)).resolves.toMatchObject({
      status: 'AVAILABLE',
    });
    await expect(admissionRepository.deleteAdmission(id, tenantA)).resolves.toEqual({
      outcome: 'not-found',
    });
  });

  it('should list admissions with status, ward, doctor, patient, and search filters', async () => {
    const created = await admissionRepository.admitPatient(admitData(tenantA, fixturesA));
    const firstId = created.success ? created.data.id : 0;
    const patient2 = await createPatient(tenantA, 'Vikram');
    const bed2 = await createBed(tenantA, fixturesA.wardId);
    await admissionRepository.admitPatient(
      admitData(tenantA, fixturesA, {
        patientId: patient2,
        bedId: bed2.id,
        bedNumber: bed2.bedNumber,
      })
    );
    await admissionRepository.dischargeAdmission(firstId, tenantA, 'ROUTINE', undefined);

    const admitted = await admissionRepository.getAdmissions({
      tenantId: tenantA,
      status: 'ADMITTED',
    });
    expect(admitted.total).toBe(1);
    expect(admitted.data[0]?.patient.id).toBe(patient2);

    const discharged = await admissionRepository.getAdmissions({
      tenantId: tenantA,
      status: 'DISCHARGED',
    });
    expect(discharged.total).toBe(1);

    const byPatient = await admissionRepository.getAdmissions({
      tenantId: tenantA,
      patientId: fixturesA.patientId,
    });
    expect(byPatient.total).toBe(1);
    expect(byPatient.data[0]?.id).toBe(firstId);

    const byWard = await admissionRepository.getAdmissions({
      tenantId: tenantA,
      wardId: fixturesA.wardId,
    });
    expect(byWard.total).toBe(2);

    const byDoctor = await admissionRepository.getAdmissions({
      tenantId: tenantA,
      doctorId: fixturesA.doctorId,
    });
    expect(byDoctor.total).toBe(2);

    const bySearch = await admissionRepository.getAdmissions({
      tenantId: tenantA,
      query: 'ADM-1001',
    });
    expect(bySearch.total).toBe(1);

    const crossTenant = await admissionRepository.getAdmissions({ tenantId: tenantB });
    expect(crossTenant.total).toBe(0);
  });

  it('should find the active admission for a patient and none once closed', async () => {
    const created = await admissionRepository.admitPatient(admitData(tenantA, fixturesA));
    const id = created.success ? created.data.id : 0;

    await expect(
      admissionRepository.findActiveAdmissionByPatientId(tenantA, fixturesA.patientId)
    ).resolves.toMatchObject({ id });

    await admissionRepository.cancelAdmission(id, tenantA, 'Wrong patient');

    await expect(
      admissionRepository.findActiveAdmissionByPatientId(tenantA, fixturesA.patientId)
    ).resolves.toBeUndefined();
  });

  it('should expose the clinical capture context tenant-scoped', async () => {
    const created = await admissionRepository.admitPatient(admitData(tenantA, fixturesA));
    const id = created.success ? created.data.id : 0;

    await expect(admissionRepository.getAdmissionForClinicalCapture(tenantA, id)).resolves.toEqual({
      id,
      patientId: fixturesA.patientId,
      status: 'ADMITTED',
    });
    await expect(
      admissionRepository.getAdmissionForClinicalCapture(tenantB, id)
    ).resolves.toBeUndefined();
  });

  it('should surface the occupant on the bed board', async () => {
    const created = await admissionRepository.admitPatient(admitData(tenantA, fixturesA));
    const admissionNumber = created.success ? created.data.admissionNumber : '';

    const rows = await bedRepository.getBedBoard(tenantA);
    const occupiedRow = rows.find((row) => row.bedId === fixturesA.bedId);

    expect(occupiedRow).toMatchObject({
      status: 'OCCUPIED',
      admissionNumber,
      patientId: fixturesA.patientId,
      firstName: 'Asha',
    });
  });
});
