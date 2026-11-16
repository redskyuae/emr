import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { visitRepository } from '../repository/visit-repository';
import type { Visit } from '../schemas/visit-schema';
import { validateAmendVisit } from '../validator/amend-visit-validator';
import { amendVisitCommand } from './amend-visit-command';

vi.mock('../repository/visit-repository', () => ({
  visitRepository: { amendVisit: vi.fn() },
}));
vi.mock('../validator/amend-visit-validator', () => ({ validateAmendVisit: vi.fn() }));

const repo = vi.mocked(visitRepository);
const validateAmend = vi.mocked(validateAmendVisit);

const amendedVisit = { id: 1, visitNumber: 'VST-1001', status: 'COMPLETED' } as Visit;
const payload = {
  doctorId: 3,
  visitTypeId: 2,
  remarks: undefined,
  treatmentId: null,
  admitSourceId: null,
  chiefComplaint: 'Fever for 3 days',
  treatmentSessionId: null,
};

describe('amendVisitCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateAmend.mockResolvedValue({ success: true, data: { id: 1, payload } });
    repo.amendVisit.mockResolvedValue(amendedVisit);
  });

  it('should validate first with the raw id, payload, and Tenant', async () => {
    await amendVisitCommand('1', 'tenant-1', { doctorId: 3 });

    expect(validateAmend).toHaveBeenCalledWith('1', { doctorId: 3 }, 'tenant-1');
  });

  it('should return the validation failure and not write', async () => {
    validateAmend.mockResolvedValue({
      success: false,
      errors: ['Visit VST-1001 is not completed and cannot be amended.'],
      status: StatusCodes.CONFLICT,
    });

    await expect(amendVisitCommand('1', 'tenant-1', {})).resolves.toEqual({
      success: false,
      errors: ['Visit VST-1001 is not completed and cannot be amended.'],
      status: StatusCodes.CONFLICT,
    });
    expect(repo.amendVisit).not.toHaveBeenCalled();
  });

  it('should amend the Visit with the validated payload and return it', async () => {
    await expect(amendVisitCommand('1', 'tenant-1', {})).resolves.toEqual({
      success: true,
      data: amendedVisit,
    });
    expect(repo.amendVisit).toHaveBeenCalledWith(1, 'tenant-1', payload);
  });

  it('should return not found when the Visit disappears before the write', async () => {
    repo.amendVisit.mockResolvedValue(undefined);

    await expect(amendVisitCommand('1', 'tenant-1', {})).resolves.toEqual({
      success: false,
      errors: ['Visit not found'],
      status: StatusCodes.NOT_FOUND,
    });
  });

  it('should rethrow unknown repository errors', async () => {
    const error = new Error('database down');
    repo.amendVisit.mockRejectedValue(error);

    await expect(amendVisitCommand('1', 'tenant-1', {})).rejects.toThrow(error);
  });
});
