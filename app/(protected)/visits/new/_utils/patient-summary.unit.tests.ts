import { describe, expect, it } from 'vitest';

import type { Patient } from '@/app/api/lib/modules/patient/schemas/patient-schema';

import {
  emergencyContactSummary,
  patientAddressSummary,
  patientDisplayName,
  patientInitials,
} from './patient-summary';

describe('patientDisplayName', () => {
  it('should join the name parts and skip a missing middle name', () => {
    expect(patientDisplayName({ firstName: 'Asha', middleName: null, lastName: 'Rao' })).toBe(
      'Asha Rao'
    );
    expect(patientDisplayName({ firstName: 'Asha', middleName: 'K', lastName: 'Rao' })).toBe(
      'Asha K Rao'
    );
  });
});

describe('patientInitials', () => {
  it('should use the first letters of the first and last names', () => {
    expect(patientInitials({ firstName: 'asha', middleName: null, lastName: 'rao' })).toBe('AR');
  });
});

describe('patientAddressSummary', () => {
  it('should combine the recorded address parts', () => {
    expect(
      patientAddressSummary({
        addressLine1: '12 Lake Road',
        city: 'Kochi',
        state: { id: 1, name: 'Kerala' },
        country: null,
      } as Pick<Patient, 'addressLine1' | 'city' | 'state' | 'country'>)
    ).toBe('12 Lake Road, Kochi, Kerala');
  });

  it('should return null when no address is recorded', () => {
    expect(
      patientAddressSummary({ addressLine1: null, city: ' ', state: null, country: null })
    ).toBeNull();
  });
});

describe('emergencyContactSummary', () => {
  it('should show the contact with their relationship', () => {
    expect(
      emergencyContactSummary({
        emergencyContactName: 'Ravi Rao',
        emergencyContactRelationship: 'Spouse',
      })
    ).toBe('Ravi Rao · Spouse');
  });

  it('should return null without a contact name', () => {
    expect(
      emergencyContactSummary({
        emergencyContactName: null,
        emergencyContactRelationship: 'Spouse',
      })
    ).toBeNull();
  });
});
