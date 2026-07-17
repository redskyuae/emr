import { beforeEach, describe, expect, it } from 'vitest';

import { roomTypeRepository } from '../../room-type/repository/room-type-repository';
import { roomRepository } from '../../room/repository/room-repository';
import { wardRepository } from '../../ward/repository/ward-repository';
import type { CreateBedData } from '../schemas/bed-schema';
import { bedRepository } from './bed-repository';

const tenantA = 'tenant-a-test';
const tenantB = 'tenant-b-test';

let wardA: { id: number };
let wardA2: { id: number };
let wardB: { id: number };

const createWard = (tenantId: string, name: string, code: string) =>
  wardRepository.createWard({ tenantId, name, code, description: undefined });

const createBed = (
  tenantId: string,
  bedNumber: string,
  wardId: number,
  overrides: Partial<CreateBedData> = {}
) =>
  bedRepository.createBed({
    tenantId,
    bedNumber,
    wardId,
    status: 'AVAILABLE',
    ...overrides,
  });

describe('Bed repository', () => {
  beforeEach(async () => {
    wardA = await createWard(tenantA, 'ICU', 'ICU');
    wardA2 = await createWard(tenantA, 'Maternity', 'MAT');
    wardB = await createWard(tenantB, 'ICU', 'ICU');
  });

  it('should create a Bed with its Ward resolved and no Room', async () => {
    const created = await createBed(tenantA, 'ICU-01', wardA.id);

    expect(created).toMatchObject({
      id: expect.any(Number),
      tenantId: tenantA,
      bedNumber: 'ICU-01',
      status: 'AVAILABLE',
      wardId: wardA.id,
      roomId: null,
      room: null,
      ward: { id: wardA.id, name: 'ICU', code: 'ICU' },
    });
  });

  it('should create a Bed linked to a Room and resolve the room number', async () => {
    const roomType = await roomTypeRepository.createRoomType({
      tenantId: tenantA,
      name: 'Intensive Care',
      code: 'ICU',
      color: '#2563EB',
      dailyRate: 9000,
      description: undefined,
    });
    const room = await roomRepository.createRoom({
      tenantId: tenantA,
      roomNumber: '301-A',
      roomTypeId: roomType.id,
      status: 'AVAILABLE',
      bedCount: 2,
    });

    const created = await createBed(tenantA, 'ICU-02', wardA.id, { roomId: room!.id });

    expect(created).toMatchObject({
      roomId: room!.id,
      room: { id: room!.id, roomNumber: '301-A' },
    });
  });

  it('should read a Bed by id within the same tenant only', async () => {
    const created = await createBed(tenantA, 'ICU-03', wardA.id);

    await expect(bedRepository.getBedById(created!.id, tenantA)).resolves.toMatchObject({
      id: created!.id,
    });
    await expect(bedRepository.getBedById(created!.id, tenantB)).resolves.toBeUndefined();
  });

  it('should list only Beds belonging to the requested tenant', async () => {
    await createBed(tenantA, 'ICU-01', wardA.id);
    await createBed(tenantB, 'ICU-01', wardB.id);

    const result = await bedRepository.getBeds({ tenantId: tenantA });

    expect(result.total).toBe(1);
    expect(result.data[0]?.tenantId).toBe(tenantA);
  });

  it('should exclude soft-deleted Beds from reads and free the bed number for reuse', async () => {
    const created = await createBed(tenantA, 'ICU-04', wardA.id);

    const deleteResult = await bedRepository.deleteBed(created!.id, tenantA);

    expect(deleteResult).toEqual({ outcome: 'deleted', data: { id: created!.id } });
    await expect(bedRepository.getBedById(created!.id, tenantA)).resolves.toBeUndefined();

    await expect(createBed(tenantA, 'ICU-04', wardA.id)).resolves.toMatchObject({
      bedNumber: 'ICU-04',
    });
  });

  it('should refuse to delete an occupied Bed', async () => {
    // OCCUPIED is system-managed and unreachable through the create/update schemas,
    // so the occupied state is simulated at the repository boundary.
    const created = await createBed(tenantA, 'ICU-05', wardA.id, {
      status: 'OCCUPIED' as CreateBedData['status'],
    });

    await expect(bedRepository.deleteBed(created!.id, tenantA)).resolves.toEqual({
      outcome: 'occupied',
      bedNumber: 'ICU-05',
    });
    await expect(bedRepository.getBedById(created!.id, tenantA)).resolves.toMatchObject({
      id: created!.id,
    });
  });

  it('should not delete a Bed from another tenant', async () => {
    const created = await createBed(tenantA, 'ICU-06', wardA.id);

    await expect(bedRepository.deleteBed(created!.id, tenantB)).resolves.toEqual({
      outcome: 'not-found',
    });
  });

  it('should update only an active Bed in the requested tenant', async () => {
    const created = await createBed(tenantA, 'ICU-07', wardA.id);

    const updated = await bedRepository.updateBed(created!.id, {
      tenantId: tenantA,
      bedNumber: 'ICU-07A',
      wardId: wardA2.id,
      status: 'RESERVED',
      notes: 'Awaiting transfer-in',
    });

    expect(updated).toMatchObject({
      bedNumber: 'ICU-07A',
      wardId: wardA2.id,
      status: 'RESERVED',
      notes: 'Awaiting transfer-in',
      ward: { id: wardA2.id, name: 'Maternity' },
    });

    await expect(
      bedRepository.updateBed(created!.id, {
        tenantId: tenantB,
        bedNumber: 'X',
        wardId: wardB.id,
        status: 'AVAILABLE',
      })
    ).resolves.toBeUndefined();
  });

  it('should enforce case-insensitive bed number uniqueness within a ward', async () => {
    await createBed(tenantA, 'ICU-08', wardA.id);

    await expect(createBed(tenantA, 'icu-08', wardA.id)).rejects.toThrow();
  });

  it('should allow the same bed number in a different ward and a different tenant', async () => {
    await createBed(tenantA, 'BED-01', wardA.id);

    await expect(createBed(tenantA, 'BED-01', wardA2.id)).resolves.toMatchObject({
      bedNumber: 'BED-01',
    });
    await expect(createBed(tenantB, 'BED-01', wardB.id)).resolves.toMatchObject({
      bedNumber: 'BED-01',
    });
  });

  it('should find an active bed by number case-insensitively within the ward', async () => {
    const created = await createBed(tenantA, 'ICU-09', wardA.id);

    await expect(
      bedRepository.findActiveByBedNumber(tenantA, wardA.id, 'icu-09')
    ).resolves.toMatchObject({ id: created!.id });
    await expect(
      bedRepository.findActiveByBedNumber(tenantA, wardA2.id, 'icu-09')
    ).resolves.toBeUndefined();
    await expect(
      bedRepository.findActiveByBedNumber(tenantA, wardA.id, 'icu-09', { excludeId: created!.id })
    ).resolves.toBeUndefined();
  });

  it('should filter Beds by ward and status, and search by bed number', async () => {
    await createBed(tenantA, 'ICU-10', wardA.id);
    await createBed(tenantA, 'ICU-11', wardA.id, { status: 'MAINTENANCE' });
    await createBed(tenantA, 'MAT-01', wardA2.id);

    const byWard = await bedRepository.getBeds({ tenantId: tenantA, wardId: wardA.id });
    expect(byWard.total).toBe(2);

    const byStatus = await bedRepository.getBeds({ tenantId: tenantA, status: 'MAINTENANCE' });
    expect(byStatus.data.map((row) => row.bedNumber)).toEqual(['ICU-11']);

    const bySearch = await bedRepository.getBeds({ tenantId: tenantA, query: 'mat' });
    expect(bySearch.data.map((row) => row.bedNumber)).toEqual(['MAT-01']);
  });

  it('should count only active beds in the requested ward', async () => {
    const first = await createBed(tenantA, 'ICU-12', wardA.id);
    await createBed(tenantA, 'ICU-13', wardA.id);

    await expect(bedRepository.countActiveBedsByWardId(tenantA, wardA.id)).resolves.toBe(2);

    await bedRepository.deleteBed(first!.id, tenantA);

    await expect(bedRepository.countActiveBedsByWardId(tenantA, wardA.id)).resolves.toBe(1);
    await expect(bedRepository.countActiveBedsByWardId(tenantB, wardA.id)).resolves.toBe(0);
  });

  it('should return board rows grouped-ready and tenant-scoped with empty occupants', async () => {
    await createBed(tenantA, 'ICU-14', wardA.id);
    await createBed(tenantA, 'MAT-02', wardA2.id);
    await createBed(tenantB, 'ICU-14', wardB.id);

    const rows = await bedRepository.getBedBoard(tenantA);

    expect(rows.map((row) => `${row.wardName}:${row.bedNumber}`)).toEqual([
      'ICU:ICU-14',
      'Maternity:MAT-02',
    ]);
    expect(rows.every((row) => row.admissionId === null && row.patientId === null)).toBe(true);
  });
});
