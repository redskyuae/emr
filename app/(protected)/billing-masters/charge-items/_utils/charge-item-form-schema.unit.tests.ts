import { describe, expect, it } from 'vitest';

import { chargeItemFormSchema } from './charge-item-form-schema';

const base = {
  name: 'General Consultation',
  code: 'cons_est',
  codeType: 'LOCAL' as const,
  category: 'CONSULTATION' as const,
  unitPrice: '500',
  cashPrice: '',
  insuranceContractPrice: '',
  effectiveDate: '',
  freeFollowUpEligible: false,
  visitChargeKind: '' as const,
  description: '',
  isActive: true,
};

function codeErrors(values: Record<string, unknown>) {
  const result = chargeItemFormSchema.safeParse(values);
  return result.success
    ? []
    : result.error.issues.filter(({ path }) => path[0] === 'code').map(({ message }) => message);
}

const CPT_MESSAGE = 'Charge item code must be a valid 5-character CPT code, e.g. 99213.';
const HCPCS_MESSAGE = 'Charge item code must be a valid HCPCS code, e.g. J1100.';

describe('chargeItemFormSchema code type', () => {
  it('should keep the code type and uppercase a Local code', () => {
    const result = chargeItemFormSchema.parse(base);

    expect(result.codeType).toBe('LOCAL');
    expect(result.code).toBe('CONS_EST');
  });

  it('should require one of the known code types', () => {
    expect(chargeItemFormSchema.safeParse({ ...base, codeType: 'ICD' }).success).toBe(false);
  });

  it('should accept 5-character CPT codes, including Category II and III codes', () => {
    for (const code of ['99213', '0001U', '3074f', '0042T']) {
      expect(codeErrors({ ...base, codeType: 'CPT', code })).toEqual([]);
    }
  });

  it('should reject a CPT code that is not 5 characters in the CPT shape', () => {
    for (const code of ['9921', '992134', 'J1100', '9921X', 'CONS_EST']) {
      expect(codeErrors({ ...base, codeType: 'CPT', code })).toEqual([CPT_MESSAGE]);
    }
  });

  it('should accept HCPCS Level II codes and reject other shapes', () => {
    expect(codeErrors({ ...base, codeType: 'HCPCS', code: 'j1100' })).toEqual([]);
    for (const code of ['99213', 'W1100', 'J110', 'J11000']) {
      expect(codeErrors({ ...base, codeType: 'HCPCS', code })).toEqual([HCPCS_MESSAGE]);
    }
  });

  it('should keep the general code rule for UAE service and Local codes', () => {
    expect(codeErrors({ ...base, codeType: 'SERVICE', code: '17-01' })).toEqual([]);
    expect(codeErrors({ ...base, codeType: 'LOCAL', code: '99213' })).toEqual([]);
    expect(codeErrors({ ...base, codeType: 'SERVICE', code: '17.01' })).toEqual([
      'Code must contain only letters, numbers, hyphens, and underscores.',
    ]);
  });

  it('should report a CPT mismatch even while other fields are still invalid', () => {
    expect(codeErrors({ ...base, name: '', unitPrice: '', codeType: 'CPT', code: '123' })).toEqual([
      CPT_MESSAGE,
    ]);
  });

  it('should not add the CPT message on top of a general code error', () => {
    const errors = codeErrors({ ...base, codeType: 'CPT', code: '' });

    expect(errors).toContain('Code is required.');
    expect(errors).not.toContain(CPT_MESSAGE);
  });
});
