import { describe, expect, it } from 'vitest';

import { doctorRotaRepository } from './doctor-rota-repository';

const tenantA = 'tenant-a-test';
const tenantB = 'tenant-b-test';

const createRota = (tenantId: string, name: string, fromTime = '09:00', toTime = '13:00') =>
  doctorRotaRepository.createDoctorRota({
    tenantId,
    name,
    fromTime,
    toTime,
  });

describe('DoctorRota repository', () => {
  it('should create doctor rota for a tenant', async () => {
    const created = await createRota(tenantA, 'Morning Rota');
    expect(created).toMatchObject({
      id: expect.any(Number),
      tenantId: tenantA,
      name: 'Morning Rota',
      fromTime: '09:00',
      toTime: '13:00',
      isActive: true,
    });
  });

  it('should get doctor rota by id for same tenant', async () => {
    const created = await createRota(tenantA, 'Morning Rota');
    await expect(
      doctorRotaRepository.getDoctorRotaById(created.id, tenantA)
    ).resolves.toMatchObject({
      id: created.id,
      tenantId: tenantA,
    });
  });

  it('should not get doctor rota by id for another tenant', async () => {
    const created = await createRota(tenantA, 'Morning Rota');
    await expect(
      doctorRotaRepository.getDoctorRotaById(created.id, tenantB)
    ).resolves.toBeUndefined();
  });

  it('should list only doctor rotas for the requested tenant', async () => {
    await createRota(tenantA, 'Morning Rota');
    await createRota(tenantB, 'Afternoon Rota', '13:00', '17:00');
    const result = await doctorRotaRepository.getDoctorRotas({ tenantId: tenantA });
    expect(result.data).toHaveLength(1);
    expect(result.data[0]?.tenantId).toBe(tenantA);
  });

  it('should not list soft-deleted doctor rotas', async () => {
    const deleted = await createRota(tenantA, 'Morning Rota');
    await doctorRotaRepository.deleteDoctorRota(deleted.id, tenantA);
    await createRota(tenantA, 'Afternoon Rota', '13:00', '17:00');
    const result = await doctorRotaRepository.getDoctorRotas({ tenantId: tenantA });
    expect(result.data.map((rota) => rota.name)).toEqual(['Afternoon Rota']);
  });

  it('should soft-delete doctor rota and exclude it from future reads', async () => {
    const created = await createRota(tenantA, 'Morning Rota');
    await expect(doctorRotaRepository.deleteDoctorRota(created.id, tenantA)).resolves.toMatchObject(
      {
        id: created.id,
      }
    );
    await expect(
      doctorRotaRepository.getDoctorRotaById(created.id, tenantA)
    ).resolves.toBeUndefined();
  });

  it('should update only active doctor rota for the requested tenant', async () => {
    const created = await createRota(tenantA, 'Morning Rota');
    await expect(
      doctorRotaRepository.updateDoctorRota(created.id, {
        tenantId: tenantA,
        name: 'Early Rota',
        fromTime: '08:00',
        toTime: '12:00',
      })
    ).resolves.toMatchObject({ name: 'Early Rota', fromTime: '08:00', toTime: '12:00' });
    await doctorRotaRepository.deleteDoctorRota(created.id, tenantA);
    await expect(
      doctorRotaRepository.updateDoctorRota(created.id, {
        tenantId: tenantA,
        name: 'Morning Rota',
        fromTime: '09:00',
        toTime: '13:00',
      })
    ).resolves.toBeUndefined();
  });

  it("should not update another tenant's doctor rota", async () => {
    const created = await createRota(tenantA, 'Morning Rota');
    await expect(
      doctorRotaRepository.updateDoctorRota(created.id, {
        tenantId: tenantB,
        name: 'Early Rota',
        fromTime: '08:00',
        toTime: '12:00',
      })
    ).resolves.toBeUndefined();
  });

  it('should enforce case-insensitive unique active name per tenant', async () => {
    await createRota(tenantA, 'Morning Rota');
    await expect(createRota(tenantA, 'morning rota', '13:00', '17:00')).rejects.toMatchObject({
      cause: { code: '23505', constraint: 'doctor_rota_tenant_name_idx' },
    });
  });

  it('should enforce unique active time range per tenant', async () => {
    await createRota(tenantA, 'Morning Rota');
    await expect(createRota(tenantA, 'Clinic Rota')).rejects.toMatchObject({
      cause: { code: '23505', constraint: 'doctor_rota_tenant_time_range_idx' },
    });
  });

  it('should allow same name across different tenants', async () => {
    await createRota(tenantA, 'Morning Rota');
    await expect(createRota(tenantB, 'Morning Rota')).resolves.toMatchObject({
      tenantId: tenantB,
    });
  });

  it('should allow same time range across different tenants', async () => {
    await createRota(tenantA, 'Morning Rota');
    await expect(createRota(tenantB, 'Clinic Rota')).resolves.toMatchObject({
      tenantId: tenantB,
      fromTime: '09:00',
      toTime: '13:00',
    });
  });

  it('should allow reusing name after the previous row is soft-deleted, proving partial unique indexes work', async () => {
    const created = await createRota(tenantA, 'Morning Rota');
    await doctorRotaRepository.deleteDoctorRota(created.id, tenantA);
    await expect(createRota(tenantA, 'morning rota')).resolves.toMatchObject({
      name: 'morning rota',
    });
  });

  it('should allow reusing time range after the previous row is soft-deleted', async () => {
    const created = await createRota(tenantA, 'Morning Rota');
    await doctorRotaRepository.deleteDoctorRota(created.id, tenantA);
    await expect(createRota(tenantA, 'Clinic Rota')).resolves.toMatchObject({
      name: 'Clinic Rota',
      fromTime: '09:00',
      toTime: '13:00',
    });
  });

  it('should find active doctor rota by time range and honor exclude id', async () => {
    const created = await createRota(tenantA, 'Morning Rota');
    await expect(
      doctorRotaRepository.findActiveByTimeRange(tenantA, '09:00', '13:00')
    ).resolves.toMatchObject({ id: created.id });
    await expect(
      doctorRotaRepository.findActiveByTimeRange(tenantA, '09:00', '13:00', {
        excludeId: created.id,
      })
    ).resolves.toBeUndefined();
  });

  it('should search by name and time window', async () => {
    await createRota(tenantA, 'Morning Rota', '09:00', '13:00');
    await createRota(tenantA, 'Evening Rota', '17:00', '21:00');
    expect(
      (await doctorRotaRepository.getDoctorRotas({ tenantId: tenantA, query: 'evening' })).data.map(
        (rota) => rota.name
      )
    ).toEqual(['Evening Rota']);
    expect(
      (await doctorRotaRepository.getDoctorRotas({ tenantId: tenantA, query: '09:00' })).data.map(
        (rota) => rota.name
      )
    ).toEqual(['Morning Rota']);
  });

  it('should search LIKE wildcard characters as literals', async () => {
    await createRota(tenantA, '100% Rota');
    await createRota(tenantA, '100X Rota', '13:00', '17:00');
    const result = await doctorRotaRepository.getDoctorRotas({ tenantId: tenantA, query: '%' });
    expect(result.data.map((rota) => rota.name)).toEqual(['100% Rota']);
  });

  it('should paginate list results and return total', async () => {
    await createRota(tenantA, 'Alpha', '09:00', '13:00');
    await createRota(tenantA, 'Bravo', '13:00', '17:00');
    await createRota(tenantA, 'Charlie', '17:00', '21:00');
    const result = await doctorRotaRepository.getDoctorRotas({
      tenantId: tenantA,
      page: 2,
      limit: 2,
    });
    expect(result.total).toBe(3);
    expect(result.data.map((rota) => rota.name)).toEqual(['Charlie']);
  });
});
