import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { appointmentCancelledReasonRepository } from '../repository/appointment-cancelled-reason-repository';
import { validateCreateAppointmentCancelledReason } from './create-appointment-cancelled-reason-validator';
import { validateDeleteAppointmentCancelledReason } from './delete-appointment-cancelled-reason-validator';
import { validateGetAppointmentCancelledReasonById } from './get-appointment-cancelled-reason-by-id-validator';
import { validateGetAppointmentCancelledReasons } from './get-appointment-cancelled-reasons-validator';
import { validateUpdateAppointmentCancelledReason } from './update-appointment-cancelled-reason-validator';

vi.mock('../repository/appointment-cancelled-reason-repository', () => ({
  appointmentCancelledReasonRepository: {
    findActiveByName: vi.fn(),
    findActiveByCode: vi.fn(),
    getAppointmentCancelledReasonById: vi.fn(),
  },
}));

const repo = vi.mocked(appointmentCancelledReasonRepository);
const existing = {
  id: 1,
  tenantId: 'tenant-1',
  name: 'Cancelled',
  code: 'CX',
  description: null,
  createdOn: new Date(),
  modifiedOn: new Date(),
};

describe('AppointmentCancelledReason validators', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repo.findActiveByName.mockResolvedValue(undefined);
    repo.findActiveByCode.mockResolvedValue(undefined);
    repo.getAppointmentCancelledReasonById.mockResolvedValue(existing);
  });

  it('should return schema validation errors when payload is invalid', async () => {
    const result = await validateCreateAppointmentCancelledReason({}, 'tenant-1');
    expect(result).toMatchObject({
      success: false,
      errors: expect.arrayContaining(['Appointment cancelled reason name is required']),
    });
  });

  it('should not call uniqueness repository checks when schema validation fails', async () => {
    await validateCreateAppointmentCancelledReason({}, 'tenant-1');
    expect(repo.findActiveByName).not.toHaveBeenCalled();
    expect(repo.findActiveByCode).not.toHaveBeenCalled();
  });

  it('should return conflict when active appointment cancelled reason name already exists for tenant', async () => {
    repo.findActiveByName.mockResolvedValue(existing);
    const result = await validateCreateAppointmentCancelledReason(
      { name: 'Cancelled', code: 'CX' },
      'tenant-1'
    );
    expect(result).toMatchObject({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ["Appointment cancelled reason name 'Cancelled' already exists."],
    });
  });

  it('should return conflict when active appointment cancelled reason code already exists for tenant', async () => {
    repo.findActiveByCode.mockResolvedValue(existing);
    const result = await validateCreateAppointmentCancelledReason(
      { name: 'Cancelled', code: 'CX' },
      'tenant-1'
    );
    expect(result).toMatchObject({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ["Appointment cancelled reason code 'CX' already exists."],
    });
  });

  it('should return all duplicate errors when both name and code already exist', async () => {
    repo.findActiveByName.mockResolvedValue(existing);
    repo.findActiveByCode.mockResolvedValue(existing);
    const result = await validateCreateAppointmentCancelledReason(
      { name: 'Cancelled', code: 'CX' },
      'tenant-1'
    );
    expect(result).toMatchObject({
      success: false,
      errors: [
        "Appointment cancelled reason name 'Cancelled' already exists.",
        "Appointment cancelled reason code 'CX' already exists.",
      ],
    });
  });

  it('should pass exclude id during update uniqueness checks', async () => {
    await validateUpdateAppointmentCancelledReason(
      '7',
      { name: 'No Show', code: 'ns' },
      'tenant-1'
    );
    expect(repo.findActiveByName).toHaveBeenCalledWith('tenant-1', 'No Show', { excludeId: 7 });
    expect(repo.findActiveByCode).toHaveBeenCalledWith('tenant-1', 'NS', { excludeId: 7 });
  });

  it('should return not-found or validation error when requested id is invalid/missing according to existing validator behavior', async () => {
    expect(validateGetAppointmentCancelledReasonById('abc', 'tenant-1')).toMatchObject({
      success: false,
      errors: ['Appointment cancelled reason abc is Invalid.'],
    });
    repo.getAppointmentCancelledReasonById.mockResolvedValue(undefined);
    await expect(
      validateUpdateAppointmentCancelledReason('1', { name: 'No Show', code: 'NS' }, 'tenant-1')
    ).resolves.toMatchObject({ success: false, status: StatusCodes.NOT_FOUND });
  });

  it('should return parsed/transformed data on success', async () => {
    await expect(
      validateCreateAppointmentCancelledReason({ name: ' No Show ', code: 'ns' }, 'tenant-1')
    ).resolves.toEqual({ success: true, data: { name: 'No Show', code: 'NS' } });
  });

  it('should preserve validator status on failure', async () => {
    repo.findActiveByCode.mockResolvedValue(existing);
    const result = await validateCreateAppointmentCancelledReason(
      { name: 'No Show', code: 'NS' },
      'tenant-1'
    );
    expect(result).toMatchObject({ status: StatusCodes.CONFLICT });
  });

  it('should validate delete and list tenant inputs', () => {
    expect(validateDeleteAppointmentCancelledReason('1', 'tenant-1')).toEqual({
      success: true,
      data: { id: 1, tenantId: 'tenant-1' },
    });
    expect(validateGetAppointmentCancelledReasons('  ')).toMatchObject({ success: false });
  });
});
