import { describe, expect, it } from 'vitest';

import { visitDoctorLabel } from './visit-doctor-label';

describe('visitDoctorLabel', () => {
  it("should show the Doctor's name when the Visit has a Doctor", () => {
    expect(visitDoctorLabel({ doctor: { name: 'Dr Iyer' } })).toBe('Dr Iyer');
  });

  it('should show No Doctor when the Visit has no Doctor', () => {
    expect(visitDoctorLabel({ doctor: null })).toBe('No Doctor');
  });
});
