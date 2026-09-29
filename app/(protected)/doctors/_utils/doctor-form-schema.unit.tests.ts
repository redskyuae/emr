import { describe, expect, it } from 'vitest';

import { doctorFormSchema } from './doctor-form-schema';

const validDoctorForm = {
  name: 'Dr Anita Mehta',
  email: 'anita@example.com',
  password: 'password123',
  specialtyId: '7',
  gender: '',
  dateOfBirth: '1985-05-14',
  staffCode: '',
  designation: '',
  qualifications: '',
  registrationNumber: '',
};

describe('doctorFormSchema', () => {
  it('should reject a date of birth with a five-digit year', () => {
    const result = doctorFormSchema.safeParse({
      ...validDoctorForm,
      dateOfBirth: '10000-05-14',
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues).toContainEqual(
      expect.objectContaining({ message: 'Date of birth must be a valid date.' })
    );
  });
});
