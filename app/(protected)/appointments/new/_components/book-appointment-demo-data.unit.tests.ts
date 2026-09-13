import { describe, expect, it } from 'vitest';

import { DEMO_ROOMS, DEMO_THERAPISTS, DEMO_TREATMENT_CATALOG } from './book-appointment-demo-data';

describe('Book Appointment static Procedure dependencies', () => {
  it('should provide a selectable Room and Therapist for every Session', () => {
    for (const treatment of DEMO_TREATMENT_CATALOG) {
      for (const session of treatment.sessions) {
        expect(
          DEMO_ROOMS.some(
            (room) =>
              room.roomType === session.roomType &&
              room.status === 'Ready' &&
              room.conflictReason === undefined
          ),
          `${session.label} should have an available Room`
        ).toBe(true);
        expect(
          DEMO_THERAPISTS.some(
            (therapist) =>
              therapist.skill === session.therapistSkill &&
              therapist.active &&
              therapist.conflictReason === undefined
          ),
          `${session.label} should have an available Therapist`
        ).toBe(true);
      }
    }
  });
});
