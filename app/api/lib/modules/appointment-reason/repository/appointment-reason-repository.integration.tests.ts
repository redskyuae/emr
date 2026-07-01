import { describe, expect, it } from 'vitest';

import { appointmentReasonRepository } from './appointment-reason-repository';

const tenantA = 'tenant-a-test';
const tenantB = 'tenant-b-test';

const createReason = (tenantId: string, name: string, code: string) =>
  appointmentReasonRepository.createAppointmentReason({
    tenantId,
    name,
    code,
    description: `${name} description`,
  });

describe('AppointmentReason repository', () => {
  it('should create appointment reason for a tenant', async () => {
    const created = await createReason(tenantA, 'Fever', 'FEV');
    expect(created).toMatchObject({
      id: expect.any(Number),
      tenantId: tenantA,
      name: 'Fever',
      code: 'FEV',
      description: 'Fever description',
    });
  });

  it('should get appointment reason by id for same tenant', async () => {
    const created = await createReason(tenantA, 'Cough', 'COU');
    await expect(
      appointmentReasonRepository.getAppointmentReasonById(created.id, tenantA)
    ).resolves.toMatchObject({ id: created.id, tenantId: tenantA });
  });

  it('should not get appointment reason by id for another tenant', async () => {
    const created = await createReason(tenantA, 'Cold', 'COL');
    await expect(
      appointmentReasonRepository.getAppointmentReasonById(created.id, tenantB)
    ).resolves.toBeUndefined();
  });

  it('should list only appointment reasons for the requested tenant', async () => {
    await createReason(tenantA, 'Headache', 'HEA');
    await createReason(tenantB, 'Pain', 'PAI');
    const result = await appointmentReasonRepository.getAppointmentReasons({ tenantId: tenantA });
    expect(result.data).toHaveLength(1);
    expect(result.data[0]?.tenantId).toBe(tenantA);
  });

  it('should not list soft-deleted appointment reasons', async () => {
    const deleted = await createReason(tenantA, 'Nausea', 'NAU');
    await appointmentReasonRepository.deleteAppointmentReason(deleted.id, tenantA);
    await createReason(tenantA, 'Fatigue', 'FAT');
    const result = await appointmentReasonRepository.getAppointmentReasons({ tenantId: tenantA });
    expect(result.data.map((r) => r.code)).toEqual(['FAT']);
  });

  it('should soft-delete appointment reason and exclude it from future reads', async () => {
    const created = await createReason(tenantA, 'Dizziness', 'DIZ');
    await expect(
      appointmentReasonRepository.deleteAppointmentReason(created.id, tenantA)
    ).resolves.toMatchObject({ id: created.id });
    await expect(
      appointmentReasonRepository.getAppointmentReasonById(created.id, tenantA)
    ).resolves.toBeUndefined();
  });

  it('should update only active appointment reason for the requested tenant', async () => {
    const created = await createReason(tenantA, 'Rash', 'RAS');
    await expect(
      appointmentReasonRepository.updateAppointmentReason(created.id, {
        tenantId: tenantA,
        name: 'Skin Irritation',
        code: 'SKI',
        description: undefined,
      })
    ).resolves.toMatchObject({ name: 'Skin Irritation', code: 'SKI' });
    await appointmentReasonRepository.deleteAppointmentReason(created.id, tenantA);
    await expect(
      appointmentReasonRepository.updateAppointmentReason(created.id, {
        tenantId: tenantA,
        name: 'Rash',
        code: 'RAS',
        description: undefined,
      })
    ).resolves.toBeUndefined();
  });

  it("should not update another tenant's appointment reason", async () => {
    const created = await createReason(tenantA, 'Swelling', 'SWE');
    await expect(
      appointmentReasonRepository.updateAppointmentReason(created.id, {
        tenantId: tenantB,
        name: 'Inflammation',
        code: 'INF',
        description: undefined,
      })
    ).resolves.toBeUndefined();
  });

  it('should enforce case-insensitive unique active name per tenant', async () => {
    await createReason(tenantA, 'Fever', 'FEV');
    await expect(createReason(tenantA, 'fever', 'FEV2')).rejects.toMatchObject({
      cause: { code: '23505', constraint: 'appointment_reason_tenant_name_idx' },
    });
  });

  it('should enforce case-insensitive unique active code per tenant', async () => {
    await createReason(tenantA, 'Fever', 'FEV');
    await expect(createReason(tenantA, 'Cough', 'fev')).rejects.toMatchObject({
      cause: { code: '23505', constraint: 'appointment_reason_tenant_code_idx' },
    });
  });

  it('should allow same name/code across different tenants', async () => {
    await createReason(tenantA, 'Fever', 'FEV');
    await expect(createReason(tenantB, 'Fever', 'FEV')).resolves.toMatchObject({
      tenantId: tenantB,
    });
  });

  it('should allow reusing name/code after the previous row is soft-deleted, proving partial unique indexes work', async () => {
    const created = await createReason(tenantA, 'Fever', 'FEV');
    await appointmentReasonRepository.deleteAppointmentReason(created.id, tenantA);
    await expect(createReason(tenantA, 'fever', 'fev')).resolves.toMatchObject({
      name: 'fever',
      code: 'fev',
    });
  });

  it('should search by name and code', async () => {
    await createReason(tenantA, 'Fever', 'FEV');
    await createReason(tenantA, 'Cough', 'COU');
    expect(
      (
        await appointmentReasonRepository.getAppointmentReasons({ tenantId: tenantA, query: 'cou' })
      ).data.map((r) => r.code)
    ).toEqual(['COU']);
    expect(
      (
        await appointmentReasonRepository.getAppointmentReasons({ tenantId: tenantA, query: 'FEV' })
      ).data.map((r) => r.name)
    ).toEqual(['Fever']);
  });

  it('should paginate list results and return total', async () => {
    await createReason(tenantA, 'Alpha', 'A');
    await createReason(tenantA, 'Bravo', 'B');
    await createReason(tenantA, 'Charlie', 'C');
    const result = await appointmentReasonRepository.getAppointmentReasons({
      tenantId: tenantA,
      page: 2,
      limit: 2,
    });
    expect(result.total).toBe(3);
    expect(result.data.map((reason) => reason.name)).toEqual(['Charlie']);
  });
});
