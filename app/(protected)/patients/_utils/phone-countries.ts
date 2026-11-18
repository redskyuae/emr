
type PhoneCountry = {
  iso: string;
  name: string;
  dialCode: string;
  minLength: number;
  maxLength: number;
  pattern?: RegExp;
  patternRule?: string;
};

export const DEFAULT_PHONE_COUNTRY = 'AE';

export const PHONE_COUNTRIES: PhoneCountry[] = [
  { iso: 'AF', name: 'Afghanistan', dialCode: '93', minLength: 9, maxLength: 9 },
  { iso: 'DZ', name: 'Algeria', dialCode: '213', minLength: 8, maxLength: 9 },
  { iso: 'AR', name: 'Argentina', dialCode: '54', minLength: 10, maxLength: 10 },
  { iso: 'AU', name: 'Australia', dialCode: '61', minLength: 9, maxLength: 9 },
  { iso: 'AT', name: 'Austria', dialCode: '43', minLength: 7, maxLength: 13 },
  { iso: 'BH', name: 'Bahrain', dialCode: '973', minLength: 8, maxLength: 8 },
  { iso: 'BD', name: 'Bangladesh', dialCode: '880', minLength: 8, maxLength: 10 },
  { iso: 'BE', name: 'Belgium', dialCode: '32', minLength: 8, maxLength: 9 },
  { iso: 'BR', name: 'Brazil', dialCode: '55', minLength: 10, maxLength: 11 },
  { iso: 'CN', name: 'China', dialCode: '86', minLength: 10, maxLength: 11 },
  { iso: 'CO', name: 'Colombia', dialCode: '57', minLength: 10, maxLength: 10 },
  { iso: 'DK', name: 'Denmark', dialCode: '45', minLength: 8, maxLength: 8 },
  { iso: 'EG', name: 'Egypt', dialCode: '20', minLength: 9, maxLength: 10 },
  { iso: 'ER', name: 'Eritrea', dialCode: '291', minLength: 7, maxLength: 7 },
  { iso: 'ET', name: 'Ethiopia', dialCode: '251', minLength: 9, maxLength: 9 },
  { iso: 'FI', name: 'Finland', dialCode: '358', minLength: 6, maxLength: 10 },
  { iso: 'FR', name: 'France', dialCode: '33', minLength: 9, maxLength: 9 },
  { iso: 'DE', name: 'Germany', dialCode: '49', minLength: 7, maxLength: 11 },
  { iso: 'GH', name: 'Ghana', dialCode: '233', minLength: 9, maxLength: 9 },
  { iso: 'GR', name: 'Greece', dialCode: '30', minLength: 10, maxLength: 10 },
  { iso: 'HK', name: 'Hong Kong', dialCode: '852', minLength: 8, maxLength: 8 },
  { iso: 'IN', name: 'India', dialCode: '91', minLength: 10, maxLength: 10 },
  { iso: 'ID', name: 'Indonesia', dialCode: '62', minLength: 9, maxLength: 12 },
  { iso: 'IR', name: 'Iran', dialCode: '98', minLength: 10, maxLength: 10 },
  { iso: 'IQ', name: 'Iraq', dialCode: '964', minLength: 8, maxLength: 10 },
  { iso: 'IE', name: 'Ireland', dialCode: '353', minLength: 7, maxLength: 9 },
  { iso: 'IT', name: 'Italy', dialCode: '39', minLength: 6, maxLength: 11 },
  { iso: 'JP', name: 'Japan', dialCode: '81', minLength: 10, maxLength: 10 },
  { iso: 'JO', name: 'Jordan', dialCode: '962', minLength: 8, maxLength: 9 },
  { iso: 'KE', name: 'Kenya', dialCode: '254', minLength: 9, maxLength: 9 },
  { iso: 'KW', name: 'Kuwait', dialCode: '965', minLength: 8, maxLength: 8 },
  { iso: 'LB', name: 'Lebanon', dialCode: '961', minLength: 7, maxLength: 8 },
  { iso: 'LY', name: 'Libya', dialCode: '218', minLength: 8, maxLength: 9 },
  { iso: 'MY', name: 'Malaysia', dialCode: '60', minLength: 9, maxLength: 10 },
  { iso: 'MV', name: 'Maldives', dialCode: '960', minLength: 7, maxLength: 7 },
  { iso: 'MX', name: 'Mexico', dialCode: '52', minLength: 10, maxLength: 10 },
  { iso: 'MA', name: 'Morocco', dialCode: '212', minLength: 9, maxLength: 9 },
  { iso: 'MM', name: 'Myanmar', dialCode: '95', minLength: 8, maxLength: 10 },
  { iso: 'NP', name: 'Nepal', dialCode: '977', minLength: 8, maxLength: 10 },
  { iso: 'NL', name: 'Netherlands', dialCode: '31', minLength: 9, maxLength: 9 },
  { iso: 'NZ', name: 'New Zealand', dialCode: '64', minLength: 8, maxLength: 10 },
  { iso: 'NG', name: 'Nigeria', dialCode: '234', minLength: 8, maxLength: 10 },
  { iso: 'NO', name: 'Norway', dialCode: '47', minLength: 8, maxLength: 8 },
  { iso: 'OM', name: 'Oman', dialCode: '968', minLength: 8, maxLength: 8 },
  { iso: 'PK', name: 'Pakistan', dialCode: '92', minLength: 9, maxLength: 10 },
  { iso: 'PS', name: 'Palestine', dialCode: '970', minLength: 8, maxLength: 9 },
  { iso: 'PH', name: 'Philippines', dialCode: '63', minLength: 10, maxLength: 10 },
  { iso: 'PL', name: 'Poland', dialCode: '48', minLength: 9, maxLength: 9 },
  { iso: 'PT', name: 'Portugal', dialCode: '351', minLength: 9, maxLength: 9 },
  { iso: 'QA', name: 'Qatar', dialCode: '974', minLength: 8, maxLength: 8 },
  { iso: 'RU', name: 'Russia / Kazakhstan', dialCode: '7', minLength: 10, maxLength: 10 },
  { iso: 'SA', name: 'Saudi Arabia', dialCode: '966', minLength: 9, maxLength: 9 },
  { iso: 'SG', name: 'Singapore', dialCode: '65', minLength: 8, maxLength: 8 },
  { iso: 'SO', name: 'Somalia', dialCode: '252', minLength: 8, maxLength: 9 },
  { iso: 'ZA', name: 'South Africa', dialCode: '27', minLength: 9, maxLength: 9 },
  { iso: 'KR', name: 'South Korea', dialCode: '82', minLength: 9, maxLength: 10 },
  { iso: 'ES', name: 'Spain', dialCode: '34', minLength: 9, maxLength: 9 },
  { iso: 'LK', name: 'Sri Lanka', dialCode: '94', minLength: 9, maxLength: 9 },
  { iso: 'SD', name: 'Sudan', dialCode: '249', minLength: 9, maxLength: 9 },
  { iso: 'SE', name: 'Sweden', dialCode: '46', minLength: 7, maxLength: 10 },
  { iso: 'CH', name: 'Switzerland', dialCode: '41', minLength: 9, maxLength: 9 },
  { iso: 'SY', name: 'Syria', dialCode: '963', minLength: 9, maxLength: 9 },
  { iso: 'TZ', name: 'Tanzania', dialCode: '255', minLength: 9, maxLength: 9 },
  { iso: 'TH', name: 'Thailand', dialCode: '66', minLength: 8, maxLength: 9 },
  { iso: 'TN', name: 'Tunisia', dialCode: '216', minLength: 8, maxLength: 8 },
  { iso: 'TR', name: 'Turkey', dialCode: '90', minLength: 10, maxLength: 10 },
  { iso: 'UG', name: 'Uganda', dialCode: '256', minLength: 9, maxLength: 9 },
  { iso: 'UA', name: 'Ukraine', dialCode: '380', minLength: 9, maxLength: 9 },
  {
    iso: 'AE',
    name: 'United Arab Emirates',
    dialCode: '971',
    minLength: 8,
    maxLength: 9,
    // Mobile: 5X XXX XXXX. Landline: area code 2, 3, 4, 6, 7 or 9 then 7 digits.
    pattern: /^(5\d{8}|[2-46-9]\d{7})$/,
    patternRule:
      'must be a 9-digit UAE mobile number starting with 5, or an 8-digit landline number.',
  },
  { iso: 'GB', name: 'United Kingdom', dialCode: '44', minLength: 9, maxLength: 10 },
  { iso: 'US', name: 'United States / Canada', dialCode: '1', minLength: 10, maxLength: 10 },
  { iso: 'UZ', name: 'Uzbekistan', dialCode: '998', minLength: 9, maxLength: 9 },
  { iso: 'VN', name: 'Vietnam', dialCode: '84', minLength: 9, maxLength: 10 },
  { iso: 'YE', name: 'Yemen', dialCode: '967', minLength: 7, maxLength: 9 },
];

