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
    diagnosisCode: { code: 'M54', title: 'Dorsalgia' },
    ayurvedaDiagnosisCode: { code: 'AYU-KATIGRAHA', title: 'Katigraha (Low back stiffness)' },
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

  it('keeps coded and Ayurvedic findings in Visit-linked SOAP sections', () => {
    expect(consultationToSoap(values)).toEqual({
      subjective:
        '**Chief complaint:**\n\nLow back pain\n\n**Present condition / HPI:**\n\nThree weeks',
      objective:
        '**Examination / red flags:**\n\nNo red flags\n\n**Prakriti:**\n\nVata-Pitta\n\n**Vikriti / body condition:**\n\nVata aggravation',
      assessment:
        'Diagnosis Code: M54 — Dorsalgia\n\nAyurveda Diagnosis Code: AYU-KATIGRAHA — Katigraha (Low back stiffness)\n\n**Ayurvedic diagnosis:**\n\nKatigraha',
      plan: '**Treatment precautions:**\n\nAvoid heavy lifting',
    });
  });

  it('omits coded diagnosis lines when no code is selected', () => {
    expect(
      consultationToSoap({ ...values, diagnosisCode: null, ayurvedaDiagnosisCode: null }).assessment
    ).toBe('**Ayurvedic diagnosis:**\n\nKatigraha');
  });
});
