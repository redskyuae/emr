import type { Mock } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { clinicalNoteRepository } from '../repository/clinical-note-repository';
import { getClinicalNotesQuery } from './get-clinical-notes-query';
import { getClinicalNoteByIdQuery } from './get-clinical-note-by-id-query';

vi.mock('../repository/clinical-note-repository', () => ({
  clinicalNoteRepository: {
    getClinicalNotes: vi.fn(),
    getClinicalNoteById: vi.fn(),
  },
}));

const repo = clinicalNoteRepository as typeof clinicalNoteRepository & {
  getClinicalNotes: Mock<typeof clinicalNoteRepository.getClinicalNotes>;
  getClinicalNoteById: Mock<typeof clinicalNoteRepository.getClinicalNoteById>;
};
const note = { id: 4, patientId: 1 } as never;

describe('ClinicalNote queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repo.getClinicalNotes.mockResolvedValue({ data: [note], total: 1 });
    repo.getClinicalNoteById.mockResolvedValue(note);
  });

  it('should not call repository when list validation fails', async () => {
    await expect(
      getClinicalNotesQuery({ patientId: 'abc', tenantId: 'tenant-1' })
    ).resolves.toMatchObject({ success: false });
    expect(repo.getClinicalNotes).not.toHaveBeenCalled();
  });

  it('should return the clinical note list', async () => {
    await expect(getClinicalNotesQuery({ patientId: '1', tenantId: 'tenant-1' })).resolves.toEqual({
      success: true,
      data: [note],
      total: 1,
    });
  });

  it('should return a single clinical note', async () => {
    await expect(getClinicalNoteByIdQuery('4', 'tenant-1')).resolves.toEqual({
      success: true,
      data: note,
    });
  });

  it('should return not-found when the note is missing', async () => {
    repo.getClinicalNoteById.mockResolvedValue(undefined);
    await expect(getClinicalNoteByIdQuery('4', 'tenant-1')).resolves.toMatchObject({
      success: false,
      status: 404,
    });
  });
});