export function getPhoneCountry(iso: string) {
  return PHONE_COUNTRIES.find((country) => country.iso === iso);
}

/** Returns the validation message for a national number, or null when it is valid. */
export function getPhoneNumberError(iso: string, nationalNumber: string, label = 'Phone') {
  const country = getPhoneCountry(iso);

  if (!country) {
    return 'Select a country code.';
  }

  if (!/^\d+$/.test(nationalNumber)) {
    return `${label} must contain only digits.`;
  }

  if (country.pattern) {
    return country.pattern.test(nationalNumber) ? null : `${label} ${country.patternRule}`;
  }

  const { minLength, maxLength, name, dialCode } = country;
  const length = nationalNumber.length;

  if (length >= minLength && length <= maxLength) {
    return null;
  }

  const digits = minLength === maxLength ? `${minLength}` : `${minLength} to ${maxLength}`;
  return `${label} must be ${digits} digits for ${name} (+${dialCode}).`;
}

/** Joins the form's country and national number into the stored `+<code><number>` value. */
export function joinPhoneNumber(iso: string, nationalNumber: string) {
  const country = getPhoneCountry(iso);
  return country ? `+${country.dialCode}${nationalNumber}` : nationalNumber;
}

/**
 * Splits a stored phone back into country and national number. Numbers saved
 * before country codes existed carry no `+`/`00` prefix; they are read as UAE
 * numbers with any leading trunk 0 dropped.
 */
export function splitPhoneNumber(stored: string) {
  const trimmed = stored.trim();
  const digits = trimmed.replace(/\D/g, '');
  const international = trimmed.startsWith('+') || trimmed.startsWith('00');

  if (international) {
    const withoutPrefix = trimmed.startsWith('00') ? digits.slice(2) : digits;
    const match = PHONE_COUNTRIES.filter((country) =>
      withoutPrefix.startsWith(country.dialCode)
    ).sort((a, b) => b.dialCode.length - a.dialCode.length)[0];

    if (match) {
      return { country: match.iso, number: withoutPrefix.slice(match.dialCode.length) };
    }
  }

  return { country: DEFAULT_PHONE_COUNTRY, number: digits.replace(/^0/, '') };
}
