import { describe, expect, it } from 'vitest';

import {
  consultationToSoap,
  doctorConsultationFormSchema,
  EMPTY_CONSULTATION,
  soapToConsultation,
} from './doctor-consultation-note';

describe('doctor consultation capture', () => {
  const values = {
    ...EMPTY_CONSULTATION,
    noteTypeId: '5',
    chiefComplaint: 'Low back pain',
    hpi: 'Three weeks',
    examination: 'No red flags',
    modernDiagnosis: 'M54 — Dorsalgia',
    ayurvedicDiagnosis: 'Katigraha',
    prakriti: 'Vata-Pitta',
    vikriti: 'Vata aggravation',
    precautions: 'Avoid heavy lifting',
  };

  it('should require a chief complaint', () => {
    expect(doctorConsultationFormSchema.safeParse({ ...values, chiefComplaint: '' }).success).toBe(
      false
    );
  });

  it('should require a Clinical Note Type', () => {
    const result = doctorConsultationFormSchema.safeParse({ ...values, noteTypeId: '' });

    expect(result.error?.issues[0]).toMatchObject({
      path: ['noteTypeId'],
      message: 'Note type is required.',
    });
  });

  it('should reject Subjective fields that together exceed the API limit', () => {
    const text = 'a'.repeat(5000);
    const result = doctorConsultationFormSchema.safeParse({
      ...values,
      chiefComplaint: 'a'.repeat(4000),
      hpi: text,
      medicalHistory: text,
      surgicalHistory: text,
      familySocialHistory: text,
    });

    expect(result.error?.issues).toEqual([
      expect.objectContaining({
        path: ['hpi'],
        message: 'Complaint and history together must be at most 20000 characters.',
      }),
    ]);
  });

  it('should accept Subjective fields that fit the API limit', () => {
    const text = 'a'.repeat(4900);
    const result = doctorConsultationFormSchema.safeParse({
      ...values,
      chiefComplaint: 'a'.repeat(200),
      hpi: text,
      medicalHistory: text,
      surgicalHistory: text,
      familySocialHistory: text,
    });

    expect(result.success).toBe(true);
  });

  it('should keep modern and Ayurvedic findings in Visit-linked SOAP sections', () => {
    expect(consultationToSoap(values)).toEqual({
      subjective:
        '**Chief complaint:**\n\nLow back pain\n\n**Present condition / HPI:**\n\nThree weeks',
      objective:
        '**Examination / red flags:**\n\nNo red flags\n\n**Prakriti:**\n\nVata-Pitta\n\n**Vikriti / body condition:**\n\nVata aggravation',
      assessment: 'Modern diagnosis: M54 — Dorsalgia\n\n**Ayurvedic diagnosis:**\n\nKatigraha',
      plan: '**Treatment precautions:**\n\nAvoid heavy lifting',
    });
  });

  it('should omit empty SOAP sections for a general EMR consultation', () => {
    expect(consultationToSoap({ ...EMPTY_CONSULTATION, chiefComplaint: 'Cough' })).toEqual({
      subjective: '**Chief complaint:**\n\nCough',
      objective: undefined,
      assessment: undefined,
      plan: undefined,
    });
  });
});

describe('resuming a saved consultation draft', () => {
  const sections = (soap: ReturnType<typeof consultationToSoap>) => ({
    noteTypeId: 5,
    subjective: soap.subjective,
    objective: soap.objective ?? null,
    assessment: soap.assessment ?? null,
    plan: soap.plan ?? null,
  });

  it('should restore every field a saved draft holds', () => {
    const values = {
      ...EMPTY_CONSULTATION,
      noteTypeId: '5',
      chiefComplaint: 'Low back pain',
      medicalHistory: '- Hypertension\n- Asthma',
      examination: 'No red flags',
      modernDiagnosis: 'M54 — Dorsalgia',
      ayurvedicDiagnosis: 'Katigraha',
      prakriti: 'Vata',
      precautions: 'Avoid heavy lifting',
    };

    expect(soapToConsultation(sections(consultationToSoap(values)))).toEqual(values);
  });

  it('should restore a diagnosis saved without an Ayurvedic diagnosis', () => {
    const values = {
      ...EMPTY_CONSULTATION,
      noteTypeId: '5',
      chiefComplaint: 'Cough',
      modernDiagnosis: 'J20 — Acute bronchitis',
    };

    expect(soapToConsultation(sections(consultationToSoap(values)))).toEqual(values);
  });

  it('should refuse a note written outside the form rather than lose its text', () => {
    expect(
      soapToConsultation({
        noteTypeId: 5,
        subjective: 'Free-text note from the Patient Chart',
        objective: null,
        assessment: null,
        plan: 'Review in two weeks',
      })
    ).toBeNull();
  });

  it('should refuse a form note with extra text added in the Patient Chart', () => {
    expect(
      soapToConsultation({
        noteTypeId: 5,
        subjective: '**Chief complaint:**\n\nCough',
        objective: null,
        assessment: 'Added by hand',
        plan: null,
      })
    ).toBeNull();
  });
});
