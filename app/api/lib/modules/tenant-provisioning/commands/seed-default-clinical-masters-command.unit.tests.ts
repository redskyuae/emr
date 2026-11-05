import { beforeEach, describe, expect, it, vi } from 'vitest';

import { seedDefaultClinicalMastersCommand } from './seed-default-clinical-masters-command';

describe('SeedDefaultClinicalMasters command', () => {
  const seedDiagnosisCodes = vi.fn();
  const seedAllergens = vi.fn();
  const seedClinicalNoteTypes = vi.fn();
  const seedAyurvedaDiagnosisCodes = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    seedDiagnosisCodes.mockResolvedValue(undefined);
    seedAllergens.mockResolvedValue(undefined);
    seedClinicalNoteTypes.mockResolvedValue(undefined);
    seedAyurvedaDiagnosisCodes.mockResolvedValue(undefined);
  });

  it('should seed all clinical master families for the validated tenant', async () => {
    const result = await seedDefaultClinicalMastersCommand(
      ' tenant-a ',
      seedDiagnosisCodes,
      seedAllergens,
      seedClinicalNoteTypes,
      seedAyurvedaDiagnosisCodes
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
    expect(seedAyurvedaDiagnosisCodes).toHaveBeenCalledWith(
      'tenant-a',
      expect.arrayContaining([{ code: 'AYU-JVARA', title: 'Jvara (Fever)', category: 'General' }])
    );
  });

  it('should reject an invalid tenant before seeding', async () => {
    const result = await seedDefaultClinicalMastersCommand(
      '   ',
      seedDiagnosisCodes,
      seedAllergens,
      seedClinicalNoteTypes,
      seedAyurvedaDiagnosisCodes
    );

    expect(result).toEqual({ success: false, errors: ['Tenant ID is required'] });
    expect(seedDiagnosisCodes).not.toHaveBeenCalled();
    expect(seedAllergens).not.toHaveBeenCalled();
    expect(seedClinicalNoteTypes).not.toHaveBeenCalled();
    expect(seedAyurvedaDiagnosisCodes).not.toHaveBeenCalled();
  });

  it('should return a clean failure when seeding rejects', async () => {
    seedAllergens.mockRejectedValue(new Error('Allergen insert failed'));

    const result = await seedDefaultClinicalMastersCommand(
      'tenant-a',
      seedDiagnosisCodes,
      seedAllergens,
      seedClinicalNoteTypes,
      seedAyurvedaDiagnosisCodes
    );

    expect(result).toEqual({
      success: false,
      errors: ['Failed to seed default clinical masters.'],
    });
  });
});
