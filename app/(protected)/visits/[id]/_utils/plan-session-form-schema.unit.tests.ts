import { describe, expect, it } from 'vitest';

import type { PatientTreatmentPlanReadSession } from '@/app/api/lib/modules/patient-treatment-plan/schemas/patient-treatment-plan-schema';

import {
  planSessionFormSchema,
  planSessionFormValues,
  planSessionUpdateRequest,
} from './plan-session-form-schema';

const session = {
  procedure: 'Abhyanga',
  warning: null,
  roomType: 'Panchakarma room',
  equipment: null,
  preparation: 'Warm the oil.',
  setupMinutes: 0,
  therapistSkill: null,
  durationMinutes: 45,
  cleaningMinutes: null,
} as PatientTreatmentPlanReadSession;

const values = planSessionFormValues(session);

describe('plan Session form schema', () => {
  it('should map a Session plan to text form values', () => {
    expect(values).toEqual({
      procedure: 'Abhyanga',
      warning: '',
      roomType: 'Panchakarma room',
      equipment: '',
      preparation: 'Warm the oil.',
      setupMinutes: '0',
      therapistSkill: '',
      durationMinutes: '45',
      cleaningMinutes: '',
    });
  });

  it('should require a Procedure', () => {
    const result = planSessionFormSchema.safeParse({ ...values, procedure: '   ' });

    expect(result.error?.issues.map((issue) => issue.message)).toEqual([
      'Procedure cannot be empty.',
    ]);
  });

  it('should keep durations whole minutes within their bounds', () => {
    const messages = (patch: Partial<typeof values>) =>
      planSessionFormSchema
        .safeParse({ ...values, ...patch })
        .error?.issues.map((issue) => issue.message);

    expect(messages({ durationMinutes: '0' })).toEqual([
      'Duration must be between 1 and 480 minutes.',
    ]);
    expect(messages({ setupMinutes: '481' })).toEqual([
      'Setup time must be between 0 and 480 minutes.',
    ]);
    expect(messages({ cleaningMinutes: '2.5' })).toEqual([
      'Cleaning time must be between 0 and 480 minutes.',
    ]);
    expect(messages({ durationMinutes: '', setupMinutes: '0' })).toBeUndefined();
  });

  it('should build an update request that clears empty durations', () => {
    expect(
      planSessionUpdateRequest(planSessionFormSchema.parse({ ...values, warning: ' Knee ' }))
    ).toEqual({
      procedure: 'Abhyanga',
      warning: 'Knee',
      roomType: 'Panchakarma room',
      equipment: '',
      preparation: 'Warm the oil.',
      setupMinutes: 0,
      therapistSkill: '',
      durationMinutes: 45,
      cleaningMinutes: null,
    });
  });
});
