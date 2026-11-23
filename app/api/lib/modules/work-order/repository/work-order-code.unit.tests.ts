import { describe, expect, it } from 'vitest';

import { formatWorkOrderCode } from './work-order-code';

describe('formatWorkOrderCode', () => {
  it('should pad a short Tenant sequence to four digits', () => {
    expect(formatWorkOrderCode(1)).toBe('WO-0001');
    expect(formatWorkOrderCode(42)).toBe('WO-0042');
  });

  it('should keep a four-digit sequence as it is', () => {
    expect(formatWorkOrderCode(1001)).toBe('WO-1001');
  });

  it('should not truncate a sequence longer than four digits', () => {
    expect(formatWorkOrderCode(10000)).toBe('WO-10000');
  });
});
