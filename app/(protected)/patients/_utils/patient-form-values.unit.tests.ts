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
  title: 'mr',
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
  race: null,
  ethnicGroup: null,
  emiratesId: '784199612345678',
  photoUrl: null,
  patientIdentificationCategory: null,
  passportNumber: null,
  uid: null,
  isVip: false,
  smsConsent: false,
  isMedicalTourist: false,
  identityDocuments: [],
  emergencyContactName: null,
  emergencyContactRelationship: null,
  emergencyContactGender: null,
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
  it('should split a formatted alternate phone into country code and number', () => {
    const values = patientToFormValues({ ...existingPatient, alternatePhone: '+91-9123456780' });

    expect(values.alternatePhoneCountry).toBe('IN');
    expect(values.alternatePhone).toBe('9123456780');
  });

  it('should let an unrelated edit save for a patient with a formatted alternate phone', () => {
    const { form, api } = editAddress({ ...existingPatient, alternatePhone: '+91-9123456780' });

    expect(form.success).toBe(true);
    expect(api.success).toBe(true);
    expect(api.data?.alternatePhone).toBe('+919123456780');
    expect(api.data?.addressLine1).toBe('221B Residency Road');
  });

  it('should read a legacy alternate phone without a country code as UAE', () => {
    const values = patientToFormValues({ ...existingPatient, alternatePhone: '0501234567' });

    expect(values.alternatePhoneCountry).toBe('AE');
    expect(values.alternatePhone).toBe('501234567');
    expect(patientFormValuesToRequest(values).alternatePhone).toBe('+971501234567');
  });

  it('should load a missing alternate phone as empty and omit it from the request', () => {
    const values = patientToFormValues(existingPatient);

    expect(values.alternatePhone).toBe('');
    expect(values.alternatePhoneCountry).toBe('AE');
    expect(patientFormValuesToRequest(values).alternatePhone).toBeUndefined();
  });

  it('should split a stored phone into country code and number when loading', () => {
    const values = patientToFormValues({ ...existingPatient, phone: '+919876543210' });

    expect(values.phoneCountry).toBe('IN');
    expect(values.phone).toBe('9876543210');
  });

  it('should send the phone with its country code', () => {
    const values = {
      ...patientToFormValues(existingPatient),
      phoneCountry: 'IN',
      phone: '9876543210',
    };

    expect(patientFormValuesToRequest(values).phone).toBe('+919876543210');
  });

  it('should let an unrelated edit save for a patient with a legacy UAE phone', () => {
    const { form, api } = editAddress(existingPatient);

    expect(form.success).toBe(true);
    expect(api.success).toBe(true);
    expect(api.data?.phone).toBe('+971589435678');
  });

  it('should split a formatted Next of Kin phone into country code and number', () => {
    const values = patientToFormValues({
      ...existingPatient,
      emergencyContactPhone: '+971 50 7654321',
    });

    expect(values.emergencyContactPhoneCountry).toBe('AE');
    expect(values.emergencyContactPhone).toBe('507654321');
  });

  it('should save the Next of Kin phone with its own country code', () => {
    const { form, api } = editAddress({
      ...existingPatient,
      emergencyContactPhone: '+919988776655',
    });

    expect(form.success).toBe(true);
    expect(api.success).toBe(true);
    expect(api.data?.emergencyContactPhone).toBe('+919988776655');
  });

  it('should flag a legacy Next of Kin phone that is not a valid UAE number', () => {
    const { form } = editAddress({
      ...existingPatient,
      emergencyContactPhone: '747920843idjcksdno',
    });

    expect(form.error?.issues.map((issue) => issue.message)).toEqual([
      'Next of Kin Phone must be a 9-digit UAE mobile number starting with 5, or an 8-digit landline number.',
    ]);
  });
});
