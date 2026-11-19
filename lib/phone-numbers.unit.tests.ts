import { describe, expect, it } from 'vitest';

import {
  getPhoneMatchKeys,
  getPhoneNumberError,
  getPhoneSearch,
  joinPhoneNumber,
  normalisePhone,
  PHONE_COUNTRIES,
  splitPhoneNumber,
} from './phone-numbers';

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

    // 57 and 59 are not UAE mobile prefixes, matching Book Appointment.
    for (const number of ['50123456', '5012345678', '12345678', '601234567', '571234567']) {
      expect(getPhoneNumberError('AE', number)).toBe(message);
    }
  });

  it('should accept the UAE mobile prefixes 50, 52, 53, 54, 55, 56 and 58', () => {
    for (const prefix of ['50', '52', '53', '54', '55', '56', '58']) {
      expect(getPhoneNumberError('AE', `${prefix}1234567`)).toBeNull();
    }
  });

  it('should accept a number typed with its domestic trunk 0 and save it without', () => {
    expect(getPhoneNumberError('AE', '0501234567')).toBeNull();
    expect(joinPhoneNumber('AE', '0501234567')).toBe('+971501234567');
    expect(getPhoneNumberError('IN', '09876543210')).toBeNull();
    expect(joinPhoneNumber('IN', '09876543210')).toBe('+919876543210');
  });

  it('should keep the leading 0 of an Italian number', () => {
    expect(joinPhoneNumber('IT', '0612345678')).toBe('+390612345678');
    expect(splitPhoneNumber('+390612345678')).toEqual({ country: 'IT', number: '0612345678' });
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

describe('normalisePhone', () => {
  it('should store every accepted spelling of a number as +<code><number>', () => {
    for (const raw of [
      '+971501234567',
      '00971501234567',
      '0501234567',
      '501234567',
      ' 0501234567 ',
    ]) {
      expect(normalisePhone(raw)).toEqual({ success: true, phone: '+971501234567' });
    }

    expect(normalisePhone('+919876543210')).toEqual({ success: true, phone: '+919876543210' });
  });

  it('should report the rule a number breaks', () => {
    expect(normalisePhone('9876543210')).toEqual({
      success: false,
      rule: 'must be a 9-digit UAE mobile number starting with 5, or an 8-digit landline number',
    });
    expect(normalisePhone('+91987654321')).toEqual({
      success: false,
      rule: 'must be 10 digits for India (+91)',
    });
  });

  it('should reject letters, separators and an unsupported calling code', () => {
    for (const raw of ['abc', '050-123 4567', '++971501234567', '971+501234567']) {
      expect(normalisePhone(raw)).toEqual({
        success: false,
        rule: 'must contain only digits, optionally starting with +',
      });
    }

    expect(normalisePhone('+999123456789')).toEqual({
      success: false,
      rule: 'must start with a supported country code',
    });
  });

  it('should return a valid number unchanged when normalised again', () => {
    for (const country of PHONE_COUNTRIES) {
      const phone = joinPhoneNumber(country.iso, '5'.repeat(country.maxLength));
      const result = normalisePhone(phone);

      if (result.success) {
        expect(result.phone).toBe(phone);
      }
    }
  });
});

describe('getPhoneMatchKeys', () => {
  const digitsOf = (saved: string) => saved.replace(/\D/g, '');

  it('should match a booking with 0501234567 to a patient saved as +971501234567', () => {
    expect(getPhoneMatchKeys('0501234567')).toContain(digitsOf('+971501234567'));
  });

  it('should match a canonical booking phone to every older saved spelling', () => {
    const keys = getPhoneMatchKeys('+971501234567');

    for (const saved of [
      '+971501234567',
      '971501234567',
      '00971501234567',
      '0501234567',
      '050-123 4567',
    ]) {
      expect(keys).toContain(digitsOf(saved));
    }
  });

  it('should not match a different number', () => {
    expect(getPhoneMatchKeys('+971501234567')).not.toContain(digitsOf('+971501234568'));
  });
});

describe('getPhoneSearch', () => {
  // Mirrors the SQL in the Patient repository's phone search condition.
  function matches(query: string, saved: string) {
    const search = getPhoneSearch(query);
    const digits = saved.replace(/\D/g, '');

    if (search === null) {
      return saved.toLowerCase().includes(query.trim().toLowerCase());
    }

    switch (search.match) {
      case 'none':
        return false;
      case 'contains':
        return digits.includes(search.digits);
      case 'prefix': {
        const savedWithoutCode = !saved.startsWith('+') && !saved.startsWith('00');

        return (
          search.anyFormat.some((prefix) => digits.startsWith(prefix)) ||
          (savedWithoutCode && search.withoutCode.some((prefix) => digits.startsWith(prefix)))
        );
      }
    }
  }

  const SAVED_PHONES = [
    '+971501234567',
    '0501234567',
    '971501234567',
    '+971551234567',
    '+919876543210',
    '9876543210',
    '+971423450123',
  ];
  const found = (query: string) => SAVED_PHONES.filter((saved) => matches(query, saved));

  it('should match an exact number in every saved format by any spelling', () => {
    for (const query of ['0501234567', '+971501234567', '050 123 4567', '501234567']) {
      expect(getPhoneSearch(query)).toEqual({ match: 'contains', digits: '501234567' });
      expect(found(query)).toEqual(['+971501234567', '0501234567', '971501234567']);
    }
  });

  it('should match a long partial number anywhere in the number', () => {
    expect(getPhoneSearch('234567')).toEqual({ match: 'contains', digits: '234567' });
    expect(found('234567')).toEqual([
      '+971501234567',
      '0501234567',
      '971501234567',
      '+971551234567',
    ]);
  });

  it('should match a short query only at the start of a number', () => {
    expect(getPhoneSearch('0501')).toEqual({
      match: 'prefix',
      anyFormat: ['971501', '00971501'],
      withoutCode: ['0501', '501'],
    });
    expect(found('0501')).toEqual(['+971501234567', '0501234567', '971501234567']);
    expect(found('+97155')).toEqual(['+971551234567']);
    // Also the Indian number saved before country codes, which starts with 98765.
    expect(found('+9198765')).toEqual(['+919876543210', '9876543210']);
    // Without a code the query is read as UAE, so only the legacy number matches.
    expect(found('98765')).toEqual(['9876543210']);
  });

  it('should not match a short query found only in the middle of a number', () => {
    // 1234 and 50 sit inside many numbers; neither is the start of one.
    expect(found('1234')).toEqual([]);
    expect(found('450')).toEqual([]);
  });

  it('should not treat 971 typed without + as every UAE number', () => {
    // Only the number saved literally starting with 971, not every +971 number.
    expect(found('971')).toEqual(['971501234567']);
  });

  it('should not match on a country code alone', () => {
    for (const query of ['+971', '00971', '+91', '+1']) {
      expect(getPhoneSearch(query)).toEqual({ match: 'none' });
      expect(found(query)).toEqual([]);
    }
  });

  it('should not match on an unsupported country code', () => {
    expect(getPhoneSearch('+999123')).toEqual({ match: 'none' });
  });

  it('should leave queries that are not phone-like to the plain text match', () => {
    for (const query of ['Asha', 'MRN-1001', '12', "O'Brien", '', '23/11/1988']) {
      expect(getPhoneSearch(query)).toBeNull();
    }
  });
});
