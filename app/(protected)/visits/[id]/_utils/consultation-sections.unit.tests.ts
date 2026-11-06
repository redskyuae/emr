import { describe, expect, it } from 'vitest';

import { consultationSections, filledFieldCount } from './consultation-sections';

describe('consultationSections', () => {
  it('should include the Ayurvedic assessment on Ayurveda deployments', () => {
    expect(consultationSections(true).map(({ id }) => id)).toContain('consult-ayurveda');
  });

  it('should leave the Ayurvedic assessment out of the general EMR', () => {
    expect(consultationSections(false).map(({ id }) => id)).toEqual([
      'consult-presenting',
      'consult-history',
      'consult-examination',
      'consult-plan',
    ]);
  });

  it('should cover every field of the consultation exactly once', () => {
    const fields = consultationSections(true).flatMap((section) => section.fields);

    expect(fields).toHaveLength(11);
    expect(new Set(fields).size).toBe(11);
  });
});

describe('filledFieldCount', () => {
  const [presenting] = consultationSections(false);

  it('should count only fields with text', () => {
    expect(filledFieldCount(presenting, { chiefComplaint: 'Cough', hpi: '   ' })).toBe(1);
  });

  it('should treat missing values as empty', () => {
    expect(filledFieldCount(presenting, {})).toBe(0);
  });
});
