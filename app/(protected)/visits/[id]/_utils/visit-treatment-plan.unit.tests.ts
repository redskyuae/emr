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
  visitProcedures,
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

describe('visitProcedures', () => {
  type ProcedureVisit = Pick<Visit, 'id' | 'legacyVisitNumber' | 'treatment' | 'treatmentSession'>;

  const previous: ProcedureVisit = {
    id: 5,
    legacyVisitNumber: null,
    treatment: null,
    treatmentSession: null,
  };
  const delivered = session({
    id: 11,
    sessionNumber: 2,
    label: 'Abhyanga',
    procedure: 'Full-body oil massage',
    durationMinutes: 45,
    completedVisitId: 5,
    completionStatus: 'COMPLETED',
    legacyConductionNote: 'Warm the oil before use.',
  });
  const plans = [
    {
      id: 1,
      treatmentName: 'Panchakarma',
      legacyVisitNumber: null,
      sessions: [session({ id: 10 }), delivered],
    },
  ] as unknown as PatientTreatmentPlan[];

  it('should return the Plan Session the Visit delivered with its conduction note', () => {
    expect(visitProcedures(previous, plans)).toEqual([
      {
        key: 'plan-1',
        treatmentName: 'Panchakarma',
        progress: null,
        sessions: [
          expect.objectContaining({
            key: 'plan-session-11',
            sessionNumber: 2,
            label: 'Abhyanga',
            procedure: 'Full-body oil massage',
            durationMinutes: 45,
            conductionNote: 'Warm the oil before use.',
            completed: null,
          }),
        ],
      },
    ]);
  });

  it('should include a Session the Visit started but did not complete', () => {
    const started = [
      { id: 2, treatmentName: 'Panchakarma', sessions: [session({ id: 12, startedVisitId: 5 })] },
    ] as unknown as PatientTreatmentPlan[];

    expect(visitProcedures(previous, started)[0].sessions.map((item) => item.key)).toEqual([
      'plan-session-12',
    ]);
  });

  it('should show every Session of an imported Plan under the source Visit it was prescribed in', () => {
    const imported = { ...previous, id: 9, legacyVisitNumber: '1453' };
    const legacyPlans = [
      {
        id: 3,
        treatmentName: 'GREEVAVASTI+NASYAM',
        legacyVisitNumber: '1453',
        completedSessions: 1,
        totalSessions: 2,
        sessions: [
          session({ id: 22, sessionNumber: 2, procedure: 'NASYAM' }),
          session({
            id: 21,
            sessionNumber: 1,
            procedure: 'GREEVAVASTI',
            completionStatus: 'COMPLETED',
            legacyConductionNote: 'Tolerated well',
          }),
        ],
      },
      { id: 4, treatmentName: 'Other', legacyVisitNumber: '1999', sessions: [session({ id: 30 })] },
    ] as unknown as PatientTreatmentPlan[];

    expect(visitProcedures(imported, legacyPlans)).toEqual([
      expect.objectContaining({
        key: 'plan-3',
        progress: '1 of 2 Sessions completed',
        sessions: [
          expect.objectContaining({
            sessionNumber: 1,
            procedure: 'GREEVAVASTI',
            conductionNote: 'Tolerated well',
            completed: true,
          }),
          expect.objectContaining({ sessionNumber: 2, procedure: 'NASYAM', completed: false }),
        ],
      }),
    ]);
  });

  it('should not match imported Plans to a Visit created here', () => {
    const legacyOnly = [
      { id: 5, treatmentName: 'Other', legacyVisitNumber: '1453', sessions: [session({ id: 31 })] },
    ] as unknown as PatientTreatmentPlan[];

    expect(visitProcedures(previous, legacyOnly)).toEqual([]);
  });

  it('should fall back to the Treatment Session recorded on the Visit', () => {
    const booked: ProcedureVisit = {
      id: 5,
      legacyVisitNumber: null,
      treatment: { id: 1, name: 'Shirodhara', code: 'SHD' },
      treatmentSession: {
        id: 3,
        label: 'Session 1',
        procedure: 'Oil stream on forehead',
        sessionNumber: 1,
        durationMinutes: 30,
        setupMinutes: null,
        cleaningMinutes: null,
        roomType: null,
        therapistSkill: null,
      },
    };

    expect(visitProcedures(booked, [])).toEqual([
      expect.objectContaining({
        key: 'treatment-session-3',
        treatmentName: 'Shirodhara',
        sessions: [
          expect.objectContaining({ procedure: 'Oil stream on forehead', conductionNote: null }),
        ],
      }),
    ]);
  });

  it('should return nothing when the Visit has no procedure', () => {
    expect(visitProcedures(previous, [{ ...plans[0], sessions: [] }])).toEqual([]);
  });
});
