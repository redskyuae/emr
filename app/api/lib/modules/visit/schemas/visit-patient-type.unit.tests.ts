import { describe, expect, it } from 'vitest';

import { threeYearLookbackStart } from './visit-patient-type';

describe('threeYearLookbackStart', () => {
  it('uses the same calendar day three years earlier', () => {
    expect(threeYearLookbackStart('2026-10-19')).toBe('2023-10-19');
  });

  it('clamps leap day to February 28', () => {
    expect(threeYearLookbackStart('2024-02-29')).toBe('2021-02-28');
  });
});
