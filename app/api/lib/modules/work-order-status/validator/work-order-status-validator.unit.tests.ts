import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { workOrderStatusRepository } from '../repository/work-order-status-repository';
import { validateCreateWorkOrderStatus } from './create-work-order-status-validator';
import { validateDeleteWorkOrderStatus } from './delete-work-order-status-validator';
import { validateGetWorkOrderStatusById } from './get-work-order-status-by-id-validator';
import { validateGetWorkOrderStatuses } from './get-work-order-statuses-validator';
import {
  validateSystemWorkOrderStatusDelete,
  validateSystemWorkOrderStatusUpdate,
} from './work-order-status-protection-validator';
import { validateUpdateWorkOrderStatus } from './update-work-order-status-validator';

vi.mock('../repository/work-order-status-repository', () => ({
  workOrderStatusRepository: {
    findActiveByName: vi.fn(),
    findActiveByCode: vi.fn(),
    getWorkOrderStatusById: vi.fn(),
  },
}));

const repo = vi.mocked(workOrderStatusRepository);
const existing = {
  id: 1,
  tenantId: 'tenant-1',
  name: 'Open',
  code: 'OPN',
  color: '#16A34A',
  category: 'OPEN' as const,
  isSystem: false,
  description: null,
  createdOn: new Date(),
  modifiedOn: new Date(),
};
const notInUse = { isStatusInUse: vi.fn().mockResolvedValue(false) };
const inUse = { isStatusInUse: vi.fn().mockResolvedValue(true) };
const payload = { name: 'Open', code: 'OPN', color: '#16A34A', category: 'OPEN' as const };

describe('WorkOrderStatus validators', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    notInUse.isStatusInUse.mockResolvedValue(false);
    inUse.isStatusInUse.mockResolvedValue(true);
    repo.findActiveByName.mockResolvedValue(undefined);
    repo.findActiveByCode.mockResolvedValue(undefined);
    repo.getWorkOrderStatusById.mockResolvedValue(existing);
  });

  it('should return schema validation errors when create payload is invalid', async () => {
    const result = await validateCreateWorkOrderStatus({}, 'tenant-1');
    expect(result).toMatchObject({
      success: false,
      errors: expect.arrayContaining(['Work order status name is required']),
    });
    expect(repo.findActiveByName).not.toHaveBeenCalled();
  });

  it('should return conflict when create name already exists', async () => {
    repo.findActiveByName.mockResolvedValue(existing);
    const result = await validateCreateWorkOrderStatus(payload, 'tenant-1');
    expect(result).toMatchObject({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ["Work order status name 'Open' already exists."],
    });
  });

  it('should return parsed data on create success', async () => {
    await expect(validateCreateWorkOrderStatus(payload, 'tenant-1')).resolves.toEqual({
      success: true,
      data: payload,
    });
  });

  it('should return invalid id error from update validator', async () => {
    const result = await validateUpdateWorkOrderStatus('abc', payload, 'tenant-1', notInUse);
    expect(result).toMatchObject({
      success: false,
      errors: expect.arrayContaining(['Work order status abc is Invalid.']),
    });
  });

  it('should return not found from update validator when entity does not exist', async () => {
    repo.getWorkOrderStatusById.mockResolvedValue(undefined);
    const result = await validateUpdateWorkOrderStatus('1', payload, 'tenant-1', notInUse);
    expect(result).toMatchObject({ success: false, status: StatusCodes.NOT_FOUND });
  });

  it('should reject changing the code of a system status', async () => {
    repo.getWorkOrderStatusById.mockResolvedValue({ ...existing, isSystem: true });
    const result = await validateUpdateWorkOrderStatus(
      '1',
      { ...payload, code: 'NEW' },
      'tenant-1',
      notInUse
    );
    expect(result).toMatchObject({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['System work order status code cannot be changed.'],
    });
  });

  it('should reject changing the category while the status is in use', async () => {
    const result = await validateUpdateWorkOrderStatus(
      '1',
      { ...payload, category: 'COMPLETED' },
      'tenant-1',
      inUse
    );
    expect(result).toMatchObject({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['Work order status category cannot be changed while the status is in use.'],
    });
  });

  it('should pass exclude id during update uniqueness checks', async () => {
    await validateUpdateWorkOrderStatus('7', payload, 'tenant-1', notInUse);
    expect(repo.findActiveByName).toHaveBeenCalledWith('tenant-1', 'Open', { excludeId: 7 });
    expect(repo.findActiveByCode).toHaveBeenCalledWith('tenant-1', 'OPN', { excludeId: 7 });
  });

  it('should return parsed id/payload on update success', async () => {
    await expect(
      validateUpdateWorkOrderStatus('7', payload, 'tenant-1', notInUse)
    ).resolves.toEqual({ success: true, data: { id: 7, payload } });
  });

  it('should return not found from delete validator when entity does not exist', async () => {
    repo.getWorkOrderStatusById.mockResolvedValue(undefined);
    const result = await validateDeleteWorkOrderStatus('1', 'tenant-1', notInUse);
    expect(result).toMatchObject({ success: false, status: StatusCodes.NOT_FOUND });
  });

  it('should reject deleting a system status', async () => {
    repo.getWorkOrderStatusById.mockResolvedValue({ ...existing, isSystem: true });
    const result = await validateDeleteWorkOrderStatus('1', 'tenant-1', notInUse);
    expect(result).toMatchObject({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['System work order status cannot be deleted.'],
    });
  });

  it('should reject deleting a status that is in use', async () => {
    const result = await validateDeleteWorkOrderStatus('1', 'tenant-1', inUse);
    expect(result).toMatchObject({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['Work order status cannot be deleted while it is in use.'],
    });
  });

  it('should return parsed data on delete success', async () => {
    await expect(validateDeleteWorkOrderStatus('1', 'tenant-1', notInUse)).resolves.toEqual({
      success: true,
      data: { id: 1, tenantId: 'tenant-1' },
    });
  });

  it('should allow non-system updates through the protection validator', () => {
    expect(
      validateSystemWorkOrderStatusUpdate(
        { code: 'OPN', category: 'OPEN', isSystem: false },
        { code: 'NEW', category: 'COMPLETED' }
      )
    ).toEqual({ success: true, data: undefined });
  });

  it('should flag protected system code and category changes', () => {
    expect(
      validateSystemWorkOrderStatusUpdate(
        { code: 'OPN', category: 'OPEN', isSystem: true },
        { code: 'NEW', category: 'COMPLETED' }
      )
    ).toMatchObject({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: [
        'System work order status code cannot be changed.',
        'System work order status category cannot be changed.',
      ],
    });
  });

  it('should block delete of a system status through the protection validator', () => {
    expect(validateSystemWorkOrderStatusDelete({ isSystem: true })).toMatchObject({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['System work order status cannot be deleted.'],
    });
    expect(validateSystemWorkOrderStatusDelete({ isSystem: false })).toEqual({
      success: true,
      data: undefined,
    });
  });

  it('should validate get-by-id and list tenant inputs', () => {
    expect(validateGetWorkOrderStatusById('1', 'tenant-1')).toEqual({
      success: true,
      data: { id: 1, tenantId: 'tenant-1' },
    });
    expect(validateGetWorkOrderStatusById('abc', 'tenant-1')).toMatchObject({
      success: false,
      errors: ['Work order status abc is Invalid.'],
    });
    expect(validateGetWorkOrderStatuses('tenant-1')).toEqual({ success: true, data: 'tenant-1' });
    expect(validateGetWorkOrderStatuses('  ')).toMatchObject({ success: false });
  });
});
