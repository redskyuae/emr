import { describe, expect, it } from 'vitest';

import { addPlanSessionsFormSchema } from './add-plan-sessions-form-schema';

function errorFor(sessions: string) {
  const result = addPlanSessionsFormSchema.safeParse({ sessions });
  return result.success ? undefined : result.error.issues[0]?.message;
}

describe('Add Plan Sessions form schema', () => {
  it('should trim the count and turn it into a number', () => {
    expect(addPlanSessionsFormSchema.parse({ sessions: ' 3 ' })).toEqual({ sessions: 3 });
  });

  it('should accept the 1 and 100 Session limits', () => {
    expect(addPlanSessionsFormSchema.parse({ sessions: '1' })).toEqual({ sessions: 1 });
    expect(addPlanSessionsFormSchema.parse({ sessions: '100' })).toEqual({ sessions: 100 });
  });

  it('should require a count', () => {
    expect(errorFor('  ')).toBe('Sessions is required');
  });

  it.each(['0', '-1', '1.5', 'two'])('should reject %s as not a positive integer', (value) => {
    expect(errorFor(value)).toBe('Sessions must be a positive integer');
  });

  it('should reject more than 100 Sessions', () => {
    expect(errorFor('101')).toBe('Sessions must be at most 100');
  });
});
