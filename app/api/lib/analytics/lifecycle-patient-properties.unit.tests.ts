import { describe, expect, it } from 'vitest';

import type { Admission } from '@/app/api/lib/modules/admission/schemas/admission-schema';
import type { PatientIdentityDocument } from '@/app/api/lib/modules/patient/schemas/patient-schema';
import {
  admissionDischargedProperties,
  patientAdmittedProperties,
  patientRegisteredProperties,
  registrationPathAfterUpdate,
} from './lifecycle-patient-properties';

const admittedAt = new Date('2026-11-17T08:00:00Z');

function makeAdmission(overrides: Partial<Admission> = {}): Admission {
  return {
    id: 3,
    tenantId: 'tenant-1',
    admissionNumber: 'ADM-2026-0003',
    status: 'ADMITTED',
    admissionReason: 'Post-operative care',
    remarks: null,
    expectedDischargeDate: null,
    admittedAt,
    dischargedAt: null,
    dischargeDisposition: null,
    dischargeSummary: null,
    cancelledAt: null,
    cancellationReason: null,
    createdOn: admittedAt,
    modifiedOn: admittedAt,
    patient: {
      id: 9,
      mrn: 'MRN-000123',
      phone: '+971501234567',
      lastName: 'Khan',
      firstName: 'Aisha',
    },
    doctor: { id: 12, name: 'Dr. Meera Nair' },
    admissionType: { id: 1, name: 'Elective', code: 'ELECTIVE' },
    bed: { id: 21, bedNumber: 'B-104' },
    ward: { id: 6, name: 'General Ward', code: 'GEN' },
    visit: null,
    ...overrides,
  };
}

describe('patientRegisteredProperties', () => {
  it('should send flags and counts but never the identity details', () => {
    expect(
      patientRegisteredProperties(
        {
          emiratesId: '784-1990-1234567-1',
          isMedicalTourist: false,
          identityDocuments: [{}, {}] as PatientIdentityDocument[],
        },
        'direct'
      )
    ).toEqual({
      registration_path: 'direct',
      has_emirates_id: true,
      is_medical_tourist: false,
      identity_document_count: 2,
    });
  });
});

describe('registrationPathAfterUpdate', () => {
  it('should complete the registration of a Provisional Patient', () => {
    expect(registrationPathAfterUpdate('provisional', { registrationStatus: 'registered' })).toBe(
      'completed_provisional'
    );
  });

  it('should register nobody when the Patient was already registered', () => {
    expect(
      registrationPathAfterUpdate('registered', { registrationStatus: 'registered' })
    ).toBeUndefined();
  });
});

describe('patientAdmittedProperties', () => {
  it('should send the Admission Type code and whether it came from a Visit', () => {
    expect(
      patientAdmittedProperties(
        makeAdmission({
          visit: { id: 77, visitNumber: 'VIS-2026-0077' },
          expectedDischargeDate: '24-11-2026',
        })
      )
    ).toEqual({
      admission_type_code: 'ELECTIVE',
      from_visit: true,
      has_expected_discharge_date: true,
    });
  });
});

describe('admissionDischargedProperties', () => {
  it('should send the whole days of the stay and leave the Discharge Disposition out', () => {
    expect(
      admissionDischargedProperties(
        makeAdmission({
          status: 'DISCHARGED',
          dischargedAt: new Date('2026-11-21T07:00:00Z'),
          dischargeDisposition: 'ROUTINE',
          dischargeSummary: 'Recovered well',
        })
      )
    ).toEqual({ length_of_stay_days: 3, has_discharge_summary: true });
  });
});
