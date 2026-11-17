import { describe, expect, it } from 'vitest';

import { visitTypeRequiresDoctor } from './visit-doctor-requirement';

describe('Visit Doctor requirement', () => {
  it('should require a Doctor for an OPD Consultation regardless of case or padding', () => {
    expect(visitTypeRequiresDoctor('OPD')).toBe(true);
    expect(visitTypeRequiresDoctor('opd')).toBe(true);
    expect(visitTypeRequiresDoctor(' OPD ')).toBe(true);
  });

  it.each(['FUP', 'PROC', 'VAC', 'EMER', 'OPD2', ''])(
    'should not require a Doctor for Visit Type %s',
    (code) => {
      expect(visitTypeRequiresDoctor(code)).toBe(false);
    }
  );

  it('should not require a Doctor when no Visit Type is chosen yet', () => {
    expect(visitTypeRequiresDoctor(null)).toBe(false);
    expect(visitTypeRequiresDoctor(undefined)).toBe(false);
  });
});
