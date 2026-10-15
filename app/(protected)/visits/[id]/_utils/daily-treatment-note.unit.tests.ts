import { describe, expect, it } from 'vitest';

import { dailyTreatmentFormSchema, dailyTreatmentToSoap } from './daily-treatment-note';

describe('daily Treatment Session note', () => {
  it('requires a response and bounds actual duration and pain score', () => {
    expect(
      dailyTreatmentFormSchema.safeParse({
        actualMinutes: '45',
        response: 'Improved',
        painScore: '4',
        variations: '',
        adverseEvents: '',
      }).success
    ).toBe(true);
    expect(
      dailyTreatmentFormSchema.safeParse({
        actualMinutes: '481',
        response: '',
        painScore: '11',
        variations: '',
        adverseEvents: '',
      }).success
    ).toBe(false);
  });

  it('preserves Session identity and response in SOAP content', () => {
    expect(
      dailyTreatmentToSoap(
        {
          actualMinutes: '45',
          response: 'Improved',
          painScore: '4',
          variations: '',
          adverseEvents: 'None',
        },
        { label: 'Day 1', procedure: 'Abhyanga', sessionNumber: 1 }
      )
    ).toEqual({
      subjective: 'Treatment response: Improved\nPain score: 4/10',
      objective: 'Session 1: Day 1 · Abhyanga\nActual duration: 45 minutes\nAdverse events: None',
    });
  });
});
