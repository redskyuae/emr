import { describe, expect, it } from 'vitest';

import { getPaginationCorrection } from './appointment-pagination';

describe('Appointment pagination utilities', () => {
  it('should preserve a valid deep-linked page until metadata loads', () => {
    expect(
      getPaginationCorrection({
        pageParam: 2,
        normalizedPage: 2,
        totalPages: undefined,
        isPlaceholderData: false,
      })
    ).toBeUndefined();
  });

  it('should not clamp against placeholder metadata', () => {
    expect(
      getPaginationCorrection({
        pageParam: 3,
        normalizedPage: 3,
        totalPages: 1,
        isPlaceholderData: true,
      })
    ).toBeUndefined();
  });

  it('should normalize invalid pages and clamp pages after current metadata loads', () => {
    expect(
      getPaginationCorrection({
        pageParam: 0,
        normalizedPage: 1,
        totalPages: undefined,
        isPlaceholderData: false,
      })
    ).toBe(1);
    expect(
      getPaginationCorrection({
        pageParam: 4,
        normalizedPage: 4,
        totalPages: 2,
        isPlaceholderData: false,
      })
    ).toBe(2);
  });
});
