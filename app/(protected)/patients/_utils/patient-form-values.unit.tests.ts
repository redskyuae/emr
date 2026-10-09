import { describe, expect, it } from 'vitest';

import {
  updatePatientSchema,
  type Patient,
} from '@/app/api/lib/modules/patient/schemas/patient-schema';

import { patientFormSchema } from './patient-form-schema';
import { patientFormValuesToRequest, patientToFormValues } from './patient-form-values';

const existingPatient: Patient = {
  id: 4,
  tenantId: 'tenant-1',
  mrn: 'MRN-1004',
  firstName: 'Vishnu',
  middleName: null,
  lastName: 'Raj',
  gender: 'male',
  dateOfBirth: '1996-12-25',
  bloodGroup: null,
  maritalStatus: 'married',
  preferredPaymentMethod: null,
  phone: '0589435678',
  alternatePhone: null,
  email: 'vishnu@example.com',
  addressLine1: null,
  addressLine2: null,
  city: null,
  stateId: null,
  state: null,
  countryId: null,
  country: null,
  postalCode: null,
  nationalityId: null,
  nationality: null,
  languageId: null,
  language: null,
  religionId: null,
  religion: null,
  emiratesId: null,
  identityDocuments: [],
  emergencyContactName: null,
  emergencyContactRelationship: null,
  emergencyContactPhone: null,
  isActive: true,
  registrationStatus: 'registered',
  createdOn: new Date('2026-10-01T00:00:00Z'),
  modifiedOn: new Date('2026-10-01T00:00:00Z'),
};

// Load into the Edit Patient form, change only the address, then save.
function editAddress(patient: Patient) {
  const values = { ...patientToFormValues(patient), addressLine1: '221B Residency Road' };
  const form = patientFormSchema.safeParse(values);
  const api = updatePatientSchema.safeParse(patientFormValuesToRequest(values));

  return { form, api };
}

describe('Patient form values', () => {
  it('should strip formatting from a legacy alternate phone when loading the edit form', () => {
    const values = patientToFormValues({ ...existingPatient, alternatePhone: '+91-9123456780' });

    expect(values.alternatePhone).toBe('919123456780');
  });

  it('should let an unrelated edit save for a patient with a legacy alternate phone', () => {
    const { form, api } = editAddress({ ...existingPatient, alternatePhone: '+91-9123456780' });

    expect(form.success).toBe(true);
    expect(api.success).toBe(true);
    expect(api.data?.alternatePhone).toBe('919123456780');
    expect(api.data?.addressLine1).toBe('221B Residency Road');
  });

  it('should keep a digits-only alternate phone unchanged from load to request', () => {
    const values = patientToFormValues({ ...existingPatient, alternatePhone: '0501234567' });

    expect(values.alternatePhone).toBe('0501234567');
    expect(patientFormValuesToRequest(values).alternatePhone).toBe('0501234567');
  });

  it('should load a missing alternate phone as empty and omit it from the request', () => {
    const values = patientToFormValues(existingPatient);

    expect(values.alternatePhone).toBe('');
    expect(patientFormValuesToRequest(values).alternatePhone).toBeUndefined();
  });

  it('should leave the phone and emergency contact phone untouched when loading', () => {
    const values = patientToFormValues({
      ...existingPatient,
      phone: '+971-50-1234567',
      emergencyContactPhone: '+971 50 7654321',
    });

    expect(values.phone).toBe('+971-50-1234567');
    expect(values.emergencyContactPhone).toBe('+971 50 7654321');
  });
});
