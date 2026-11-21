import { describe, expect, it } from 'vitest';

import { patientEditFormMode } from './patient-form-analytics';

describe('patientEditFormMode', () => {
  it('should treat editing a Provisional Patient as completing their registration', () => {
    expect(patientEditFormMode('provisional')).toBe('complete_provisional');
  });

  it('should treat editing a Registered Patient as an edit', () => {
    expect(patientEditFormMode('registered')).toBe('edit');
  });
});
