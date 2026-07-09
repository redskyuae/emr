import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { visitStatusRepository } from '../repository/visit-status-repository';
import { validateCreateVisitStatus } from './create-visit-status-validator';
import { validateDeleteVisitStatus } from './delete-visit-status-validator';
import { validateGetVisitStatusById } from './get-visit-status-by-id-validator';
import { validateGetVisitStatuses } from './get-visit-statuses-validator';
import {
  validateSystemVisitStatusDelete,
  validateSystemVisitStatusUpdate,
} from './visit-status-protection-validator';
import { validateUpdateVisitStatus } from './update-visit-status-validator';

vi.mock('../repository/visit-status-repository', () => ({
  visitStatusRepository: {
    findActiveByName: vi.fn(),
    findActiveByCode: vi.fn(),
    getVisitStatusById: vi.fn(),
  },
}));

const repo = vi.mocked(visitStatusRepository);
const existing = {
  id: 1,
  tenantId: 'tenant-1',
  name: 'Waiting',
  code: 'WAIT',
  color: '#16A34A',
  category: 'WAITING' as const,
  isSystem: false,
  description: null,
  createdOn: new Date(),
  modifiedOn: new Date(),
};
const notInUse = { isStatusInUse: vi.fn().mockResolvedValue(false) };
const inUse = { isStatusInUse: vi.fn().mockResolvedValue(true) };
const payload = { name: 'Waiting', code: 'WAIT', color: '#16A34A', category: 'WAITING' as const };

describe('VisitStatus validators', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    notInUse.isStatusInUse.mockResolvedValue(false);
    inUse.isStatusInUse.mockResolvedValue(true);
    repo.findActiveByName.mockResolvedValue(undefined);
    repo.findActiveByCode.mockResolvedValue(undefined);
    repo.getVisitStatusById.mockResolvedValue(existing);
  });

  it('should return schema validation errors when create payload is invalid', async () => {
    const result = await validateCreateVisitStatus({}, 'tenant-1');
    expect(result).toMatchObject({
      success: false,
      errors: expect.arrayContaining(['Visit status name is required']),
    });
    expect(repo.findActiveByName).not.toHaveBeenCalled();
  });

  it('should return conflict when create name already exists', async () => {
    repo.findActiveByName.mockResolvedValue(existing);
    const result = await validateCreateVisitStatus(payload, 'tenant-1');
    expect(result).toMatchObject({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ["Visit status name 'Waiting' already exists."],
    });
  });

  it('should return parsed data on create success', async () => {
    await expect(validateCreateVisitStatus(payload, 'tenant-1')).resolves.toEqual({
      success: true,
      data: payload,
    });
  });

  it('should return invalid id error from update validator', async () => {
    const result = await validateUpdateVisitStatus('abc', payload, 'tenant-1', notInUse);
    expect(result).toMatchObject({
      success: false,
      errors: expect.arrayContaining(['Visit status abc is Invalid.']),
    });
  });

  it('should return not found from update validator when entity does not exist', async () => {
    repo.getVisitStatusById.mockResolvedValue(undefined);
    const result = await validateUpdateVisitStatus('1', payload, 'tenant-1', notInUse);
    expect(result).toMatchObject({ success: false, status: StatusCodes.NOT_FOUND });
  });

  it('should reject changing the code of a system status', async () => {
    repo.getVisitStatusById.mockResolvedValue({ ...existing, isSystem: true });
    const result = await validateUpdateVisitStatus(
      '1',
      { ...payload, code: 'NEW' },
      'tenant-1',
      notInUse
    );
    expect(result).toMatchObject({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['System visit status code cannot be changed.'],
    });
  });

  it('should reject changing the category while the status is in use', async () => {
    const result = await validateUpdateVisitStatus(
      '1',
      { ...payload, category: 'COMPLETED' },
      'tenant-1',
      inUse
    );
    expect(result).toMatchObject({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['Visit status category cannot be changed while the status is in use.'],
    });
  });

  it('should pass exclude id during update uniqueness checks', async () => {
    await validateUpdateVisitStatus('7', payload, 'tenant-1', notInUse);
    expect(repo.findActiveByName).toHaveBeenCalledWith('tenant-1', 'Waiting', { excludeId: 7 });
    expect(repo.findActiveByCode).toHaveBeenCalledWith('tenant-1', 'WAIT', { excludeId: 7 });
  });

  it('should return parsed id/payload on update success', async () => {
    await expect(validateUpdateVisitStatus('7', payload, 'tenant-1', notInUse)).resolves.toEqual({
      success: true,
      data: { id: 7, payload },
    });
  });

  it('should return not found from delete validator when entity does not exist', async () => {
    repo.getVisitStatusById.mockResolvedValue(undefined);
    const result = await validateDeleteVisitStatus('1', 'tenant-1', notInUse);
    expect(result).toMatchObject({ success: false, status: StatusCodes.NOT_FOUND });
  });

  it('should reject deleting a system status', async () => {
    repo.getVisitStatusById.mockResolvedValue({ ...existing, isSystem: true });
    const result = await validateDeleteVisitStatus('1', 'tenant-1', notInUse);
    expect(result).toMatchObject({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['System visit status cannot be deleted.'],
    });
  });

  it('should reject deleting a status that is in use', async () => {
    const result = await validateDeleteVisitStatus('1', 'tenant-1', inUse);
    expect(result).toMatchObject({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['Visit status cannot be deleted while it is in use.'],
    });
  });

  it('should return parsed data on delete success', async () => {
    await expect(validateDeleteVisitStatus('1', 'tenant-1', notInUse)).resolves.toEqual({
      success: true,
      data: { id: 1, tenantId: 'tenant-1' },
    });
  });

  it('should allow non-system updates through the protection validator', () => {
    expect(
      validateSystemVisitStatusUpdate(
        { code: 'WAIT', category: 'WAITING', isSystem: false },
        { code: 'NEW', category: 'COMPLETED' }
      )
    ).toEqual({ success: true, data: undefined });
  });

  it('should flag protected system code and category changes', () => {
    expect(
      validateSystemVisitStatusUpdate(
        { code: 'WAIT', category: 'WAITING', isSystem: true },
        { code: 'NEW', category: 'COMPLETED' }
      )
    ).toMatchObject({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: [
        'System visit status code cannot be changed.',
        'System visit status category cannot be changed.',
      ],
    });
  });

  it('should block delete of a system status through the protection validator', () => {
    expect(validateSystemVisitStatusDelete({ isSystem: true })).toMatchObject({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['System visit status cannot be deleted.'],
    });
    expect(validateSystemVisitStatusDelete({ isSystem: false })).toEqual({
      success: true,
      data: undefined,
    });
  });

  it('should validate get-by-id and list tenant inputs', () => {
    expect(validateGetVisitStatusById('1', 'tenant-1')).toEqual({
      success: true,
      data: { id: 1, tenantId: 'tenant-1' },
    });
    expect(validateGetVisitStatusById('abc', 'tenant-1')).toMatchObject({
      success: false,
      errors: ['Visit status abc is Invalid.'],
    });
    expect(validateGetVisitStatuses('tenant-1')).toEqual({ success: true, data: 'tenant-1' });
    expect(validateGetVisitStatuses('  ')).toMatchObject({ success: false });
  });
});
