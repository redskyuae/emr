import { describe, expect, it } from 'vitest';

import {
  getPhoneNumberError,
  joinPhoneNumber,
  PHONE_COUNTRIES,
  splitPhoneNumber,
} from './phone-countries';

describe('Phone countries', () => {
  it('should list each country and calling code once', () => {
    const isoCodes = PHONE_COUNTRIES.map((country) => country.iso);
    const dialCodes = PHONE_COUNTRIES.map((country) => country.dialCode);

    expect(new Set(isoCodes).size).toBe(isoCodes.length);
    expect(new Set(dialCodes).size).toBe(dialCodes.length);
  });

  it('should accept UAE mobile and landline numbers', () => {
    expect(getPhoneNumberError('AE', '501234567')).toBeNull();
    expect(getPhoneNumberError('AE', '42345678')).toBeNull();
  });

  it('should reject UAE numbers that break the numbering rule', () => {
    const message =
      'Phone must be a 9-digit UAE mobile number starting with 5, or an 8-digit landline number.';

    for (const number of ['0501234567', '50123456', '5012345678', '12345678', '601234567']) {
      expect(getPhoneNumberError('AE', number)).toBe(message);
    }
  });

  it('should require exactly 10 digits for India', () => {
    expect(getPhoneNumberError('IN', '9876543210')).toBeNull();
    expect(getPhoneNumberError('IN', '987654321')).toBe('Phone must be 10 digits for India (+91).');
    expect(getPhoneNumberError('IN', '98765432101')).toBe(
      'Phone must be 10 digits for India (+91).'
    );
  });

  it('should describe a length range for countries with variable lengths', () => {
    expect(getPhoneNumberError('LB', '1234567')).toBeNull();
    expect(getPhoneNumberError('LB', '123456')).toBe(
      'Phone must be 7 to 8 digits for Lebanon (+961).'
    );
  });

  it('should reject non-digit characters', () => {
    expect(getPhoneNumberError('IN', '98765-4321')).toBe('Phone must contain only digits.');
  });

  it('should name the field being validated in the message', () => {
    expect(getPhoneNumberError('IN', '12345', 'Next of Kin Phone')).toBe(
      'Next of Kin Phone must be 10 digits for India (+91).'
    );
    expect(getPhoneNumberError('AE', '12345', 'Alternate phone')).toBe(
      'Alternate phone must be a 9-digit UAE mobile number starting with 5, or an 8-digit landline number.'
    );
    expect(getPhoneNumberError('IN', '12a45', 'Alternate phone')).toBe(
      'Alternate phone must contain only digits.'
    );
  });

  it('should treat an empty stored phone as an empty UAE number', () => {
    expect(splitPhoneNumber('')).toEqual({ country: 'AE', number: '' });
  });

  it('should reject an unknown country', () => {
    expect(getPhoneNumberError('XX', '9876543210')).toBe('Select a country code.');
  });

  it('should join the calling code and national number', () => {
    expect(joinPhoneNumber('AE', '501234567')).toBe('+971501234567');
    expect(joinPhoneNumber('IN', '9876543210')).toBe('+919876543210');
  });

  it('should split a stored international number back into its parts', () => {
    expect(splitPhoneNumber('+971501234567')).toEqual({ country: 'AE', number: '501234567' });
    expect(splitPhoneNumber('+91 98765-43210')).toEqual({
      country: 'IN',
      number: '9876543210',
    });
    expect(splitPhoneNumber('00966512345678')).toEqual({ country: 'SA', number: '512345678' });
  });

  it('should prefer the longest matching calling code', () => {
    // +971 (UAE) must not be read as +97x or +9x.
    expect(splitPhoneNumber('+97142345678').country).toBe('AE');
    expect(splitPhoneNumber('+9779812345678').country).toBe('NP');
  });

  it('should read a legacy number without a calling code as UAE and drop the trunk 0', () => {
    expect(splitPhoneNumber('0589435678')).toEqual({ country: 'AE', number: '589435678' });
    expect(splitPhoneNumber('050-123 4567')).toEqual({ country: 'AE', number: '501234567' });
  });

  it('should round-trip every country through join and split', () => {
    for (const country of PHONE_COUNTRIES) {
      const number = '5'.repeat(country.maxLength);

      expect(splitPhoneNumber(joinPhoneNumber(country.iso, number))).toEqual({
        country: country.iso,
        number,
      });
    }
  });
});
