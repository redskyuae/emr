import { describe, expect, it } from 'vitest';

import type { CreatePatientData } from '../schemas/patient-schema';
import { patientRepository } from './patient-repository';

const tenantA = 'tenant-a-test';
const tenantB = 'tenant-b-test';

function patientData(
  tenantId: string,
  overrides: Partial<CreatePatientData> = {}
): CreatePatientData {
  return {
    tenantId,
    firstName: 'Asha',
    lastName: 'Rao',
    gender: 'female',
    dateOfBirth: '1990-05-14',
    phone: '9876543210',
    ...overrides,
  };
}

describe('Patient repository', () => {
  it('should allocate MRNs starting at 1001 per tenant', async () => {
    const first = await patientRepository.createPatient(patientData(tenantA));
    const second = await patientRepository.createPatient(patientData(tenantA));

    expect(first.mrn).toBe('MRN-1001');
    expect(second.mrn).toBe('MRN-1002');
  });

  it('should allocate MRNs independently per tenant', async () => {
    const patientInTenantA = await patientRepository.createPatient(patientData(tenantA));
    const patientInTenantB = await patientRepository.createPatient(patientData(tenantB));

    expect(patientInTenantA.mrn).toBe('MRN-1001');
    expect(patientInTenantB.mrn).toBe('MRN-1001');
  });

  it('should never reuse an MRN after the patient is soft-deleted', async () => {
    const created = await patientRepository.createPatient(patientData(tenantA));
    await patientRepository.deletePatient(created.id, tenantA);

    const next = await patientRepository.createPatient(patientData(tenantA));

    expect(next.mrn).toBe('MRN-1002');
  });

  it('should not get a patient created by another tenant', async () => {
    const created = await patientRepository.createPatient(patientData(tenantA));

    await expect(patientRepository.getPatientById(created.id, tenantB)).resolves.toBeUndefined();
  });

  it('should exclude soft-deleted patients from reads', async () => {
    const created = await patientRepository.createPatient(patientData(tenantA));
    await patientRepository.deletePatient(created.id, tenantA);

    await expect(patientRepository.getPatientById(created.id, tenantA)).resolves.toBeUndefined();
  });

  it('should update a patient and return the refreshed row', async () => {
    const created = await patientRepository.createPatient(patientData(tenantA));

    const updated = await patientRepository.updatePatient(created.id, {
      ...patientData(tenantA),
      firstName: 'Asha Updated',
    });

    expect(updated?.firstName).toBe('Asha Updated');
    expect(updated?.mrn).toBe(created.mrn);
  });

  it('should not update a patient belonging to another tenant', async () => {
    const created = await patientRepository.createPatient(patientData(tenantA));

    await expect(
      patientRepository.updatePatient(created.id, patientData(tenantB))
    ).resolves.toBeUndefined();
  });

  it('should deactivate and reactivate a patient', async () => {
    const created = await patientRepository.createPatient(patientData(tenantA));

    const deactivated = await patientRepository.setPatientActive(created.id, tenantA, false);
    expect(deactivated?.isActive).toBe(false);

    const reactivated = await patientRepository.setPatientActive(created.id, tenantA, true);
    expect(reactivated?.isActive).toBe(true);
  });

  it('should enforce case-insensitive uniqueness on active government IDs per tenant', async () => {
    await patientRepository.createPatient(
      patientData(tenantA, { govtIdType: 'passport', govtIdNumber: 'X1234567' })
    );

    await expect(
      patientRepository.createPatient(
        patientData(tenantA, { govtIdType: 'passport', govtIdNumber: 'x1234567' })
      )
    ).rejects.toMatchObject({ cause: expect.objectContaining({ code: '23505' }) });
  });

  it('should allow the same government ID again once the original patient is soft-deleted', async () => {
    const created = await patientRepository.createPatient(
      patientData(tenantA, { govtIdType: 'passport', govtIdNumber: 'X7654321' })
    );
    await patientRepository.deletePatient(created.id, tenantA);

    await expect(
      patientRepository.createPatient(
        patientData(tenantA, { govtIdType: 'passport', govtIdNumber: 'X7654321' })
      )
    ).resolves.toBeDefined();
  });

  it('should allow the same government ID across different tenants', async () => {
    await patientRepository.createPatient(
      patientData(tenantA, { govtIdType: 'passport', govtIdNumber: 'X9999999' })
    );

    await expect(
      patientRepository.createPatient(
        patientData(tenantB, { govtIdType: 'passport', govtIdNumber: 'X9999999' })
      )
    ).resolves.toBeDefined();
  });

  it('should find an active patient by government ID excluding a given patient', async () => {
    const created = await patientRepository.createPatient(
      patientData(tenantA, { govtIdType: 'passport', govtIdNumber: 'X1111111' })
    );

    await expect(
      patientRepository.findActiveByGovtId(tenantA, 'passport', 'X1111111')
    ).resolves.toMatchObject({ id: created.id });

    await expect(
      patientRepository.findActiveByGovtId(tenantA, 'passport', 'X1111111', {
        excludeId: created.id,
      })
    ).resolves.toBeUndefined();
  });

  it('should search across name, MRN and phone', async () => {
    await patientRepository.createPatient(
      patientData(tenantA, { firstName: 'Kiran', lastName: 'Mehta', phone: '9000000001' })
    );
    const other = await patientRepository.createPatient(
      patientData(tenantA, { firstName: 'Rohit', lastName: 'Shah', phone: '9000000002' })
    );

    const byName = await patientRepository.getPatients({ tenantId: tenantA, query: 'kiran' });
    expect(byName.data.map((patient) => patient.firstName)).toEqual(['Kiran']);

    const byMrn = await patientRepository.getPatients({ tenantId: tenantA, query: other.mrn });
    expect(byMrn.data.map((patient) => patient.id)).toEqual([other.id]);

    const byPhone = await patientRepository.getPatients({
      tenantId: tenantA,
      query: '9000000002',
    });
    expect(byPhone.data.map((patient) => patient.id)).toEqual([other.id]);
  });

  it('should filter by gender and active status and paginate results', async () => {
    await patientRepository.createPatient(patientData(tenantA, { gender: 'male' }));
    const active = await patientRepository.createPatient(
      patientData(tenantA, { gender: 'female' })
    );
    const inactive = await patientRepository.createPatient(
      patientData(tenantA, { gender: 'female' })
    );
    await patientRepository.setPatientActive(inactive.id, tenantA, false);

    const females = await patientRepository.getPatients({ tenantId: tenantA, gender: 'female' });
    expect(females.data.map((patient) => patient.id).sort()).toEqual(
      [active.id, inactive.id].sort()
    );

    const activeOnly = await patientRepository.getPatients({ tenantId: tenantA, isActive: true });
    expect(activeOnly.data.map((patient) => patient.id)).not.toContain(inactive.id);

    const paged = await patientRepository.getPatients({ tenantId: tenantA, page: 1, limit: 1 });
    expect(paged.data).toHaveLength(1);
    expect(paged.total).toBeGreaterThanOrEqual(3);
  });
});
