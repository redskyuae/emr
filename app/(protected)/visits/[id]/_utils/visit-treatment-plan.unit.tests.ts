import { describe, expect, it } from 'vitest';

import type {
  PatientTreatmentPlan,
  PatientTreatmentPlanReadSession,
} from '@/app/api/lib/modules/patient-treatment-plan/schemas/patient-treatment-plan-schema';
import type { Visit } from '@/app/api/lib/modules/visit/schemas/visit-schema';

import {
  canStartPlanSession,
  currentPlanSession,
  isCurrentPlan,
  planSessionLabel,
} from './visit-treatment-plan';

function session(overrides: Partial<PatientTreatmentPlanReadSession>) {
  return {
    id: 1,
    sessionNumber: 1,
    isReserved: false,
    completedVisitId: null,
    startedVisitId: null,
    completionStatus: 'PENDING',
    reservedAppointment: null,
    ...overrides,
  } as PatientTreatmentPlanReadSession;
}

function reserved(bookingNumber: string, overrides: Partial<PatientTreatmentPlanReadSession> = {}) {
  return session({
    isReserved: true,
    reservedAppointment: { bookingNumber, slotDate: '2026-11-06', startTime: null, endTime: null },
    ...overrides,
  });
}

const walkIn = { id: 7, appointment: null };
const booked = { id: 7, appointment: { bookingNumber: 'APT-1001' } } as Pick<
  Visit,
  'id' | 'appointment'
>;
const plan = (sessions: PatientTreatmentPlanReadSession[]) =>
  ({ sessions }) as PatientTreatmentPlan;

describe('isCurrentPlan', () => {
  it('should treat only Pending and In Progress plans as current', () => {
    expect(isCurrentPlan({ status: 'PENDING' })).toBe(true);
    expect(isCurrentPlan({ status: 'IN_PROGRESS' })).toBe(true);
    expect(isCurrentPlan({ status: 'COMPLETED' })).toBe(false);
    expect(isCurrentPlan({ status: 'STOPPED' })).toBe(false);
  });
});

describe('planSessionLabel', () => {
  it('should label a completed Session as done', () => {
    expect(planSessionLabel(session({ completionStatus: 'COMPLETED' }), booked)).toBe('Done');
  });

  it('should label the Session reserved for this Appointment as today', () => {
    expect(planSessionLabel(reserved('APT-1001'), booked)).toBe('Today');
  });

  it('should label a Session reserved for another Appointment as booked', () => {
    expect(planSessionLabel(reserved('APT-2002'), booked)).toBe('Booked');
  });

  it('should not label an unreserved Session as today on a walk-in Visit', () => {
    expect(planSessionLabel(session({}), walkIn)).toBe('Pending');
  });

  it('should label a started pending Session as in progress', () => {
    expect(planSessionLabel(session({ startedVisitId: 7 }), walkIn)).toBe('In progress');
    expect(planSessionLabel(reserved('APT-1001', { startedVisitId: 7 }), booked)).toBe(
      'In progress'
    );
  });
});

describe('currentPlanSession', () => {
  it('should pick the Session reserved for this Visit over an earlier pending one', () => {
    const today = reserved('APT-1001', { id: 2, sessionNumber: 2 });

    expect(currentPlanSession(plan([session({}), today]), booked)).toBe(today);
  });

  it('should pick the Session this Visit completed', () => {
    const done = session({
      id: 2,
      sessionNumber: 2,
      completionStatus: 'COMPLETED',
      completedVisitId: 7,
    });
    const next = session({ id: 3, sessionNumber: 3 });

    expect(currentPlanSession(plan([next, done]), walkIn)).toBe(done);
  });

  it('should pick the Session started in this Visit over an earlier pending one', () => {
    const started = session({ id: 2, sessionNumber: 2, startedVisitId: 7 });

    expect(currentPlanSession(plan([session({}), started]), walkIn)).toBe(started);
  });

  it('should fall back to the lowest pending Session', () => {
    const second = session({ id: 2, sessionNumber: 2 });
    const third = session({ id: 3, sessionNumber: 3 });
    const first = session({
      id: 1,
      sessionNumber: 1,
      completionStatus: 'COMPLETED',
      completedVisitId: 4,
    });

    expect(currentPlanSession(plan([third, first, second]), walkIn)).toBe(second);
  });

  it('should return nothing when every Session was completed by other Visits', () => {
    const done = session({ completionStatus: 'COMPLETED', completedVisitId: 4 });

    expect(currentPlanSession(plan([done]), walkIn)).toBeUndefined();
  });
});

describe('canStartPlanSession', () => {
  const activeWalkIn = { ...walkIn, status: 'IN_CONSULTATION' } as Pick<
    Visit,
    'id' | 'appointment' | 'status'
  >;
  const activeBooked = { ...booked, status: 'CHECKED_IN' } as Pick<
    Visit,
    'id' | 'appointment' | 'status'
  >;
  const current = (sessions: PatientTreatmentPlanReadSession[]) =>
    ({ status: 'IN_PROGRESS', sessions }) as PatientTreatmentPlan;

  it('should allow a pending Session of a current Plan in an active Visit', () => {
    const next = session({});

    expect(canStartPlanSession(current([next]), next, activeWalkIn)).toBe(true);
  });

  it('should not allow starting outside an active Visit or current Plan', () => {
    const next = session({});

    expect(
      canStartPlanSession(current([next]), next, { ...activeWalkIn, status: 'COMPLETED' })
    ).toBe(false);
    expect(
      canStartPlanSession(
        { status: 'STOPPED', sessions: [next] } as PatientTreatmentPlan,
        next,
        activeWalkIn
      )
    ).toBe(false);
  });

  it('should not allow starting a completed or already started Session', () => {
    const done = session({ completionStatus: 'COMPLETED' });
    const started = session({ startedVisitId: 4 });

    expect(canStartPlanSession(current([done]), done, activeWalkIn)).toBe(false);
    expect(canStartPlanSession(current([started]), started, activeWalkIn)).toBe(false);
  });

  it('should allow a booked Session only in its own Appointment Visit', () => {
    const today = reserved('APT-1001');
    const elsewhere = reserved('APT-2002');

    expect(canStartPlanSession(current([today]), today, activeBooked)).toBe(true);
    expect(canStartPlanSession(current([elsewhere]), elsewhere, activeBooked)).toBe(false);
    expect(canStartPlanSession(current([today]), today, activeWalkIn)).toBe(false);
  });

  it('should allow only one Session of a Plan per Visit', () => {
    const next = session({ id: 2, sessionNumber: 2 });

    for (const other of [
      session({ startedVisitId: 7 }),
      session({ completionStatus: 'COMPLETED', completedVisitId: 7 }),
      reserved('APT-1001'),
    ]) {
      expect(canStartPlanSession(current([other, next]), next, activeBooked)).toBe(false);
    }
  });
});
