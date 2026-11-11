import { describe, expect, it } from 'vitest';

import { visitNoteFormSchema } from './visit-capture-form-schema';

describe('Visit note form', () => {
  const note = {
    noteTypeId: '5',
    subjective: 'Reports pain',
    objective: '',
    assessment: '',
    plan: '',
  };

  it('should accept a section at the API limit', () => {
    const result = visitNoteFormSchema.safeParse({ ...note, plan: 'a'.repeat(20000) });

    expect(result.success).toBe(true);
  });

  it('should reject a section over the API limit', () => {
    const result = visitNoteFormSchema.safeParse({ ...note, plan: 'a'.repeat(20001) });

    expect(result.error?.issues[0]).toMatchObject({
      path: ['plan'],
      message: 'Plan must be at most 20000 characters.',
    });
  });
});
