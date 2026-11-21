import { describe, expect, it } from 'vitest';

import type { ClinicalNote } from '@/app/api/lib/modules/clinical-note/schemas/clinical-note-schema';
import type { PatientVitalSign } from '@/app/api/lib/modules/patient-vital-sign/schemas/patient-vital-sign-schema';
import type { Visit } from '@/app/api/lib/modules/visit/schemas/visit-schema';
import {
  clinicalNoteCreatedProperties,
  clinicalNoteSignedProperties,
  treatmentPlanAssignedProperties,
  treatmentPlanSessionsAddedProperties,
  visitAmendedProperties,
  visitCancelledProperties,
  visitCheckedInProperties,
  visitCompletedProperties,
  visitConsultationStartedProperties,
  visitDiagnosesSavedProperties,
  visitDocumentProperties,
  vitalSignsRecordedProperties,
} from './lifecycle-visit-properties';

const checkedInAt = new Date('2026-11-21T06:05:00Z');

function makeVisit(overrides: Partial<Visit> = {}): Visit {
  return {
    id: 77,
    tenantId: 'tenant-1',
    visitNumber: 'VIS-2026-0077',
    status: 'CHECKED_IN',
    visitDate: '2026-11-21',
    queueToken: 4,
    chiefComplaint: 'Lower back pain',
    remarks: null,
    legacyVisitNumber: null,
    checkedInAt,
    consultationStartedAt: null,
    completedAt: null,
    cancelledAt: null,
    cancellationReason: null,
    createdOn: checkedInAt,
    modifiedOn: checkedInAt,
    patient: {
      id: 9,
      mrn: 'MRN-000123',
      phone: '+971501234567',
      lastName: 'Khan',
      firstName: 'Aisha',
    },
    doctor: { id: 12, name: 'Dr. Meera Nair' },
    visitType: { id: 1, name: 'OPD Consultation', code: 'OPD_CONSULTATION' },
    admitSource: null,
    appointment: null,
    treatment: null,
    treatmentSession: null,
    ...overrides,
  };
}

function makeNote(overrides: Partial<ClinicalNote> = {}): ClinicalNote {
  return {
    id: 5,
    tenantId: 'tenant-1',
    patientId: 9,
    visitId: null,
    admissionId: null,
    noteTypeId: 2,
    subjective: 'Pain for two weeks',
    objective: null,
    assessment: null,
    plan: null,
    status: 'draft',
    signedAt: null,
    authorUserId: 'user-1',
    recordedByUserId: 'user-1',
    amendedAt: null,
    amendedByUserId: null,
    amendedByUserName: null,
    createdOn: new Date('2026-11-21T06:00:00Z'),
    modifiedOn: new Date('2026-11-21T06:00:00Z'),
    ...overrides,
  };
}

describe('visitCheckedInProperties', () => {
  it('should describe a Walk-in with codes, flags and the document count', () => {
    expect(
      visitCheckedInProperties(
        makeVisit({ admitSource: { id: 2, name: 'Referral', code: 'REFERRAL' } }),
        { documentCount: 2 }
      )
    ).toEqual({
      check_in_mode: 'walk_in',
      visit_type_code: 'OPD_CONSULTATION',
      admit_source_code: 'REFERRAL',
      has_doctor: true,
      has_treatment_session: false,
      document_count: 2,
      minutes_vs_appointment_start: undefined,
    });
  });

  it('should send the signed minutes against the booked start for an Appointment Check-in', () => {
    const visit = makeVisit({ appointment: { id: 41, bookingNumber: 'APT-1042' } });

    // 06:05 UTC is 10:05 in Dubai.
    expect(
      visitCheckedInProperties(visit, {
        documentCount: 0,
        timeZone: 'Asia/Dubai',
        appointmentStartTime: '10:15',
      })
    ).toMatchObject({ check_in_mode: 'appointment', minutes_vs_appointment_start: -10 });
  });
});

