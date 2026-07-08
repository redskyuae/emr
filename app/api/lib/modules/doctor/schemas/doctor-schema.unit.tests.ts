import { describe, expect, it } from 'vitest';

import { createDoctorSchema, doctorIdSchema, updateDoctorSchema } from './doctor-schema';

const validDoctor = {
  name: 'Anita Mehta',
  email: 'anita@example.com',
  password: 'password123',
  specialtyId: 7,
};

const errorsOf = (result: ReturnType<typeof createDoctorSchema.safeParse>) =>
  result.error?.issues.map((issue) => issue.message) ?? [];

describe('Doctor schema', () => {
  it('should require person, login, and Specialty fields', () => {
    const errors = errorsOf(createDoctorSchema.safeParse({}));

    expect(errors).toContain('Name is required');
    expect(errors).toContain('Email is required');
    expect(errors).toContain('Password is required');
    expect(errors).toContain('Specialty is required.');
  });

  it('should trim optional clinical and person fields', () => {
    expect(
      createDoctorSchema.parse({
        ...validDoctor,
        name: ' Anita Mehta ',
        staffCode: ' DOC-1 ',
        designation: ' Consultant ',
        registrationNumber: ' TN-123 ',
        qualifications: ' MBBS, MD ',
      })
    ).toMatchObject({
      name: 'Anita Mehta',
      staffCode: 'DOC-1',
      designation: 'Consultant',
      registrationNumber: 'TN-123',
      qualifications: 'MBBS, MD',
    });
  });

  it('should reject caller-supplied Role IDs', () => {
    expect(createDoctorSchema.safeParse({ ...validDoctor, roleIds: [1] }).success).toBe(false);
  });

  it('should allow optional update fields to be cleared', () => {
    expect(
      updateDoctorSchema.parse({
        staffCode: '',
        designation: '',
        registrationNumber: '',
        qualifications: '',
      })
    ).toEqual({
      staffCode: null,
      designation: null,
      registrationNumber: null,
      qualifications: null,
    });
  });

  it('should reject an empty update and invalid Doctor ID', () => {
    expect(updateDoctorSchema.safeParse({}).success).toBe(false);
    expect(doctorIdSchema.safeParse('0').success).toBe(false);
    expect(doctorIdSchema.parse('4')).toBe(4);
  });

  it('should enforce registration number and password boundaries', () => {
    expect(
      errorsOf(
        createDoctorSchema.safeParse({
          ...validDoctor,
          password: 'short',
          registrationNumber: 'R'.repeat(101),
        })
      )
    ).toEqual(
      expect.arrayContaining([
        'Password must be at least 8 characters',
        'Doctor registration number must be at most 100 characters',
      ])
    );
  });
});
