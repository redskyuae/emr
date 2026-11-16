import { describe, expect, it } from 'vitest';

import type { Visit } from '@/app/api/lib/modules/visit/schemas/visit-schema';
import {
  amendVisitFormDefaults,
  amendVisitFormSchema,
  toAmendVisitRequest,
  type AmendVisitFormValues,
} from './amend-visit-form-schema';

const values: AmendVisitFormValues = {
  doctorId: '3',
  visitTypeId: '2',
  admitSourceId: '',
  treatmentId: '',
  treatmentSessionId: '',
  chiefComplaint: 'Lower back pain',
  remarks: '',
};

const visit = {
  doctor: { id: 3, name: 'Dr. Anita Rao' },
  visitType: { id: 2, name: 'Consultation', code: 'CONS' },
  admitSource: { id: 7, name: 'Referral', code: 'REF' },
  treatment: { id: 11, name: 'Abhyanga', code: 'ABH' },
  treatmentSession: { id: 41, label: 'Session 2' },
  chiefComplaint: 'Lower back pain',
  remarks: null,
} as unknown as Visit;

describe('amendVisitFormSchema', () => {
  it('should accept a complete amendment', () => {
    expect(amendVisitFormSchema.safeParse(values).success).toBe(true);
  });

  it('should require a Doctor and a Visit Type', () => {
    const result = amendVisitFormSchema.safeParse({ ...values, doctorId: '', visitTypeId: '' });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.message)).toEqual([
      'Doctor is required.',
      'Visit type is required.',
    ]);
  });

  it('should require a Session when a Treatment is chosen', () => {
    const result = amendVisitFormSchema.safeParse({ ...values, treatmentId: '11' });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]).toMatchObject({
      path: ['treatmentSessionId'],
      message: 'Choose the Session for this Treatment.',
    });
  });

  it('should reject a chief complaint over 500 characters', () => {
    const result = amendVisitFormSchema.safeParse({ ...values, chiefComplaint: 'a'.repeat(501) });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('Chief complaint must be at most 500 characters.');
  });
});

describe('amendVisitFormDefaults', () => {
  it('should open the form on the Visit as recorded', () => {
    expect(amendVisitFormDefaults(visit)).toEqual({
      doctorId: '3',
      visitTypeId: '2',
      admitSourceId: '7',
      treatmentId: '11',
      treatmentSessionId: '41',
      chiefComplaint: 'Lower back pain',
      remarks: '',
    });
  });
});

describe('toAmendVisitRequest', () => {
  it('should send blank choices as null so they are cleared', () => {
    expect(toAmendVisitRequest(values)).toEqual({
      doctorId: 3,
      visitTypeId: 2,
      admitSourceId: null,
      treatmentId: null,
      treatmentSessionId: null,
      chiefComplaint: 'Lower back pain',
      remarks: null,
    });
  });

  it('should send the Treatment and Session together', () => {
    expect(
      toAmendVisitRequest({ ...values, treatmentId: '11', treatmentSessionId: '41' })
    ).toMatchObject({ treatmentId: 11, treatmentSessionId: 41 });
  });
});
