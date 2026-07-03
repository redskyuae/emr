import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { workOrderPriorityRepository } from '../repository/work-order-priority-repository';
import { validateCreateWorkOrderPriority } from './create-work-order-priority-validator';
import { validateDeleteWorkOrderPriority } from './delete-work-order-priority-validator';
import { validateGetWorkOrderPriorityById } from './get-work-order-priority-by-id-validator';
import { validateGetWorkOrderPriorities } from './get-work-order-priorities-validator';
import { validateUpdateWorkOrderPriority } from './update-work-order-priority-validator';

vi.mock('../repository/work-order-priority-repository', () => ({
  workOrderPriorityRepository: {
    findActiveByName: vi.fn(),
    findActiveByCode: vi.fn(),
    getWorkOrderPriorityById: vi.fn(),
  },
}));

const repo = vi.mocked(workOrderPriorityRepository);
const existing = {
  id: 1,
  tenantId: 'tenant-1',
  name: 'Good',
  code: 'GD',
  color: '#16A34A',
  description: null,
  createdOn: new Date(),
  modifiedOn: new Date(),
};

describe('WorkOrderPriority validators', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repo.findActiveByName.mockResolvedValue(undefined);
    repo.findActiveByCode.mockResolvedValue(undefined);
    repo.getWorkOrderPriorityById.mockResolvedValue(existing);
  });

  it('should return schema validation errors when payload is invalid', async () => {
    const result = await validateCreateWorkOrderPriority({}, 'tenant-1');
    expect(result).toMatchObject({
      success: false,
      errors: expect.arrayContaining(['Work order priority name is required']),
    });
  });

  it('should not call uniqueness repository checks when schema validation fails', async () => {
    await validateCreateWorkOrderPriority({}, 'tenant-1');
    expect(repo.findActiveByName).not.toHaveBeenCalled();
    expect(repo.findActiveByCode).not.toHaveBeenCalled();
  });

  it('should return conflict when active work order priority name already exists for tenant', async () => {
    repo.findActiveByName.mockResolvedValue(existing);
    const result = await validateCreateWorkOrderPriority(
      { name: 'Good', code: 'GD', color: '#16A34A' },
      'tenant-1'
    );
    expect(result).toMatchObject({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ["Work order priority name 'Good' already exists."],
    });
  });

  it('should return conflict when active work order priority code already exists for tenant', async () => {
    repo.findActiveByCode.mockResolvedValue(existing);
    const result = await validateCreateWorkOrderPriority(
      { name: 'Good', code: 'GD', color: '#16A34A' },
      'tenant-1'
    );
    expect(result).toMatchObject({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ["Work order priority code 'GD' already exists."],
    });
  });

  it('should return all duplicate errors when both name and code already exist', async () => {
    repo.findActiveByName.mockResolvedValue(existing);
    repo.findActiveByCode.mockResolvedValue(existing);
    const result = await validateCreateWorkOrderPriority(
      { name: 'Good', code: 'GD', color: '#16A34A' },
      'tenant-1'
    );
    expect(result).toMatchObject({
      success: false,
      errors: [
        "Work order priority name 'Good' already exists.",
        "Work order priority code 'GD' already exists.",
      ],
    });
  });

  it('should pass exclude id during update uniqueness checks', async () => {
    await validateUpdateWorkOrderPriority(
      '7',
      { name: 'Worn', code: 'wr', color: '#16A34A' },
      'tenant-1'
    );
    expect(repo.findActiveByName).toHaveBeenCalledWith('tenant-1', 'Worn', { excludeId: 7 });
    expect(repo.findActiveByCode).toHaveBeenCalledWith('tenant-1', 'WR', { excludeId: 7 });
  });

  it('should return invalid id error from update validator when id cannot be parsed', async () => {
    const result = await validateUpdateWorkOrderPriority(
      'abc',
      { name: 'Worn', code: 'WR', color: '#16A34A' },
      'tenant-1'
    );
    expect(result).toMatchObject({
      success: false,
      errors: expect.arrayContaining(['Work order priority abc is Invalid.']),
    });
  });

  it('should return not found from update validator when entity does not exist', async () => {
    repo.getWorkOrderPriorityById.mockResolvedValue(undefined);
    const result = await validateUpdateWorkOrderPriority(
      '1',
      { name: 'Worn', code: 'WR', color: '#16A34A' },
      'tenant-1'
    );
    expect(result).toMatchObject({ success: false, status: StatusCodes.NOT_FOUND });
  });

  it('should return parsed/transformed data on create success', async () => {
    await expect(
      validateCreateWorkOrderPriority({ name: ' Worn ', code: 'wr', color: '#16A34A' }, 'tenant-1')
    ).resolves.toEqual({ success: true, data: { name: 'Worn', code: 'WR', color: '#16A34A' } });
  });

  it('should preserve validator status on failure', async () => {
    repo.findActiveByCode.mockResolvedValue(existing);
    const result = await validateCreateWorkOrderPriority(
      { name: 'Worn', code: 'WR', color: '#16A34A' },
      'tenant-1'
    );
    expect(result).toMatchObject({ status: StatusCodes.CONFLICT });
  });

  it('should validate delete inputs and reject invalid id', async () => {
    const usage = { isPriorityInUse: vi.fn().mockResolvedValue(false) };
    await expect(validateDeleteWorkOrderPriority('1', 'tenant-1', usage)).resolves.toEqual({
      success: true,
      data: { id: 1, tenantId: 'tenant-1' },
    });
    await expect(validateDeleteWorkOrderPriority('abc', 'tenant-1', usage)).resolves.toMatchObject({
      success: false,
      errors: ['Work order priority abc is Invalid.'],
    });
    expect(usage.isPriorityInUse).not.toHaveBeenCalledWith('abc', 'tenant-1');
  });

  it('should return conflict from delete validator when priority is in use', async () => {
    const usage = { isPriorityInUse: vi.fn().mockResolvedValue(true) };
    await expect(validateDeleteWorkOrderPriority('1', 'tenant-1', usage)).resolves.toMatchObject({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['Work order priority cannot be deleted while it is in use.'],
    });
  });

  it('should validate get-by-id inputs and reject empty tenant', () => {
    expect(validateGetWorkOrderPriorityById('1', 'tenant-1')).toEqual({
      success: true,
      data: { id: 1, tenantId: 'tenant-1' },
    });
    expect(validateGetWorkOrderPriorityById('1', '  ')).toMatchObject({ success: false });
  });

  it('should validate list tenant input', () => {
    expect(validateGetWorkOrderPriorities('tenant-1')).toEqual({ success: true, data: 'tenant-1' });
    expect(validateGetWorkOrderPriorities('  ')).toMatchObject({
      success: false,
      errors: ['Tenant ID cannot be empty'],
    });
  });
});
