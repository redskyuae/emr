import { describe, expect, it } from 'vitest';

import { appointmentModeRepository } from './appointment-mode-repository';

const tenantA = 'tenant-a-test';
const tenantB = 'tenant-b-test';

const createMode = (tenantId: string, name: string, code: string) =>
  appointmentModeRepository.createAppointmentMode({
    tenantId,
    name,
    code,
    description: `${name} description`,
  });

describe('AppointmentMode repository', () => {
  it('should create appointment mode for a tenant', async () => {
    const created = await createMode(tenantA, 'In Person', 'IP');
    expect(created).toMatchObject({
      id: 1,
      tenantId: tenantA,
      name: 'In Person',
      code: 'IP',
      description: 'In Person description',
    });
  });

  it('should get appointment mode by id for same tenant', async () => {
    const created = await createMode(tenantA, 'In Person', 'IP');
    await expect(
      appointmentModeRepository.getAppointmentModeById(created.id, tenantA)
    ).resolves.toMatchObject({ id: created.id, tenantId: tenantA });
  });

  it('should not get appointment mode by id for another tenant', async () => {
    const created = await createMode(tenantA, 'In Person', 'IP');
    await expect(
      appointmentModeRepository.getAppointmentModeById(created.id, tenantB)
    ).resolves.toBeUndefined();
  });

  it('should list only appointment modes for the requested tenant', async () => {
    await createMode(tenantA, 'In Person', 'IP');
    await createMode(tenantB, 'Video', 'VID');
    const result = await appointmentModeRepository.getAppointmentModes({ tenantId: tenantA });
    expect(result.data).toHaveLength(1);
    expect(result.data[0]?.tenantId).toBe(tenantA);
  });

  it('should not list soft-deleted appointment modes', async () => {
    const deleted = await createMode(tenantA, 'Phone', 'PH');
    await appointmentModeRepository.deleteAppointmentMode(deleted.id, tenantA);
    await createMode(tenantA, 'Video', 'VID');
    const result = await appointmentModeRepository.getAppointmentModes({ tenantId: tenantA });
    expect(result.data.map((mode) => mode.code)).toEqual(['VID']);
  });

  it('should soft-delete appointment mode and exclude it from future reads', async () => {
    const created = await createMode(tenantA, 'Phone', 'PH');
    await expect(
      appointmentModeRepository.deleteAppointmentMode(created.id, tenantA)
    ).resolves.toMatchObject({ id: created.id });
    await expect(
      appointmentModeRepository.getAppointmentModeById(created.id, tenantA)
    ).resolves.toBeUndefined();
  });

  it('should update only active appointment mode for the requested tenant', async () => {
    const created = await createMode(tenantA, 'Phone', 'PH');
    await expect(
      appointmentModeRepository.updateAppointmentMode(created.id, {
        tenantId: tenantA,
        name: 'Telephone',
        code: 'TEL',
      })
    ).resolves.toMatchObject({ name: 'Telephone', code: 'TEL' });
    await appointmentModeRepository.deleteAppointmentMode(created.id, tenantA);
    await expect(
      appointmentModeRepository.updateAppointmentMode(created.id, {
        tenantId: tenantA,
        name: 'Phone',
        code: 'PH',
      })
    ).resolves.toBeUndefined();
  });

  it("should not update another tenant's appointment mode", async () => {
    const created = await createMode(tenantA, 'Phone', 'PH');
    await expect(
      appointmentModeRepository.updateAppointmentMode(created.id, {
        tenantId: tenantB,
        name: 'Telephone',
        code: 'TEL',
      })
    ).resolves.toBeUndefined();
  });

  it('should enforce case-insensitive unique active name per tenant', async () => {
    await createMode(tenantA, 'In Person', 'IP');
    await expect(createMode(tenantA, 'in person', 'IP2')).rejects.toMatchObject({
      code: '23505',
      constraint: 'appointment_mode_tenant_name_idx',
    });
  });

  it('should enforce case-insensitive unique active code per tenant', async () => {
    await createMode(tenantA, 'In Person', 'IP');
    await expect(createMode(tenantA, 'Other', 'ip')).rejects.toMatchObject({
      code: '23505',
      constraint: 'appointment_mode_tenant_code_idx',
    });
  });

  it('should allow same name/code across different tenants', async () => {
    await createMode(tenantA, 'In Person', 'IP');
    await expect(createMode(tenantB, 'In Person', 'IP')).resolves.toMatchObject({
      tenantId: tenantB,
    });
  });

  it('should allow reusing name/code after the previous row is soft-deleted, proving partial unique indexes work', async () => {
    const created = await createMode(tenantA, 'In Person', 'IP');
    await appointmentModeRepository.deleteAppointmentMode(created.id, tenantA);
    await expect(createMode(tenantA, 'in person', 'ip')).resolves.toMatchObject({
      name: 'in person',
      code: 'ip',
    });
  });

  it('should search by name and code', async () => {
    await createMode(tenantA, 'In Person', 'IP');
    await createMode(tenantA, 'Video Visit', 'VID');
    expect(
      (
        await appointmentModeRepository.getAppointmentModes({ tenantId: tenantA, query: 'video' })
      ).data.map((m) => m.code)
    ).toEqual(['VID']);
    expect(
      (
        await appointmentModeRepository.getAppointmentModes({ tenantId: tenantA, query: 'IP' })
      ).data.map((m) => m.name)
    ).toEqual(['In Person']);
  });

  it('should paginate list results and return total', async () => {
    await createMode(tenantA, 'Alpha', 'A');
    await createMode(tenantA, 'Bravo', 'B');
    await createMode(tenantA, 'Charlie', 'C');
    const result = await appointmentModeRepository.getAppointmentModes({
      tenantId: tenantA,
      page: 2,
      limit: 2,
    });
    expect(result.total).toBe(3);
    expect(result.data.map((mode) => mode.name)).toEqual(['Charlie']);
  });
});
