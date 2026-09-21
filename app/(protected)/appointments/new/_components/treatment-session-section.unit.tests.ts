import { describe, expect, it } from 'vitest';

import type { BookingTreatment } from './book-appointment-demo-data';
import {
  getDefaultTreatmentSelection,
  getTreatmentSelectionState,
} from './book-appointment-demo-data';

function plan(
  id: number,
  sessions: Array<{
    id: string;
    sessionNumber: number;
    isBookable: boolean;
    unavailableReason?: 'Completed' | 'Reserved by another Appointment';
  }>
): BookingTreatment {
  return {
    id,
    treatmentId: id + 100,
    patientTreatmentPlanId: id,
    name: `Plan ${id}`,
    code: `PLAN-${id}`,
    sessionStructure: 'SEQUENCED',
    defaultTotalSessions: null,
    status: 'In Progress',
    plannedSessions: sessions.length,
    completedSessions: sessions.filter((session) => session.unavailableReason === 'Completed')
      .length,
    selectionMode: 'EXISTING_PLAN',
    sessions: sessions.map((session) => ({
      ...session,
      label: `Session ${session.sessionNumber}`,
      procedure: 'Procedure',
      duration: 30,
      setupMinutes: 5,
      cleaningMinutes: 5,
      preparation: '',
      warning: '',
      equipment: '',
      roomType: 'Therapy room',
      therapistSkill: 'Therapist',
      status: session.isBookable ? 'Pending' : 'Unavailable',
      unavailableReason: session.unavailableReason ?? null,
    })),
  };
}

describe('Treatment and Session selection state', () => {
  it('should auto-select the only current Plan and its lowest bookable Session', () => {
    const plans = [
      plan(10, [
        { id: '102', sessionNumber: 2, isBookable: true },
        { id: '101', sessionNumber: 1, isBookable: true },
      ]),
    ];

    expect(getDefaultTreatmentSelection(plans, '')).toEqual({
      patientTreatmentPlanId: '10',
      patientTreatmentPlanSessionId: '101',
    });
  });

  it('should preserve a manual bookable Session choice on a refreshed result', () => {
    const plans = [
      plan(10, [
        { id: '101', sessionNumber: 1, isBookable: true },
        { id: '102', sessionNumber: 2, isBookable: true },
      ]),
    ];

    expect(getDefaultTreatmentSelection(plans, '10', '102')).toEqual({
      patientTreatmentPlanId: '10',
      patientTreatmentPlanSessionId: '102',
    });
  });

  it('should require an explicit Plan choice when multiple current Plans exist', () => {
    const plans = [
      plan(10, [{ id: '101', sessionNumber: 1, isBookable: true }]),
      plan(20, [{ id: '201', sessionNumber: 1, isBookable: true }]),
    ];

    expect(getDefaultTreatmentSelection(plans, '')).toEqual({
      patientTreatmentPlanId: '',
      patientTreatmentPlanSessionId: '',
    });
    expect(getDefaultTreatmentSelection(plans, '20')).toEqual({
      patientTreatmentPlanId: '20',
      patientTreatmentPlanSessionId: '201',
    });
  });

  it('should keep unavailable Sessions visible and exclude them from default selection', () => {
    const plans = [
      plan(10, [
        {
          id: '101',
          sessionNumber: 1,
          isBookable: false,
          unavailableReason: 'Completed',
        },
        {
          id: '102',
          sessionNumber: 2,
          isBookable: false,
          unavailableReason: 'Reserved by another Appointment',
        },
        { id: '103', sessionNumber: 3, isBookable: true },
      ]),
    ];

    expect(plans[0].sessions).toHaveLength(3);
    expect(getDefaultTreatmentSelection(plans, '')).toEqual({
      patientTreatmentPlanId: '10',
      patientTreatmentPlanSessionId: '103',
    });
  });

  it('should prefer a conflict over catalogue fallback when current Plans have no bookable Session', () => {
    const plans = [
      plan(10, [
        {
          id: '101',
          sessionNumber: 1,
          isBookable: false,
          unavailableReason: 'Reserved by another Appointment',
        },
      ]),
    ];

    expect(getTreatmentSelectionState({ isLoading: false, plans, canAssign: true })).toBe(
      'CONFLICT'
    );
  });

  it('should expose catalogue only for zero current Plans with assignment permission', () => {
    expect(getTreatmentSelectionState({ isLoading: false, plans: [], canAssign: true })).toBe(
      'CATALOGUE'
    );
    expect(getTreatmentSelectionState({ isLoading: false, plans: [], canAssign: false })).toBe(
      'CATALOGUE_FORBIDDEN'
    );
  });

  it('should expose loading before any selection state', () => {
    expect(
      getTreatmentSelectionState({
        isLoading: true,
        plans: [plan(10, [{ id: '101', sessionNumber: 1, isBookable: true }])],
        canAssign: true,
      })
    ).toBe('LOADING');
  });
});
