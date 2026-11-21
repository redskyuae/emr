import { describe, expect, it } from 'vitest';

import type {
  PatientTreatmentPlan,
  PatientTreatmentPlanReadSession,
} from '@/app/api/lib/modules/patient-treatment-plan/schemas/patient-treatment-plan-schema';

import {
  isCurrentTreatmentPlan,
  nextPlanSession,
  orderTreatmentPlans,
  treatmentPlanStatusLabel,
} from './patient-treatment-history';

function session(overrides: Partial<PatientTreatmentPlanReadSession> = {}) {
  return {
    id: 1,
    sessionNumber: 1,
    label: null,
    startedVisitId: null,
    completionStatus: 'PENDING',
    reservedAppointment: null,
    ...overrides,
  } as PatientTreatmentPlanReadSession;
}

function plan(overrides: Partial<PatientTreatmentPlan> = {}) {
  return {
    id: 1,
    status: 'IN_PROGRESS',
    treatmentName: 'Panchakarma',
    totalSessions: 3,
    completedSessions: 1,
    sessions: [],
    ...overrides,
  } as PatientTreatmentPlan;
}

describe('Patient treatment history', () => {
  it('should treat Pending and In progress Plans as current', () => {
    expect(isCurrentTreatmentPlan({ status: 'PENDING' })).toBe(true);
    expect(isCurrentTreatmentPlan({ status: 'IN_PROGRESS' })).toBe(true);
    expect(isCurrentTreatmentPlan({ status: 'COMPLETED' })).toBe(false);
    expect(isCurrentTreatmentPlan({ status: 'STOPPED' })).toBe(false);
  });

  it('should label every Plan status for the front desk', () => {
    expect(treatmentPlanStatusLabel('PENDING')).toBe('Pending');
    expect(treatmentPlanStatusLabel('IN_PROGRESS')).toBe('In progress');
    expect(treatmentPlanStatusLabel('COMPLETED')).toBe('Completed');
    expect(treatmentPlanStatusLabel('STOPPED')).toBe('Stopped');
  });

  it('should order current Plans before history, newest first, without mutating input', () => {
    const plans = [
      plan({ id: 1, status: 'COMPLETED' }),
      plan({ id: 2, status: 'PENDING' }),
      plan({ id: 3, status: 'STOPPED' }),
      plan({ id: 4, status: 'IN_PROGRESS' }),
    ];

    expect(orderTreatmentPlans(plans).map((item) => item.id)).toEqual([4, 2, 3, 1]);
    expect(plans.map((item) => item.id)).toEqual([1, 2, 3, 4]);
  });

  it('should return the lowest pending Session of a current Plan', () => {
    const result = nextPlanSession(
      plan({
        sessions: [
          session({ id: 3, sessionNumber: 3 }),
          session({ id: 1, sessionNumber: 1, completionStatus: 'COMPLETED' }),
          session({ id: 2, sessionNumber: 2, label: 'Abhyanga' }),
        ],
      })
    );

    expect(result).toEqual({
      label: 'Abhyanga',
      sessionNumber: 2,
      bookingNumber: null,
      state: 'Not booked',
    });
  });

  it('should report a booked Session with its Appointment booking number', () => {
    const result = nextPlanSession(
      plan({
        sessions: [
          session({
            reservedAppointment: {
              bookingNumber: 'APT-1001',
              slotDate: '2026-11-12',
              startTime: '10:00',
              endTime: '11:00',
            },
          }),
        ],
      })
    );

    expect(result).toMatchObject({ state: 'Booked', bookingNumber: 'APT-1001' });
  });

  it('should report a started Session as in progress', () => {
    const result = nextPlanSession(plan({ sessions: [session({ startedVisitId: 7 })] }));

    expect(result?.state).toBe('In progress');
  });

  it('should return no next Session for history Plans or Plans with nothing pending', () => {
    expect(nextPlanSession(plan({ status: 'STOPPED', sessions: [session()] }))).toBeNull();
    expect(
      nextPlanSession(plan({ sessions: [session({ completionStatus: 'COMPLETED' })] }))
    ).toBeNull();
  });
});
