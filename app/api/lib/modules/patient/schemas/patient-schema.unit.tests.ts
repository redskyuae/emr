import { describe, expect, it } from 'vitest';

import {
  createPatientSchema,
  patientIdSchema,
  patientTenantIdSchema,
  updatePatientSchema,
} from './patient-schema';

const errorsOf = (result: ReturnType<typeof createPatientSchema.safeParse>) =>
  result.error?.issues.map((issue) => issue.message) ?? [];

const validPayload = {
  title: 'mrs',
  firstName: 'Asha',
  lastName: 'Rao',
  gender: 'female',
  dateOfBirth: '1990-05-14',
  phone: '9876543210',
  emiratesId: '784199012345671',
};

describe('Patient schema', () => {
  it('should require title, first name, last name, gender, date of birth and phone', () => {
    const errors = errorsOf(createPatientSchema.safeParse({}));
    expect(errors).toEqual(
      expect.arrayContaining([
        'Patient title is invalid',
        'Patient first name is required',
        'Patient last name is required',
        'Patient gender is invalid',
        'Date of birth is required',
        'Patient phone is required',
      ])
    );
  });

  it('should reject an invalid title', () => {
    expect(
      errorsOf(createPatientSchema.safeParse({ ...validPayload, title: 'captain' }))
    ).toContain('Patient title is invalid');
  });

  it('should reject an invalid gender', () => {
    expect(errorsOf(createPatientSchema.safeParse({ ...validPayload, gender: 'robot' }))).toContain(
      'Patient gender is invalid'
    );
  });

  it('should reject an invalid blood group', () => {
    expect(
      errorsOf(createPatientSchema.safeParse({ ...validPayload, bloodGroup: 'Z+' }))
    ).toContain('Patient blood group is invalid');
  });

  it('should reject an invalid marital status', () => {
    expect(
      errorsOf(createPatientSchema.safeParse({ ...validPayload, maritalStatus: 'engaged' }))
    ).toContain('Patient marital status is invalid');
  });

  it('should reject an invalid preferred payment method', () => {
    expect(
      errorsOf(createPatientSchema.safeParse({ ...validPayload, preferredPaymentMethod: 'crypto' }))
    ).toContain('Patient preferred payment method is invalid');
  });

  it('should accept supported Race and Ethnic Group values', () => {
    const result = createPatientSchema.safeParse({
      ...validPayload,
      race: 'asian',
      ethnicGroup: 'south-asian',
      emergencyContactGender: 'female',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.race).toBe('asian');
      expect(result.data.ethnicGroup).toBe('south-asian');
      expect(result.data.emergencyContactGender).toBe('female');
    }
  });

  it('should reject invalid Race, Ethnic Group and Next of Kin Gender values', () => {
    expect(
      errorsOf(
        createPatientSchema.safeParse({
          ...validPayload,
          race: 'martian',
          ethnicGroup: 'moon-base',
          emergencyContactGender: 'robot',
        })
      )
    ).toEqual(
      expect.arrayContaining([
        'Patient race is invalid',
        'Patient ethnic group is invalid',
        'Patient gender is invalid',
      ])
    );
  });

  it('should accept each supported preferred payment method', () => {
    for (const method of ['cash', 'insurance', 'self-pay', 'corporate']) {
      const result = createPatientSchema.safeParse({
        ...validPayload,
        preferredPaymentMethod: method,
      });
      expect(result.success).toBe(true);
      expect(result.data?.preferredPaymentMethod).toBe(method);
    }
  });

  it('should treat a blank preferred payment method as omitted', () => {
    const result = createPatientSchema.safeParse({ ...validPayload, preferredPaymentMethod: '  ' });
    expect(result.success).toBe(true);
    expect(result.data?.preferredPaymentMethod).toBeUndefined();
  });

  it('should reject a future date of birth', () => {
    expect(
      errorsOf(createPatientSchema.safeParse({ ...validPayload, dateOfBirth: '3000-01-01' }))
    ).toContain('Date of birth must not be in the future');
  });

  it("should accept today's date of birth", () => {
    const today = new Date().toISOString().slice(0, 10);
    expect(createPatientSchema.safeParse({ ...validPayload, dateOfBirth: today }).success).toBe(
      true
    );
  });

  it('should reject a malformed date of birth', () => {
    expect(
      errorsOf(createPatientSchema.safeParse({ ...validPayload, dateOfBirth: '14-05-1990' }))
    ).toContain('Date of birth must be a valid date');
  });

  it('should reject an invalid email', () => {
    expect(
      errorsOf(createPatientSchema.safeParse({ ...validPayload, email: 'not-an-email' }))
    ).toContain('Patient email must be valid');
  });

  it('should normalise every spelling of an Emirates ID to the same digits', () => {
    for (const input of ['784-1990-1234567-1', '784 1990 1234567 1', '784199012345671']) {
      const result = createPatientSchema.safeParse({ ...validPayload, emiratesId: input });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.emiratesId).toBe('784199012345671');
      }
    }
  });

  it('should reject an Emirates ID that is not 15 digits beginning with 784', () => {
    for (const input of ['7841990123456', '784-1990-1234567-12']) {
      expect(
        errorsOf(createPatientSchema.safeParse({ ...validPayload, emiratesId: input }))
      ).toContain('Patient Emirates ID must be 15 digits');
    }

    expect(
      errorsOf(createPatientSchema.safeParse({ ...validPayload, emiratesId: '123199012345671' }))
    ).toContain(
      'Patient Emirates ID must be 15 digits beginning with 784 or match Patient Identification Category default'
    );
  });

  it('should accept the mapped default Emirates ID for a Patient Identification Category', () => {
    const result = createPatientSchema.safeParse({
      ...validPayload,
      emiratesId: '999-9999-9999999-9',
      patientIdentificationCategory: 'unknown-status-without-card',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.emiratesId).toBe('999999999999999');
      expect(result.data.patientIdentificationCategory).toBe('unknown-status-without-card');
    }
  });

  it('should reject a default Emirates ID that does not match the Patient Identification Category', () => {
    expect(
      errorsOf(
        createPatientSchema.safeParse({
          ...validPayload,
          emiratesId: '222-2222-2222222-2',
          patientIdentificationCategory: 'unknown-status-without-card',
        })
      )
    ).toContain(
      'Patient Emirates ID must be 15 digits beginning with 784 or match Patient Identification Category default'
    );
  });

  it('should treat an empty Emirates ID as absent', () => {
    const result = createPatientSchema.safeParse({
      ...validPayload,
      emiratesId: '',
      patientIdentificationCategory: 'unknown-status-without-card',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.emiratesId).toBeUndefined();
    }
  });

  it('should accept a Patient photo returned by Emirates ID read', () => {
    const result = createPatientSchema.safeParse({
      ...validPayload,
      photoUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ==',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.photoUrl).toBe('data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ==');
    }
  });

  it('should reject a Patient photo when Emirates ID is absent', () => {
    expect(
      errorsOf(
        createPatientSchema.safeParse({
          ...validPayload,
          emiratesId: '',
          photoUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ==',
          patientIdentificationCategory: 'unknown-status-without-card',
        })
      )
    ).toContain('Patient photo can only be saved with Emirates ID');
  });

  it('should reject unsupported Patient photo values', () => {
    expect(
      errorsOf(createPatientSchema.safeParse({ ...validPayload, photoUrl: 'javascript:alert(1)' }))
    ).toContain('Patient photo must be an HTTP(S) URL or image data URL from Emirates ID read');
  });

  it('should trim optional passport number and reject overlong values', () => {
    const result = createPatientSchema.safeParse({
      ...validPayload,
      passportNumber: ' P9876543 ',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.passportNumber).toBe('P9876543');
    }

    expect(
      errorsOf(createPatientSchema.safeParse({ ...validPayload, passportNumber: 'P'.repeat(51) }))
    ).toContain('Patient passport number must be at most 50 characters');
  });

  it('should require Patient Identification Category when Emirates ID is absent', () => {
    const payloadWithoutEmiratesId = { ...validPayload, emiratesId: undefined };

    expect(errorsOf(createPatientSchema.safeParse(payloadWithoutEmiratesId))).toContain(
      'Patient Identification Category is required when Emirates ID is absent'
    );
  });

  it('should accept each supported Patient Identification Category without an Emirates ID', () => {
    for (const category of [
      'uae-national-without-card',
      'national-without-card',
      'expatriate-resident-without-card',
      'non-expatriate-resident-without-card',
      'unknown-status-without-card',
    ]) {
      const result = createPatientSchema.safeParse({
        ...validPayload,
        emiratesId: '',
        patientIdentificationCategory: category,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.patientIdentificationCategory).toBe(category);
        expect(result.data.emiratesId).toBeUndefined();
      }
    }
  });

  it('should reject an invalid Patient Identification Category', () => {
    expect(
      errorsOf(
        createPatientSchema.safeParse({
          ...validPayload,
          emiratesId: '',
          patientIdentificationCategory: 'tourist',
        })
      )
    ).toContain('Patient Identification Category is invalid');
  });

  it('should require UID when Patient is a Medical Tourist', () => {
    expect(
      errorsOf(
        createPatientSchema.safeParse({
          ...validPayload,
          emiratesId: '',
          isMedicalTourist: true,
          patientIdentificationCategory: 'unknown-status-without-card',
        })
      )
    ).toContain('Patient UID is required for Medical Tourist');
  });

  it('should reject Medical Tourist registration with an Emirates ID', () => {
    expect(
      errorsOf(createPatientSchema.safeParse({ ...validPayload, isMedicalTourist: true }))
    ).toContain('Medical Tourist cannot have Emirates ID');
  });

  it('should accept Medical Tourist registration with UID and optional passport number', () => {
    const result = createPatientSchema.safeParse({
      ...validPayload,
      emiratesId: '',
      uid: '123456789',
      passportNumber: 'P9876543',
      isMedicalTourist: true,
      patientIdentificationCategory: 'unknown-status-without-card',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.passportNumber).toBe('P9876543');
    }
  });

  it('should reject emirates-id as an identity document type', () => {
    // The Emirates ID has exactly one home; allowing it here would let the two
    // drift and give "does this patient have an Emirates ID?" two answers.
    expect(
      createPatientSchema.safeParse({
        ...validPayload,
        identityDocuments: [{ documentType: 'emirates-id', documentNumber: '784199012345671' }],
      }).success
    ).toBe(false);
  });

  it('should require issuing country and expiry date for a passport', () => {
    expect(
      createPatientSchema.safeParse({
        ...validPayload,
        identityDocuments: [{ documentType: 'passport', documentNumber: 'J8369854' }],
      }).success
    ).toBe(false);

    expect(
      createPatientSchema.safeParse({
        ...validPayload,
        identityDocuments: [
          {
            documentType: 'passport',
            documentNumber: 'J8369854',
            issuingCountryId: 1,
            expiryDate: '2029-04-11',
          },
        ],
      }).success
    ).toBe(true);
  });

  it('should require an expiry date but reject an issuing country for a residence visa', () => {
    expect(
      createPatientSchema.safeParse({
        ...validPayload,
        identityDocuments: [{ documentType: 'residence-visa', documentNumber: 'RV-1' }],
      }).success
    ).toBe(false);

    expect(
      createPatientSchema.safeParse({
        ...validPayload,
        identityDocuments: [
          {
            documentType: 'residence-visa',
            documentNumber: 'RV-1',
            expiryDate: '2027-01-15',
            issuingCountryId: 1,
          },
        ],
      }).success
    ).toBe(false);

    expect(
      createPatientSchema.safeParse({
        ...validPayload,
        identityDocuments: [
          { documentType: 'residence-visa', documentNumber: 'RV-1', expiryDate: '2027-01-15' },
        ],
      }).success
    ).toBe(true);
  });

  it('should accept a driving licence with neither issuing country nor expiry', () => {
    expect(
      createPatientSchema.safeParse({
        ...validPayload,
        identityDocuments: [{ documentType: 'driving-license', documentNumber: 'DL-5' }],
      }).success
    ).toBe(true);
  });

  it('should accept several documents of the same type for one patient', () => {
    // A dual national legitimately holds two valid passports.
    expect(
      createPatientSchema.safeParse({
        ...validPayload,
        identityDocuments: [
          {
            documentType: 'passport',
            documentNumber: 'J8369854',
            issuingCountryId: 1,
            expiryDate: '2029-04-11',
          },
          {
            documentType: 'passport',
            documentNumber: '533291847',
            issuingCountryId: 2,
            expiryDate: '2031-08-02',
          },
        ],
      }).success
    ).toBe(true);
  });

  it('should accept a document id so the replace can be diffed', () => {
    const result = createPatientSchema.safeParse({
      ...validPayload,
      identityDocuments: [{ id: 91, documentType: 'driving-license', documentNumber: 'DL-5' }],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.identityDocuments?.[0].id).toBe(91);
    }
  });

  it('should reject a label on any document type other than other', () => {
    expect(
      createPatientSchema.safeParse({
        ...validPayload,
        identityDocuments: [
          { documentType: 'driving-license', documentNumber: 'DL-5', label: 'Nope' },
        ],
      }).success
    ).toBe(false);
  });

  it('should require country ID when state ID is provided', () => {
    expect(errorsOf(createPatientSchema.safeParse({ ...validPayload, stateId: 1 }))).toContain(
      'Patient country ID is required when state ID is provided'
    );
  });

  it('should accept state ID together with country ID', () => {
    expect(
      createPatientSchema.safeParse({ ...validPayload, stateId: 1, countryId: 1 }).success
    ).toBe(true);
  });

  it('should accept a valid create payload and drop blank optionals', () => {
    const result = createPatientSchema.safeParse({ ...validPayload, middleName: '   ' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.middleName).toBeUndefined();
    }
  });

  it('should apply the same rules to update payloads', () => {
    expect(updatePatientSchema.safeParse({}).success).toBe(false);
    expect(updatePatientSchema.safeParse(validPayload).success).toBe(true);
  });

  it('should validate the patient id and tenant id', () => {
    expect(patientIdSchema.safeParse('1').success).toBe(true);
    expect(patientIdSchema.safeParse('0').success).toBe(false);
    expect(patientTenantIdSchema.safeParse('   ').success).toBe(false);
  });
});
