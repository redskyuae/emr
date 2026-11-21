import { describe, expect, it } from 'vitest';

import { consultationSteps, filledFieldCount, stepForField } from './consultation-steps';

describe('consultationSteps', () => {
  it('should follow the SOAP order and end on review', () => {
    expect(consultationSteps(false).map(({ id }) => id)).toEqual([
      'subjective',
      'objective',
      'assessment',
      'plan',
      'review',
    ]);
  });

  it('should add the Ayurvedic fields only on Ayurveda deployments', () => {
    const general = consultationSteps(false).flatMap((step) => step.fields);
    const ayurveda = consultationSteps(true).flatMap((step) => step.fields);

    expect(general).not.toContain('prakriti');
    expect(ayurveda).toEqual(expect.arrayContaining(['prakriti', 'vikriti', 'ayurvedicDiagnosis']));
  });

  it('should cover every narrative field of the consultation exactly once', () => {
    const fields = consultationSteps(true).flatMap((step) => step.fields);

    // The coded diagnoses live in Visit Diagnoses, not in a consultation field.
    expect(fields).not.toContain('modernDiagnosis');
    expect(fields).toHaveLength(10);
    expect(new Set(fields).size).toBe(10);
  });

  it('should name the assessment step Diagnosis', () => {
    expect(consultationSteps(false).find((step) => step.id === 'assessment')?.title).toBe(
      'Diagnosis'
    );
  });
});

describe('stepForField', () => {
  const steps = consultationSteps(true);

  it('should find the step that holds a field', () => {
    expect(stepForField('ayurvedicDiagnosis', consultationSteps(true))).toBe('assessment');
    expect(stepForField('prakriti', steps)).toBe('objective');
  });

  it('should send a missing note type to the first step', () => {
    expect(stepForField('noteTypeId', steps)).toBe('subjective');
  });

  it('should return undefined for an error that belongs to no field', () => {
    expect(stepForField('root', steps)).toBeUndefined();
  });
});

describe('filledFieldCount', () => {
  const [subjective] = consultationSteps(false);

  it('should count only fields with text', () => {
    expect(filledFieldCount(subjective, { chiefComplaint: 'Cough', hpi: '   ' })).toBe(1);
  });

  it('should treat missing values as empty', () => {
    expect(filledFieldCount(subjective, {})).toBe(0);
  });
});
