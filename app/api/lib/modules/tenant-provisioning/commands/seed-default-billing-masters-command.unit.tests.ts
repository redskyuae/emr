import { beforeEach, describe, expect, it, vi } from 'vitest';

import { seedDefaultBillingMastersCommand } from './seed-default-billing-masters-command';

describe('SeedDefaultBillingMasters command', () => {
  const seedChargeItems = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    seedChargeItems.mockResolvedValue(undefined);
  });

  it('should seed four workflow Charge Items with the starter AED rates', async () => {
    const result = await seedDefaultBillingMastersCommand(' tenant-a ', seedChargeItems);

    expect(result).toEqual({ success: true, data: undefined });
    expect(seedChargeItems).toHaveBeenCalledWith('tenant-a', [
      expect.objectContaining({ code: 'CONS_NEW', unitPrice: 200 }),
      expect.objectContaining({ code: 'CONS_EST', unitPrice: 150 }),
      expect.objectContaining({
        code: 'CONS_FUP',
        unitPrice: 150,
        freeFollowUpEligible: true,
      }),
      expect.objectContaining({ code: 'TREAT_SESSION', unitPrice: 250 }),
    ]);
  });

  it('should reject an invalid Tenant ID before writing', async () => {
    await expect(seedDefaultBillingMastersCommand(' ', seedChargeItems)).resolves.toEqual({
      success: false,
      errors: ['Tenant ID is required'],
    });
    expect(seedChargeItems).not.toHaveBeenCalled();
  });

  it('should return a clean failure when the repository rejects', async () => {
    seedChargeItems.mockRejectedValue(new Error('database unavailable'));
    await expect(seedDefaultBillingMastersCommand('tenant-a', seedChargeItems)).resolves.toEqual({
      success: false,
      errors: ['Failed to seed default billing masters.'],
    });
  });
});
