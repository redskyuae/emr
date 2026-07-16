import type { Mock } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { patientProblemRepository } from '../repository/patient-problem-repository';
import { getPatientProblemsQuery } from './get-patient-problems-query';
import { getPatientProblemByIdQuery } from './get-patient-problem-by-id-query';

vi.mock('../repository/patient-problem-repository', () => ({
  patientProblemRepository: {
    getPatientProblems: vi.fn(),
    getPatientProblemById: vi.fn(),
  },
}));

const repo = patientProblemRepository as typeof patientProblemRepository & {
  getPatientProblems: Mock<typeof patientProblemRepository.getPatientProblems>;
  getPatientProblemById: Mock<typeof patientProblemRepository.getPatientProblemById>;
};
const problem = { id: 9, patientId: 1 } as never;

describe('PatientProblem queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repo.getPatientProblems.mockResolvedValue({ data: [problem], total: 1 });
    repo.getPatientProblemById.mockResolvedValue(problem);
  });

  it('should not call repository when list validation fails', async () => {
    await expect(
      getPatientProblemsQuery({ patientId: 'abc', tenantId: 'tenant-1' })
    ).resolves.toMatchObject({ success: false });
    expect(repo.getPatientProblems).not.toHaveBeenCalled();
  });

  it('should return the problem list', async () => {
    await expect(
      getPatientProblemsQuery({ patientId: '1', tenantId: 'tenant-1' })
    ).resolves.toEqual({ success: true, data: [problem], total: 1 });
  });

  it('should return a single problem', async () => {
    await expect(getPatientProblemByIdQuery('9', 'tenant-1')).resolves.toEqual({
      success: true,
      data: problem,
    });
  });

  it('should return not-found when the problem is missing', async () => {
    repo.getPatientProblemById.mockResolvedValue(undefined);
    await expect(getPatientProblemByIdQuery('9', 'tenant-1')).resolves.toMatchObject({
      success: false,
      status: 404,
    });
  });
});