describe('Visit status transitions', () => {
  it('should send the minutes from Check-in to the start of the consultation', () => {
    expect(
      visitConsultationStartedProperties(
        makeVisit({ consultationStartedAt: new Date('2026-11-21T06:20:30Z') })
      )
    ).toEqual({ visit_type_code: 'OPD_CONSULTATION', minutes_since_check_in: 15 });
  });

  it('should send the total and in-consultation minutes of a completed Visit', () => {
    expect(
      visitCompletedProperties(
        makeVisit({
          consultationStartedAt: new Date('2026-11-21T06:20:00Z'),
          completedAt: new Date('2026-11-21T06:45:00Z'),
        })
      )
    ).toEqual({
      visit_type_code: 'OPD_CONSULTATION',
      minutes_since_check_in: 40,
      minutes_in_consultation: 25,
    });
  });

  it('should read the status a cancelled Visit left from its consultation start', () => {
    const cancelledAt = new Date('2026-11-21T06:35:00Z');

    expect(visitCancelledProperties(makeVisit({ cancelledAt }))).toEqual({
      from_status: 'CHECKED_IN',
      minutes_since_check_in: 30,
    });
    expect(
      visitCancelledProperties(
        makeVisit({ cancelledAt, consultationStartedAt: new Date('2026-11-21T06:20:00Z') })
      )
    ).toMatchObject({ from_status: 'IN_CONSULTATION' });
  });
});

describe('visitAmendedProperties', () => {
  it('should send the amended part and the whole days since the Visit was completed', () => {
    expect(
      visitAmendedProperties(
        'diagnoses',
        new Date('2026-11-18T09:00:00Z'),
        new Date('2026-11-21T10:00:00Z')
      )
    ).toEqual({ amended_part: 'diagnoses', days_since_completed: 3 });
  });

  it('should leave the days out when the completion time is unknown', () => {
    expect(visitAmendedProperties('visit', null)).toEqual({
      amended_part: 'visit',
      days_since_completed: undefined,
    });
  });
});

describe('visitDiagnosesSavedProperties', () => {
  it('should count entries per code system without sending any code', () => {
    expect(
      visitDiagnosesSavedProperties([
        { codeSystem: 'ICD10CM' },
        { codeSystem: 'ICD10CM' },
        { codeSystem: 'AYURVEDA' },
      ])
    ).toEqual({ icd10_count: 2, ayurveda_count: 1 });
  });
});

describe('visitDocumentProperties', () => {
  it('should send an accepted content type', () => {
    expect(visitDocumentProperties({ contentType: 'Application/PDF' })).toEqual({
      content_type: 'application/pdf',
    });
  });

  it('should leave out a content type that is not accepted', () => {
    expect(visitDocumentProperties({ contentType: 'text/plain' })).toEqual({
      content_type: undefined,
    });
  });
});

describe('Clinical Note properties', () => {
  it('should name the context a note was written in', () => {
    expect(clinicalNoteCreatedProperties(makeNote({ visitId: 77 }), 'SOAP')).toEqual({
      note_type_code: 'SOAP',
      context: 'visit',
    });
    expect(clinicalNoteCreatedProperties(makeNote({ admissionId: 3 }), 'SOAP')).toMatchObject({
      context: 'admission',
    });
    expect(clinicalNoteCreatedProperties(makeNote(), null)).toEqual({
      note_type_code: null,
      context: 'patient',
    });
  });

  it('should send the minutes from creation to signing', () => {
    expect(
      clinicalNoteSignedProperties(
        makeNote({ status: 'signed', signedAt: new Date('2026-11-21T07:30:00Z') }),
        'SOAP'
      )
    ).toEqual({ note_type_code: 'SOAP', minutes_since_created: 90 });
  });
});

describe('vitalSignsRecordedProperties', () => {
  it('should count the measurements taken without sending their values', () => {
    const vitalSign = {
      visitId: null,
      admissionId: 3,
      heightCm: 170,
      weightKg: 68,
      bmi: 23.5,
      systolic: 120,
      diastolic: 80,
      pulseBpm: null,
      respRate: null,
      temperatureC: 36.8,
      spo2: null,
      painScore: 0,
    } as PatientVitalSign;

    expect(vitalSignsRecordedProperties(vitalSign)).toEqual({
      context: 'admission',
      fields_recorded_count: 6,
    });
  });
});

describe('Patient Treatment Plan properties', () => {
  it('should send the session structure and count of an assigned plan', () => {
    expect(
      treatmentPlanAssignedProperties({ sessionStructure: 'SEQUENCED', totalSessions: 7 })
    ).toEqual({ session_structure: 'SEQUENCED', session_count: 7 });
  });

  it('should send how many Sessions were added', () => {
    expect(
      treatmentPlanSessionsAddedProperties({ patientTreatmentPlanId: 4, sessions: 3 })
    ).toEqual({ added_count: 3 });
    expect(treatmentPlanSessionsAddedProperties(null)).toEqual({ added_count: 0 });
  });
});
