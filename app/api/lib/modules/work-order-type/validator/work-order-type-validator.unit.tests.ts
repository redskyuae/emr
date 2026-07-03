import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { workOrderTypeRepository } from '../repository/work-order-type-repository';
import { validateCreateWorkOrderType } from './create-work-order-type-validator';
import { validateDeleteWorkOrderType } from './delete-work-order-type-validator';
import { validateGetWorkOrderTypeById } from './get-work-order-type-by-id-validator';
import { validateGetWorkOrderTypes } from './get-work-order-types-validator';
import { validateUpdateWorkOrderType } from './update-work-order-type-validator';

vi.mock('../repository/work-order-type-repository', () => ({
  workOrderTypeRepository: {
    findActiveByName: vi.fn(),
    findActiveByCode: vi.fn(),
    getWorkOrderTypeById: vi.fn(),
  },
}));

const repo = vi.mocked(workOrderTypeRepository);
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

describe('WorkOrderType validators', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repo.findActiveByName.mockResolvedValue(undefined);
    repo.findActiveByCode.mockResolvedValue(undefined);
    repo.getWorkOrderTypeById.mockResolvedValue(existing);
  });

  it('should return schema validation errors when payload is invalid', async () => {
    const result = await validateCreateWorkOrderType({}, 'tenant-1');
    expect(result).toMatchObject({
      success: false,
      errors: expect.arrayContaining(['Work order type name is required']),
    });
  });

  it('should not call uniqueness repository checks when schema validation fails', async () => {
    await validateCreateWorkOrderType({}, 'tenant-1');
    expect(repo.findActiveByName).not.toHaveBeenCalled();
    expect(repo.findActiveByCode).not.toHaveBeenCalled();
  });

  it('should return conflict when active work order type name already exists for tenant', async () => {
    repo.findActiveByName.mockResolvedValue(existing);
    const result = await validateCreateWorkOrderType(
      { name: 'Good', code: 'GD', color: '#16A34A' },
      'tenant-1'
    );
    expect(result).toMatchObject({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ["Work order type name 'Good' already exists."],
    });
  });

  it('should return conflict when active work order type code already exists for tenant', async () => {
    repo.findActiveByCode.mockResolvedValue(existing);
    const result = await validateCreateWorkOrderType(
      { name: 'Good', code: 'GD', color: '#16A34A' },
      'tenant-1'
    );
    expect(result).toMatchObject({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ["Work order type code 'GD' already exists."],
    });
  });

  it('should return all duplicate errors when both name and code already exist', async () => {
    repo.findActiveByName.mockResolvedValue(existing);
    repo.findActiveByCode.mockResolvedValue(existing);
    const result = await validateCreateWorkOrderType(
      { name: 'Good', code: 'GD', color: '#16A34A' },
      'tenant-1'
    );
    expect(result).toMatchObject({
      success: false,
      errors: [
        "Work order type name 'Good' already exists.",
        "Work order type code 'GD' already exists.",
      ],
    });
  });

  it('should pass exclude id during update uniqueness checks', async () => {
    await validateUpdateWorkOrderType(
      '7',
      { name: 'Worn', code: 'wr', color: '#16A34A' },
      'tenant-1'
    );
    expect(repo.findActiveByName).toHaveBeenCalledWith('tenant-1', 'Worn', { excludeId: 7 });
    expect(repo.findActiveByCode).toHaveBeenCalledWith('tenant-1', 'WR', { excludeId: 7 });
  });

  it('should return invalid id error from update validator when id cannot be parsed', async () => {
    const result = await validateUpdateWorkOrderType(
      'abc',
      { name: 'Worn', code: 'WR', color: '#16A34A' },
      'tenant-1'
    );
    expect(result).toMatchObject({
      success: false,
      errors: expect.arrayContaining(['Work order type abc is Invalid.']),
    });
  });

  it('should return not found from update validator when entity does not exist', async () => {
    repo.getWorkOrderTypeById.mockResolvedValue(undefined);
    const result = await validateUpdateWorkOrderType(
      '1',
      { name: 'Worn', code: 'WR', color: '#16A34A' },
      'tenant-1'
    );
    expect(result).toMatchObject({ success: false, status: StatusCodes.NOT_FOUND });
  });

  it('should return parsed/transformed data on create success', async () => {
    await expect(
      validateCreateWorkOrderType({ name: ' Worn ', code: 'wr', color: '#16A34A' }, 'tenant-1')
    ).resolves.toEqual({ success: true, data: { name: 'Worn', code: 'WR', color: '#16A34A' } });
  });

  it('should preserve validator status on failure', async () => {
    repo.findActiveByCode.mockResolvedValue(existing);
    const result = await validateCreateWorkOrderType(
      { name: 'Worn', code: 'WR', color: '#16A34A' },
      'tenant-1'
    );
    expect(result).toMatchObject({ status: StatusCodes.CONFLICT });
  });

  it('should validate delete inputs and reject invalid id', async () => {
    const usage = { isTypeInUse: vi.fn().mockResolvedValue(false) };
    await expect(validateDeleteWorkOrderType('1', 'tenant-1', usage)).resolves.toEqual({
      success: true,
      data: { id: 1, tenantId: 'tenant-1' },
    });
    await expect(validateDeleteWorkOrderType('abc', 'tenant-1', usage)).resolves.toMatchObject({
      success: false,
      errors: ['Work order type abc is Invalid.'],
    });
    expect(usage.isTypeInUse).not.toHaveBeenCalledWith('abc', 'tenant-1');
  });

  it('should return conflict from delete validator when type is in use', async () => {
    const usage = { isTypeInUse: vi.fn().mockResolvedValue(true) };
    await expect(validateDeleteWorkOrderType('1', 'tenant-1', usage)).resolves.toMatchObject({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['Work order type cannot be deleted while it is in use.'],
    });
  });

  it('should validate get-by-id inputs and reject empty tenant', () => {
    expect(validateGetWorkOrderTypeById('1', 'tenant-1')).toEqual({
      success: true,
      data: { id: 1, tenantId: 'tenant-1' },
    });
    expect(validateGetWorkOrderTypeById('1', '  ')).toMatchObject({ success: false });
  });

  it('should validate list tenant input', () => {
    expect(validateGetWorkOrderTypes('tenant-1')).toEqual({ success: true, data: 'tenant-1' });
    expect(validateGetWorkOrderTypes('  ')).toMatchObject({
      success: false,
      errors: ['Tenant ID cannot be empty'],
    });
  });
});
