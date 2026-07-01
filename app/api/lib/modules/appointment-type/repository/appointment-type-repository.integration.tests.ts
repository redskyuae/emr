import { describe, expect, it } from 'vitest';

import { appointmentTypeRepository } from './appointment-type-repository';

const tenantA = 'tenant-a-test';
const tenantB = 'tenant-b-test';

const createType = (tenantId: string, name: string, code: string) =>
  appointmentTypeRepository.createAppointmentType({
    tenantId,
    name,
    code,
    description: `${name} description`,
  });

describe('AppointmentType repository', () => {
  it('should create appointment type for a tenant', async () => {
    const created = await createType(tenantA, 'Consultation', 'CON');
    expect(created).toMatchObject({
      id: expect.any(Number),
      tenantId: tenantA,
      name: 'Consultation',
      code: 'CON',
      description: 'Consultation description',
    });
  });

  it('should get appointment type by id for same tenant', async () => {
    const created = await createType(tenantA, 'Follow-up', 'FLW');
    await expect(
      appointmentTypeRepository.getAppointmentTypeById(created.id, tenantA)
    ).resolves.toMatchObject({ id: created.id, tenantId: tenantA });
  });

  it('should not get appointment type by id for another tenant', async () => {
    const created = await createType(tenantA, 'Emergency', 'EMG');
    await expect(
      appointmentTypeRepository.getAppointmentTypeById(created.id, tenantB)
    ).resolves.toBeUndefined();
  });

  it('should list only appointment types for the requested tenant', async () => {
    await createType(tenantA, 'Routine', 'RUT');
    await createType(tenantB, 'Urgent', 'URG');
    const result = await appointmentTypeRepository.getAppointmentTypes({ tenantId: tenantA });
    expect(result.data).toHaveLength(1);
    expect(result.data[0]?.tenantId).toBe(tenantA);
  });

  it('should not list soft-deleted appointment types', async () => {
    const deleted = await createType(tenantA, 'Telehealth', 'TEL');
    await appointmentTypeRepository.deleteAppointmentType(deleted.id, tenantA);
    await createType(tenantA, 'Home Visit', 'HOM');
    const result = await appointmentTypeRepository.getAppointmentTypes({ tenantId: tenantA });
    expect(result.data.map((t) => t.code)).toEqual(['HOM']);
  });

  it('should soft-delete appointment type and exclude it from future reads', async () => {
    const created = await createType(tenantA, 'Walk-in', 'WAL');
    await expect(
      appointmentTypeRepository.deleteAppointmentType(created.id, tenantA)
    ).resolves.toMatchObject({ id: created.id });
    await expect(
      appointmentTypeRepository.getAppointmentTypeById(created.id, tenantA)
    ).resolves.toBeUndefined();
  });

  it("should not delete another tenant's appointment type", async () => {
    const created = await createType(tenantA, 'Vaccination', 'VAC');
    await expect(
      appointmentTypeRepository.deleteAppointmentType(created.id, tenantB)
    ).resolves.toBeUndefined();
    await expect(
      appointmentTypeRepository.getAppointmentTypeById(created.id, tenantA)
    ).resolves.toMatchObject({ id: created.id });
  });

  it('should update only active appointment type for the requested tenant', async () => {
    const created = await createType(tenantA, 'Procedure', 'PRC');
    await expect(
      appointmentTypeRepository.updateAppointmentType(created.id, {
        tenantId: tenantA,
        name: 'Surgery',
        code: 'SUR',
        description: undefined,
      })
    ).resolves.toMatchObject({ name: 'Surgery', code: 'SUR' });
    await appointmentTypeRepository.deleteAppointmentType(created.id, tenantA);
    await expect(
      appointmentTypeRepository.updateAppointmentType(created.id, {
        tenantId: tenantA,
        name: 'Procedure',
        code: 'PRC',
        description: undefined,
      })
    ).resolves.toBeUndefined();
  });

  it("should not update another tenant's appointment type", async () => {
    const created = await createType(tenantA, 'Check-up', 'CHK');
    await expect(
      appointmentTypeRepository.updateAppointmentType(created.id, {
        tenantId: tenantB,
        name: 'Annual',
        code: 'ANN',
        description: undefined,
      })
    ).resolves.toBeUndefined();
  });

  it('should enforce case-insensitive unique active name per tenant', async () => {
    await createType(tenantA, 'Consultation', 'CON');
    await expect(createType(tenantA, 'consultation', 'CON2')).rejects.toMatchObject({
      cause: { code: '23505', constraint: 'appointment_type_tenant_name_idx' },
    });
  });

  it('should enforce case-insensitive unique active code per tenant', async () => {
    await createType(tenantA, 'Consultation', 'CON');
    await expect(createType(tenantA, 'Follow-up', 'con')).rejects.toMatchObject({
      cause: { code: '23505', constraint: 'appointment_type_tenant_code_idx' },
    });
  });

  it('should allow same name/code across different tenants', async () => {
    await createType(tenantA, 'Consultation', 'CON');
    await expect(createType(tenantB, 'Consultation', 'CON')).resolves.toMatchObject({
      tenantId: tenantB,
    });
  });

  it('should allow reusing name/code after the previous row is soft-deleted, proving partial unique indexes work', async () => {
    const created = await createType(tenantA, 'Consultation', 'CON');
    await appointmentTypeRepository.deleteAppointmentType(created.id, tenantA);
    await expect(createType(tenantA, 'consultation', 'con')).resolves.toMatchObject({
      name: 'consultation',
      code: 'con',
    });
  });

  it('should search by name and code', async () => {
    await createType(tenantA, 'Consultation', 'CON');
    await createType(tenantA, 'Follow-up', 'FLW');
    expect(
      (
        await appointmentTypeRepository.getAppointmentTypes({ tenantId: tenantA, query: 'flw' })
      ).data.map((t) => t.code)
    ).toEqual(['FLW']);
    expect(
      (
        await appointmentTypeRepository.getAppointmentTypes({ tenantId: tenantA, query: 'CON' })
      ).data.map((t) => t.name)
    ).toEqual(['Consultation']);
  });

  it('should paginate list results and return total', async () => {
    await createType(tenantA, 'Alpha', 'A');
    await createType(tenantA, 'Bravo', 'B');
    await createType(tenantA, 'Charlie', 'C');
    const result = await appointmentTypeRepository.getAppointmentTypes({
      tenantId: tenantA,
      page: 2,
      limit: 2,
    });
    expect(result.total).toBe(3);
    expect(result.data.map((type) => type.name)).toEqual(['Charlie']);
  });
});
