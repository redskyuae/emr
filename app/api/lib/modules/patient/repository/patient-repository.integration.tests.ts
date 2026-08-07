import { and, eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { db } from '@/app/db';
import { country as countryTable } from '@/app/db/schema/country';
import { patient as patientTable } from '@/app/db/schema/patient';
import type { CreatePatientData } from '../schemas/patient-schema';
import { patientRepository } from './patient-repository';

const tenantA = 'tenant-a-test';
const tenantB = 'tenant-b-test';

// Integration setup truncates every table before each test, so a passport's
// issuing country has to be seeded by the test that needs it.
async function createCountry() {
  const [created] = await db
    .insert(countryTable)
    .values({ name: 'India', code: 'IN' })
    .returning({ id: countryTable.id });

  return created.id;
}

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

  it('should persist and read back the preferred payment method', async () => {
    const created = await patientRepository.createPatient(
      patientData(tenantA, { preferredPaymentMethod: 'insurance' })
    );

    expect(created.preferredPaymentMethod).toBe('insurance');

    const fetched = await patientRepository.getPatientById(created.id, tenantA);
    expect(fetched?.preferredPaymentMethod).toBe('insurance');
  });

  it('should default the preferred payment method to null when omitted', async () => {
    const created = await patientRepository.createPatient(patientData(tenantA));

    expect(created.preferredPaymentMethod).toBeNull();
  });

  it('should persist no-card identification and registration flags', async () => {
    const created = await patientRepository.createPatient(
      patientData(tenantA, {
        uid: '123456789',
        isVip: true,
        smsConsent: true,
        isMedicalTourist: true,
        patientIdentificationCategory: 'unknown-status-without-card',
      })
    );

    expect(created).toMatchObject({
      uid: '123456789',
      isVip: true,
      emiratesId: null,
      smsConsent: true,
      isMedicalTourist: true,
      patientIdentificationCategory: 'unknown-status-without-card',
    });

    const fetched = await patientRepository.getPatientById(created.id, tenantA);
    expect(fetched).toMatchObject({
      uid: '123456789',
      isVip: true,
      smsConsent: true,
      isMedicalTourist: true,
      patientIdentificationCategory: 'unknown-status-without-card',
    });
  });

  it('should clear Patient Identification Category when Emirates ID is present', async () => {
    const created = await patientRepository.createPatient(
      patientData(tenantA, {
        emiratesId: '784199012345671',
        patientIdentificationCategory: 'unknown-status-without-card',
      })
    );

    expect(created.patientIdentificationCategory).toBeNull();
  });

  it('should persist an Emirates ID read photo and clear it when Emirates ID is absent', async () => {
    const photoUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ==';
    const created = await patientRepository.createPatient(
      patientData(tenantA, { emiratesId: '784199012345671', photoUrl })
    );

    expect(created.photoUrl).toBe(photoUrl);

    const updated = await patientRepository.updatePatient(
      created.id,
      patientData(tenantA, {
        photoUrl,
        emiratesId: undefined,
        patientIdentificationCategory: 'unknown-status-without-card',
      })
    );

    expect(updated?.photoUrl).toBeNull();
  });

  it('should clear the preferred payment method on update when omitted', async () => {
    const created = await patientRepository.createPatient(
      patientData(tenantA, { preferredPaymentMethod: 'corporate' })
    );

    const updated = await patientRepository.updatePatient(created.id, patientData(tenantA));

    expect(updated?.preferredPaymentMethod).toBeNull();
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

  it('should stamp deactivatedAt and reactivatedAt as the lifecycle transitions happen', async () => {
    const created = await patientRepository.createPatient(patientData(tenantA));

    async function lifecycleTimestamps() {
      const [row] = await db
        .select({
          deactivatedAt: patientTable.deactivatedAt,
          reactivatedAt: patientTable.reactivatedAt,
        })
        .from(patientTable)
        .where(and(eq(patientTable.id, created.id), eq(patientTable.tenantId, tenantA)));

      return row;
    }

    expect(await lifecycleTimestamps()).toEqual({ deactivatedAt: null, reactivatedAt: null });

    await patientRepository.setPatientActive(created.id, tenantA, false);
    const afterDeactivate = await lifecycleTimestamps();
    expect(afterDeactivate.deactivatedAt).toBeInstanceOf(Date);
    expect(afterDeactivate.reactivatedAt).toBeNull();

    await patientRepository.setPatientActive(created.id, tenantA, true);
    const afterReactivate = await lifecycleTimestamps();
    expect(afterReactivate.reactivatedAt).toBeInstanceOf(Date);
    // Deactivation is not erased by a later reactivation — both transitions
    // remain on the Patient Timeline.
    expect(afterReactivate.deactivatedAt).toEqual(afterDeactivate.deactivatedAt);
  });

  it('should not restamp a lifecycle instant when the patient is already in the requested state', async () => {
    const created = await patientRepository.createPatient(patientData(tenantA));

    async function lifecycleTimestamps() {
      const [row] = await db
        .select({
          deactivatedAt: patientTable.deactivatedAt,
          reactivatedAt: patientTable.reactivatedAt,
        })
        .from(patientTable)
        .where(and(eq(patientTable.id, created.id), eq(patientTable.tenantId, tenantA)));

      return row;
    }

    await patientRepository.setPatientActive(created.id, tenantA, false);
    const afterFirstDeactivate = await lifecycleTimestamps();

    // Deactivating an already-inactive Patient is a no-op transition: re-stamping
    // would drag the existing Timeline Event forward to a moment nothing happened.
    await patientRepository.setPatientActive(created.id, tenantA, false);

    expect((await lifecycleTimestamps()).deactivatedAt).toEqual(afterFirstDeactivate.deactivatedAt);

    await patientRepository.setPatientActive(created.id, tenantA, true);
    const afterFirstReactivate = await lifecycleTimestamps();

    await patientRepository.setPatientActive(created.id, tenantA, true);

    expect((await lifecycleTimestamps()).reactivatedAt).toEqual(afterFirstReactivate.reactivatedAt);
  });

  it('should enforce uniqueness on active Emirates IDs per tenant', async () => {
    await patientRepository.createPatient(patientData(tenantA, { emiratesId: '784199012345671' }));

    await expect(
      patientRepository.createPatient(patientData(tenantA, { emiratesId: '784199012345671' }))
    ).rejects.toMatchObject({ cause: expect.objectContaining({ code: '23505' }) });
  });

  it('should allow the same Emirates ID again once the original patient is soft-deleted', async () => {
    const created = await patientRepository.createPatient(
      patientData(tenantA, { emiratesId: '784198800112233' })
    );
    await patientRepository.deletePatient(created.id, tenantA);

    await expect(
      patientRepository.createPatient(patientData(tenantA, { emiratesId: '784198800112233' }))
    ).resolves.toBeDefined();
  });

  it('should allow the same Emirates ID across different tenants', async () => {
    await patientRepository.createPatient(patientData(tenantA, { emiratesId: '784197755443322' }));

    await expect(
      patientRepository.createPatient(patientData(tenantB, { emiratesId: '784197755443322' }))
    ).resolves.toBeDefined();
  });

  it('should allow many patients with no Emirates ID', async () => {
    await patientRepository.createPatient(patientData(tenantA, { emiratesId: undefined }));

    await expect(
      patientRepository.createPatient(patientData(tenantA, { emiratesId: undefined }))
    ).resolves.toBeDefined();
  });

  it('should find an active patient by Emirates ID excluding a given patient', async () => {
    const created = await patientRepository.createPatient(
      patientData(tenantA, { emiratesId: '784199911112222' })
    );

    await expect(
      patientRepository.findActiveByEmiratesId(tenantA, '784199911112222')
    ).resolves.toMatchObject({ id: created.id });

    await expect(
      patientRepository.findActiveByEmiratesId(tenantA, '784199911112222', {
        excludeId: created.id,
      })
    ).resolves.toBeUndefined();
  });

  it('should store identity documents and allow several of the same type', async () => {
    const countryId = await createCountry();

    const created = await patientRepository.createPatient(
      patientData(tenantA, {
        identityDocuments: [
          {
            documentType: 'passport',
            documentNumber: 'J8369854',
            issuingCountryId: countryId,
            expiryDate: '2029-04-11',
          },
          {
            documentType: 'passport',
            documentNumber: '533291847',
            issuingCountryId: countryId,
            expiryDate: '2031-08-02',
          },
        ],
      })
    );

    expect(created.identityDocuments).toHaveLength(2);
    expect(created.identityDocuments.map((document) => document.documentNumber)).toEqual([
      'J8369854',
      '533291847',
    ]);
  });

  it('should not leak identity documents across tenants', async () => {
    const created = await patientRepository.createPatient(
      patientData(tenantA, {
        identityDocuments: [
          { documentType: 'residence-visa', documentNumber: 'RV-1', expiryDate: '2027-01-15' },
        ],
      })
    );

    await expect(patientRepository.getPatientById(created.id, tenantB)).resolves.toBeUndefined();
  });

  it('should update matched documents, insert new ones and soft-delete omitted ones', async () => {
    const countryId = await createCountry();

    const created = await patientRepository.createPatient(
      patientData(tenantA, {
        identityDocuments: [
          {
            documentType: 'passport',
            documentNumber: 'OLD-1',
            issuingCountryId: countryId,
            expiryDate: '2028-01-01',
          },
          { documentType: 'residence-visa', documentNumber: 'RV-9', expiryDate: '2027-01-15' },
        ],
      })
    );

    const [passport, visa] = created.identityDocuments;

    const updated = await patientRepository.updatePatient(
      created.id,
      patientData(tenantA, {
        identityDocuments: [
          // kept and edited
          {
            id: passport.id,
            documentType: 'passport',
            documentNumber: 'NEW-1',
            issuingCountryId: countryId,
            expiryDate: '2030-01-01',
          },
          // added
          { documentType: 'driving-license', documentNumber: 'DL-5' },
        ],
      })
    );

    const numbers = updated?.identityDocuments.map((document) => document.documentNumber) ?? [];

    expect(numbers).toContain('NEW-1');
    expect(numbers).toContain('DL-5');
    // the visa was omitted from the payload, so it is soft-deleted
    expect(numbers).not.toContain('RV-9');
    // the kept document retained its row rather than being tombstoned and reinserted
    expect(updated?.identityDocuments.some((document) => document.id === passport.id)).toBe(true);
    expect(visa.id).toBeDefined();
  });

  it('should match a dashed Emirates ID query against the digit-normalised value', async () => {
    const created = await patientRepository.createPatient(
      patientData(tenantA, { emiratesId: '784199012349999' })
    );

    const { data } = await patientRepository.getPatients({
      tenantId: tenantA,
      query: '784-1990-1234-9999',
    });

    expect(data.map((patient) => patient.id)).toContain(created.id);
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
