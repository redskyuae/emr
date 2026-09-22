import { describe, expect, it } from 'vitest';

import { createTherapistSkillSchema, therapistSkillListParamsSchema, updateTherapistSkillSchema } from './therapist-skill-schema';

describe('Therapist skill schema', () => {
  it('trims names and codes', () => {
    expect(createTherapistSkillSchema.parse({ name: ' Abhyanga ', code: ' ab ' })).toEqual({ name: 'Abhyanga', code: 'AB' });
  });

  it('turns blank optional fields into undefined/null', () => {
    expect(updateTherapistSkillSchema.parse({ name: 'Abhyanga', description: '' })).toEqual({ name: 'Abhyanga', description: undefined });
  });

  it('parses tenant list parameters', () => {
    expect(therapistSkillListParamsSchema.parse({ tenantId: ' tenant-1 ', query: ' oil ' })).toMatchObject({ tenantId: 'tenant-1', query: 'oil' });
  });
});
