import { describe, expect, it } from 'vitest';

import { consultationToSoap, doctorConsultationFormSchema } from './doctor-consultation-note';

describe('doctor consultation capture', () => {
  const values = {
    chiefComplaint: 'Low back pain',
    hpi: 'Three weeks',
    medicalHistory: '',
    surgicalHistory: '',
    familySocialHistory: '',
    examination: 'No red flags',
    diagnosisCodeId: '1',
    ayurvedicDiagnosis: 'Katigraha',
    prakriti: 'Vata-Pitta',
    vikriti: 'Vata aggravation',
    precautions: 'Avoid heavy lifting',
  };

  it('requires a chief complaint', () => {
    expect(doctorConsultationFormSchema.safeParse({ ...values, chiefComplaint: '' }).success).toBe(
      false
    );
  });

  it('keeps modern and Ayurvedic findings in Visit-linked SOAP sections', () => {
    expect(consultationToSoap(values, { code: 'M54', title: 'Dorsalgia' })).toEqual({
      subjective: 'Chief complaint: Low back pain\n\nPresent condition / HPI: Three weeks',
      objective:
        'Examination / red flags: No red flags\n\nPrakriti: Vata-Pitta\n\nVikriti / body condition: Vata aggravation',
      assessment: 'Modern diagnosis: M54 — Dorsalgia\n\nAyurvedic diagnosis: Katigraha',
      plan: 'Treatment precautions: Avoid heavy lifting',
    });
  });
});
