import { beforeEach, describe, expect, it, vi } from 'vitest';

import { seedDefaultClinicalMastersCommand } from './seed-default-clinical-masters-command';

describe('SeedDefaultClinicalMasters command', () => {
  const seedDiagnosisCodes = vi.fn();
  const seedAllergens = vi.fn();
  const seedClinicalNoteTypes = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    seedDiagnosisCodes.mockResolvedValue(undefined);
    seedAllergens.mockResolvedValue(undefined);
    seedClinicalNoteTypes.mockResolvedValue(undefined);
  });

  it('should seed all three clinical master families for the validated tenant', async () => {
    const result = await seedDefaultClinicalMastersCommand(
      ' tenant-a ',
      seedDiagnosisCodes,
      seedAllergens,
      seedClinicalNoteTypes
    );

    expect(result).toEqual({ success: true, data: undefined });
    expect(seedDiagnosisCodes).toHaveBeenCalledWith(
      'tenant-a',
      expect.arrayContaining([{ code: 'I10', title: expect.any(String), category: 'Circulatory' }])
    );
    expect(seedAllergens).toHaveBeenCalledWith(
      'tenant-a',
      expect.arrayContaining([{ name: 'Penicillin', code: 'PCN', category: 'drug' }])
    );
    expect(seedClinicalNoteTypes).toHaveBeenCalledWith(
      'tenant-a',
      expect.arrayContaining([
        { name: 'Progress Note', code: 'PROG', description: expect.any(String) },
      ])
    );
  });

  it('should reject an invalid tenant before seeding', async () => {
    const result = await seedDefaultClinicalMastersCommand(
      '   ',
      seedDiagnosisCodes,
      seedAllergens,
      seedClinicalNoteTypes
    );

    expect(result).toEqual({ success: false, errors: ['Tenant ID is required'] });
    expect(seedDiagnosisCodes).not.toHaveBeenCalled();
    expect(seedAllergens).not.toHaveBeenCalled();
    expect(seedClinicalNoteTypes).not.toHaveBeenCalled();
  });

  it('should return a clean failure when seeding rejects', async () => {
    seedAllergens.mockRejectedValue(new Error('Allergen insert failed'));

    const result = await seedDefaultClinicalMastersCommand(
      'tenant-a',
      seedDiagnosisCodes,
      seedAllergens,
      seedClinicalNoteTypes
    );

    expect(result).toEqual({
      success: false,
      errors: ['Failed to seed default clinical masters.'],
    });
  });
});
