import { describe, expect, it } from 'vitest';

import { ayurvedaDiagnosisCodeFormSchema } from './ayurveda-diagnosis-code-form-schema';

const errorsOf = (input: unknown) =>
  ayurvedaDiagnosisCodeFormSchema.safeParse(input).error?.issues.map(({ message }) => message) ??
  [];

describe('Ayurveda Diagnosis Code form schema', () => {
  it('should require a code and title', () => {
    expect(errorsOf({ code: ' ', title: ' ', category: '' })).toEqual([
      'Code is required.',
      'Title is required.',
    ]);
  });

  it('should trim values and uppercase the code', () => {
    expect(
      ayurvedaDiagnosisCodeFormSchema.parse({
        code: ' ayu-jvara ',
        title: ' Jvara (Fever) ',
        category: ' General ',
      })
    ).toEqual({ code: 'AYU-JVARA', title: 'Jvara (Fever)', category: 'General' });
  });

  it('should accept a 20-character code and reject a longer one', () => {
    expect(errorsOf({ code: 'A'.repeat(20), title: 'Jvara', category: '' })).toEqual([]);
    expect(errorsOf({ code: 'A'.repeat(21), title: 'Jvara', category: '' })).toEqual([
      'Code must be at most 20 characters.',
    ]);
  });
});
