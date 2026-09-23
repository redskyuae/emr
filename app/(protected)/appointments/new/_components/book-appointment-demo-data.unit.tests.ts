import { describe, expect, it } from 'vitest';

import {
  DEMO_THERAPISTS,
  DEMO_TREATMENT_CATALOG,
  toBookingPatientTreatmentPlan,
  toBookingTreatment,
} from './book-appointment-demo-data';

describe('Book Appointment static Therapist dependencies', () => {
  it('should provide a selectable Therapist for every Session', () => {
    for (const treatment of DEMO_TREATMENT_CATALOG) {
      for (const session of treatment.sessions) {
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

describe('Booking Treatment adapter', () => {
  it('should preserve unknown legacy timing without inventing resource requirements', () => {
    const treatment = toBookingTreatment({
      id: 1,
      name: 'Legacy',
      code: 'LEG',
      durationMinutes: null,
      setupMinutes: null,
      cleaningMinutes: null,
      roomType: null,
      therapistSkill: null,
      sessions: [
        {
          id: 2,
          label: 'Session 1',
          procedure: 'Legacy',
          sessionNumber: 1,
          durationMinutes: null,
          setupMinutes: null,
          cleaningMinutes: null,
          preparation: null,
          warning: null,
          equipment: null,
          roomType: null,
          therapistSkill: null,
        },
      ],
    });
    expect(treatment.sessions[0]).toMatchObject({
      duration: null,
      setupMinutes: null,
      cleaningMinutes: null,
      roomType: '',
      therapistSkill: '',
    });
  });

  it('should preserve Patient Plan progress and Session availability reasons', () => {
    const treatment = toBookingPatientTreatmentPlan({
      id: 71,
      tenantId: 'tenant-1',
      patientId: 7,
      treatmentId: 11,
      treatmentName: 'Abhyanga',
      treatmentCode: 'ABH',
      treatmentSourceIdentity: null,
      sessionStructure: 'SEQUENCED',
      totalSessions: 3,
      statusOverride: null,
      legacySourceIdentity: null,
      legacySourceSystem: null,
      legacySourceKey: null,
      legacySourceContentHash: null,
      sourceImportBatchId: null,
      legacyVisitId: null,
      legacyVisitNumber: null,
      importBatchId: null,
      createdOn: new Date('2026-01-01T00:00:00.000Z'),
      modifiedOn: new Date('2026-01-02T00:00:00.000Z'),
      status: 'IN_PROGRESS',
      completedSessions: 1,
      sessions: [
        {
          id: 701,
          tenantId: 'tenant-1',
          patientTreatmentPlanId: 71,
          treatmentSessionId: 101,
          sessionNumber: 1,
          label: 'Session 1',
          procedure: 'Abhyanga',
          durationMinutes: 60,
          setupMinutes: 5,
          cleaningMinutes: 5,
          preparation: null,
          warning: null,
          equipment: null,
          roomType: 'Therapy room',
          therapistSkill: 'Abhyanga',
          legacyConductionNote: null,
          completionStatus: 'COMPLETED',
          completionSource: 'VISIT',
          completedVisitId: 91,
          completedAt: new Date('2026-01-03T00:00:00.000Z'),
          createdOn: new Date('2026-01-01T00:00:00.000Z'),
          modifiedOn: new Date('2026-01-03T00:00:00.000Z'),
          isReserved: false,
          isBookable: false,
          unavailableReason: 'COMPLETED',
          reservedAppointment: null,
        },
        {
          id: 702,
          tenantId: 'tenant-1',
          patientTreatmentPlanId: 71,
          treatmentSessionId: 102,
          sessionNumber: 2,
          label: 'Session 2',
          procedure: 'Abhyanga',
          durationMinutes: 60,
          setupMinutes: 5,
          cleaningMinutes: 5,
          preparation: null,
          warning: null,
          equipment: null,
          roomType: 'Therapy room',
          therapistSkill: 'Abhyanga',
          legacyConductionNote: null,
          completionStatus: 'PENDING',
          completionSource: null,
          completedVisitId: null,
          completedAt: null,
          createdOn: new Date('2026-01-01T00:00:00.000Z'),
          modifiedOn: new Date('2026-01-01T00:00:00.000Z'),
          isReserved: true,
          isBookable: false,
          unavailableReason: 'RESERVED',
          reservedAppointment: {
            bookingNumber: 'APT-1001',
            slotDate: '2026-09-21',
            startTime: '09:00',
            endTime: '10:00',
          },
        },
      ],
    });

    expect(treatment).toMatchObject({
      patientTreatmentPlanId: 71,
      status: 'In Progress',
      plannedSessions: 3,
      completedSessions: 1,
      selectionMode: 'EXISTING_PLAN',
    });
    expect(treatment.sessions[0].completedAt).toEqual(new Date('2026-01-03T00:00:00.000Z'));
    expect(treatment.sessions.map((session) => session.unavailableReason)).toEqual([
      'Completed',
      'Reserved by another Appointment',
    ]);
    expect(treatment.sessions[1].reservedAppointment).toEqual({
      bookingNumber: 'APT-1001',
      slotDate: '2026-09-21',
      startTime: '09:00',
      endTime: '10:00',
    });
  });
});
