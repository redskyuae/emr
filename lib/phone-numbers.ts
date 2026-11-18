// One phone format for every write and every compare: `+<country code><number>`.
// Shared by the Patient form, the Patient and Appointment APIs, the booking
// duplicate check and Patient search, so all of them agree on what a number is.

// Country calling codes with the length of the national number (without the
// country code or a leading trunk 0). Countries that share a calling code are
// one entry, so a saved number always maps back to a single option.
type PhoneCountry = {
  iso: string;
  name: string;
  dialCode: string;
  minLength: number;
  maxLength: number;
  // Stricter numbering rule where the plain length check is not enough. The
  // rule text follows the field name, e.g. "Phone must be …".
  pattern?: RegExp;
  patternRule?: string;
  // Italian numbers keep their leading 0 after the country code; everywhere
  // else a leading 0 is the domestic trunk prefix and is dropped.
  keepsLeadingZero?: boolean;
};

export const DEFAULT_PHONE_COUNTRY = 'AE';

// UAE mobile prefixes 050, 052, 053, 054, 055, 056 and 058 (without the 0).
export const UAE_MOBILE_PATTERN = /^5[0234568]\d{7}$/;

export const PHONE_COUNTRIES: PhoneCountry[] = [
  { iso: 'AF', name: 'Afghanistan', dialCode: '93', minLength: 9, maxLength: 9 },
  { iso: 'DZ', name: 'Algeria', dialCode: '213', minLength: 8, maxLength: 9 },
  { iso: 'AR', name: 'Argentina', dialCode: '54', minLength: 10, maxLength: 10 },
  { iso: 'AM', name: 'Armenia', dialCode: '374', minLength: 8, maxLength: 8 },
  { iso: 'AU', name: 'Australia', dialCode: '61', minLength: 9, maxLength: 9 },
  { iso: 'AT', name: 'Austria', dialCode: '43', minLength: 7, maxLength: 13 },
  { iso: 'AZ', name: 'Azerbaijan', dialCode: '994', minLength: 9, maxLength: 9 },
  { iso: 'BH', name: 'Bahrain', dialCode: '973', minLength: 8, maxLength: 8 },
  { iso: 'BD', name: 'Bangladesh', dialCode: '880', minLength: 8, maxLength: 10 },
  { iso: 'BY', name: 'Belarus', dialCode: '375', minLength: 9, maxLength: 9 },
  { iso: 'BE', name: 'Belgium', dialCode: '32', minLength: 8, maxLength: 9 },
  { iso: 'BT', name: 'Bhutan', dialCode: '975', minLength: 7, maxLength: 8 },
  { iso: 'BR', name: 'Brazil', dialCode: '55', minLength: 10, maxLength: 11 },
  { iso: 'BG', name: 'Bulgaria', dialCode: '359', minLength: 8, maxLength: 9 },
  { iso: 'KH', name: 'Cambodia', dialCode: '855', minLength: 8, maxLength: 9 },
  { iso: 'CM', name: 'Cameroon', dialCode: '237', minLength: 9, maxLength: 9 },
  { iso: 'TD', name: 'Chad', dialCode: '235', minLength: 8, maxLength: 8 },
  { iso: 'CL', name: 'Chile', dialCode: '56', minLength: 9, maxLength: 9 },
  { iso: 'CN', name: 'China', dialCode: '86', minLength: 10, maxLength: 11 },
  { iso: 'CO', name: 'Colombia', dialCode: '57', minLength: 10, maxLength: 10 },
  { iso: 'KM', name: 'Comoros', dialCode: '269', minLength: 7, maxLength: 7 },
  { iso: 'CI', name: "Côte d'Ivoire", dialCode: '225', minLength: 10, maxLength: 10 },
  { iso: 'HR', name: 'Croatia', dialCode: '385', minLength: 8, maxLength: 9 },
  { iso: 'CY', name: 'Cyprus', dialCode: '357', minLength: 8, maxLength: 8 },
  { iso: 'CZ', name: 'Czechia', dialCode: '420', minLength: 9, maxLength: 9 },
  { iso: 'DK', name: 'Denmark', dialCode: '45', minLength: 8, maxLength: 8 },
  { iso: 'DJ', name: 'Djibouti', dialCode: '253', minLength: 8, maxLength: 8 },
  { iso: 'EC', name: 'Ecuador', dialCode: '593', minLength: 8, maxLength: 9 },
  { iso: 'EG', name: 'Egypt', dialCode: '20', minLength: 9, maxLength: 10 },
  { iso: 'ER', name: 'Eritrea', dialCode: '291', minLength: 7, maxLength: 7 },
  { iso: 'ET', name: 'Ethiopia', dialCode: '251', minLength: 9, maxLength: 9 },
  { iso: 'FI', name: 'Finland', dialCode: '358', minLength: 6, maxLength: 10 },
  { iso: 'FR', name: 'France', dialCode: '33', minLength: 9, maxLength: 9 },
  { iso: 'GE', name: 'Georgia', dialCode: '995', minLength: 9, maxLength: 9 },
  { iso: 'DE', name: 'Germany', dialCode: '49', minLength: 7, maxLength: 11 },
  { iso: 'GH', name: 'Ghana', dialCode: '233', minLength: 9, maxLength: 9 },
  { iso: 'GR', name: 'Greece', dialCode: '30', minLength: 10, maxLength: 10 },
  { iso: 'HK', name: 'Hong Kong', dialCode: '852', minLength: 8, maxLength: 8 },
  { iso: 'HU', name: 'Hungary', dialCode: '36', minLength: 8, maxLength: 9 },
  { iso: 'IN', name: 'India', dialCode: '91', minLength: 10, maxLength: 10 },
  { iso: 'ID', name: 'Indonesia', dialCode: '62', minLength: 9, maxLength: 12 },
  { iso: 'IR', name: 'Iran', dialCode: '98', minLength: 10, maxLength: 10 },
  { iso: 'IQ', name: 'Iraq', dialCode: '964', minLength: 8, maxLength: 10 },
  { iso: 'IE', name: 'Ireland', dialCode: '353', minLength: 7, maxLength: 9 },
  { iso: 'IL', name: 'Israel', dialCode: '972', minLength: 8, maxLength: 9 },
  {
    iso: 'IT',
    name: 'Italy',
    dialCode: '39',
    minLength: 6,
    maxLength: 11,
    keepsLeadingZero: true,
  },
  { iso: 'JP', name: 'Japan', dialCode: '81', minLength: 10, maxLength: 10 },
  { iso: 'JO', name: 'Jordan', dialCode: '962', minLength: 8, maxLength: 9 },
  { iso: 'KE', name: 'Kenya', dialCode: '254', minLength: 9, maxLength: 9 },
  { iso: 'KW', name: 'Kuwait', dialCode: '965', minLength: 8, maxLength: 8 },
  { iso: 'KG', name: 'Kyrgyzstan', dialCode: '996', minLength: 9, maxLength: 9 },
  { iso: 'LA', name: 'Laos', dialCode: '856', minLength: 8, maxLength: 10 },
  { iso: 'LB', name: 'Lebanon', dialCode: '961', minLength: 7, maxLength: 8 },
  { iso: 'LY', name: 'Libya', dialCode: '218', minLength: 8, maxLength: 9 },
  { iso: 'MY', name: 'Malaysia', dialCode: '60', minLength: 9, maxLength: 10 },
  { iso: 'MV', name: 'Maldives', dialCode: '960', minLength: 7, maxLength: 7 },
  { iso: 'ML', name: 'Mali', dialCode: '223', minLength: 8, maxLength: 8 },
  { iso: 'MR', name: 'Mauritania', dialCode: '222', minLength: 8, maxLength: 8 },
  { iso: 'MU', name: 'Mauritius', dialCode: '230', minLength: 7, maxLength: 8 },
  { iso: 'MX', name: 'Mexico', dialCode: '52', minLength: 10, maxLength: 10 },
  { iso: 'MN', name: 'Mongolia', dialCode: '976', minLength: 8, maxLength: 8 },
  { iso: 'MA', name: 'Morocco', dialCode: '212', minLength: 9, maxLength: 9 },
  { iso: 'MM', name: 'Myanmar', dialCode: '95', minLength: 8, maxLength: 10 },
  { iso: 'NP', name: 'Nepal', dialCode: '977', minLength: 8, maxLength: 10 },
  { iso: 'NL', name: 'Netherlands', dialCode: '31', minLength: 9, maxLength: 9 },
  { iso: 'NZ', name: 'New Zealand', dialCode: '64', minLength: 8, maxLength: 10 },
  { iso: 'NE', name: 'Niger', dialCode: '227', minLength: 8, maxLength: 8 },
  { iso: 'NG', name: 'Nigeria', dialCode: '234', minLength: 8, maxLength: 10 },
  { iso: 'NO', name: 'Norway', dialCode: '47', minLength: 8, maxLength: 8 },
  { iso: 'OM', name: 'Oman', dialCode: '968', minLength: 8, maxLength: 8 },
  { iso: 'PK', name: 'Pakistan', dialCode: '92', minLength: 9, maxLength: 10 },
  { iso: 'PS', name: 'Palestine', dialCode: '970', minLength: 8, maxLength: 9 },
  { iso: 'PE', name: 'Peru', dialCode: '51', minLength: 8, maxLength: 9 },
  { iso: 'PH', name: 'Philippines', dialCode: '63', minLength: 10, maxLength: 10 },
  { iso: 'PL', name: 'Poland', dialCode: '48', minLength: 9, maxLength: 9 },
  { iso: 'PT', name: 'Portugal', dialCode: '351', minLength: 9, maxLength: 9 },
  { iso: 'QA', name: 'Qatar', dialCode: '974', minLength: 8, maxLength: 8 },
  { iso: 'RO', name: 'Romania', dialCode: '40', minLength: 9, maxLength: 9 },
  { iso: 'RU', name: 'Russia / Kazakhstan', dialCode: '7', minLength: 10, maxLength: 10 },
  { iso: 'RW', name: 'Rwanda', dialCode: '250', minLength: 9, maxLength: 9 },
  { iso: 'SA', name: 'Saudi Arabia', dialCode: '966', minLength: 9, maxLength: 9 },
  { iso: 'SN', name: 'Senegal', dialCode: '221', minLength: 9, maxLength: 9 },
  { iso: 'RS', name: 'Serbia', dialCode: '381', minLength: 8, maxLength: 9 },
  { iso: 'SC', name: 'Seychelles', dialCode: '248', minLength: 7, maxLength: 7 },
  { iso: 'SG', name: 'Singapore', dialCode: '65', minLength: 8, maxLength: 8 },
  { iso: 'SO', name: 'Somalia', dialCode: '252', minLength: 8, maxLength: 9 },
  { iso: 'ZA', name: 'South Africa', dialCode: '27', minLength: 9, maxLength: 9 },
  { iso: 'KR', name: 'South Korea', dialCode: '82', minLength: 9, maxLength: 10 },
  { iso: 'SS', name: 'South Sudan', dialCode: '211', minLength: 9, maxLength: 9 },
  { iso: 'ES', name: 'Spain', dialCode: '34', minLength: 9, maxLength: 9 },
  { iso: 'LK', name: 'Sri Lanka', dialCode: '94', minLength: 9, maxLength: 9 },
  { iso: 'SD', name: 'Sudan', dialCode: '249', minLength: 9, maxLength: 9 },
  { iso: 'SE', name: 'Sweden', dialCode: '46', minLength: 7, maxLength: 10 },
  { iso: 'CH', name: 'Switzerland', dialCode: '41', minLength: 9, maxLength: 9 },
  { iso: 'SY', name: 'Syria', dialCode: '963', minLength: 9, maxLength: 9 },
  { iso: 'TW', name: 'Taiwan', dialCode: '886', minLength: 8, maxLength: 9 },
  { iso: 'TJ', name: 'Tajikistan', dialCode: '992', minLength: 9, maxLength: 9 },
  { iso: 'TZ', name: 'Tanzania', dialCode: '255', minLength: 9, maxLength: 9 },
  { iso: 'TH', name: 'Thailand', dialCode: '66', minLength: 8, maxLength: 9 },
  { iso: 'TN', name: 'Tunisia', dialCode: '216', minLength: 8, maxLength: 8 },
  { iso: 'TR', name: 'Turkey', dialCode: '90', minLength: 10, maxLength: 10 },
  { iso: 'TM', name: 'Turkmenistan', dialCode: '993', minLength: 8, maxLength: 8 },
  { iso: 'UG', name: 'Uganda', dialCode: '256', minLength: 9, maxLength: 9 },
  { iso: 'UA', name: 'Ukraine', dialCode: '380', minLength: 9, maxLength: 9 },
  {
    iso: 'AE',
    name: 'United Arab Emirates',
    dialCode: '971',
    minLength: 8,
    maxLength: 9,
    // Mobile: UAE_MOBILE_PATTERN. Landline: area code 2, 3, 4, 6, 7 or 9 then 7 digits.
    pattern: new RegExp(`^(${UAE_MOBILE_PATTERN.source.slice(1, -1)}|[2-46-9]\\d{7})$`),
    patternRule:
      'must be a 9-digit UAE mobile number starting with 5, or an 8-digit landline number',
  },
  { iso: 'GB', name: 'United Kingdom', dialCode: '44', minLength: 9, maxLength: 10 },
  { iso: 'US', name: 'United States / Canada', dialCode: '1', minLength: 10, maxLength: 10 },
  { iso: 'UZ', name: 'Uzbekistan', dialCode: '998', minLength: 9, maxLength: 9 },
  { iso: 'VE', name: 'Venezuela', dialCode: '58', minLength: 10, maxLength: 10 },
  { iso: 'VN', name: 'Vietnam', dialCode: '84', minLength: 9, maxLength: 10 },
  { iso: 'YE', name: 'Yemen', dialCode: '967', minLength: 7, maxLength: 9 },
  { iso: 'ZM', name: 'Zambia', dialCode: '260', minLength: 9, maxLength: 9 },
  { iso: 'ZW', name: 'Zimbabwe', dialCode: '263', minLength: 9, maxLength: 9 },
];

export function getPhoneCountry(iso: string) {
  return PHONE_COUNTRIES.find((country) => country.iso === iso);
}

// Drops one domestic trunk 0, so 0501234567 typed with UAE selected is 501234567.
function toNationalNumber(country: PhoneCountry, number: string) {
  return country.keepsLeadingZero ? number : number.replace(/^0/, '');
}

/**
 * Checks a national number against its country's rule. Returns the rule it
 * breaks (to follow the field name, without a full stop) or null when valid.
 */
function getPhoneRuleViolation(country: PhoneCountry, number: string) {
  if (!/^\d+$/.test(number)) {
    return 'must contain only digits';
  }

  const nationalNumber = toNationalNumber(country, number);

  if (country.pattern) {
    return country.pattern.test(nationalNumber) ? null : (country.patternRule ?? null);
  }

  const { minLength, maxLength, name, dialCode } = country;
  const { length } = nationalNumber;

  if (length >= minLength && length <= maxLength) {
    return null;
  }

  const digits = minLength === maxLength ? `${minLength}` : `${minLength} to ${maxLength}`;
  return `must be ${digits} digits for ${name} (+${dialCode})`;
}

/** Form message for a national number, or null when it is valid. */
export function getPhoneNumberError(iso: string, number: string, label = 'Phone') {
  const country = getPhoneCountry(iso);

  if (!country) {
    return 'Select a country code.';
  }

  const violation = getPhoneRuleViolation(country, number);
  return violation ? `${label} ${violation}.` : null;
}

/** Joins a country and national number into the stored `+<code><number>` value. */
export function joinPhoneNumber(iso: string, number: string) {
  const country = getPhoneCountry(iso);
  return country ? `+${country.dialCode}${toNationalNumber(country, number)}` : number;
}

const DEFAULT_COUNTRY = PHONE_COUNTRIES.find((country) => country.iso === DEFAULT_PHONE_COUNTRY)!;

// The longest calling code wins, so +971 is never read as +97x or +9x.
function matchCallingCode(digits: string) {
  return PHONE_COUNTRIES.filter((country) => digits.startsWith(country.dialCode)).sort(
    (a, b) => b.dialCode.length - a.dialCode.length
  )[0];
}

// `codeMatched` is false when a `+`/`00` number has no calling code we know.
function parsePhone(stored: string) {
  const trimmed = stored.trim();
  const digits = trimmed.replace(/\D/g, '');

  if (trimmed.startsWith('+') || trimmed.startsWith('00')) {
    const withoutPrefix = trimmed.startsWith('00') ? digits.slice(2) : digits;
    const match = matchCallingCode(withoutPrefix);

    if (match) {
      const number = toNationalNumber(match, withoutPrefix.slice(match.dialCode.length));
      return { country: match, number, codeMatched: true };
    }

    return { country: DEFAULT_COUNTRY, number: digits.replace(/^0/, ''), codeMatched: false };
  }

  return { country: DEFAULT_COUNTRY, number: digits.replace(/^0/, ''), codeMatched: true };
}

/**
 * Splits a stored phone into country and national number. Numbers saved before
 * country codes existed carry no `+`/`00` prefix; they are read as UAE numbers.
 */
export function splitPhoneNumber(stored: string) {
  const { country, number } = parsePhone(stored);
  return { country: country.iso, number };
}

type NormalisedPhone = { success: true; phone: string } | { success: false; rule: string };

/**
 * API-side check and canonicalisation. Accepts `+<code><number>`, `00<code><number>`
 * or a UAE number without a code (e.g. 0501234567, as Book Appointment sends),
 * and returns the canonical `+<code><number>`.
 */
export function normalisePhone(raw: string): NormalisedPhone {
  if (!/^\+?\d+$/.test(raw.trim())) {
    return { success: false, rule: 'must contain only digits, optionally starting with +' };
  }

  const { country, number, codeMatched } = parsePhone(raw);

  if (!codeMatched) {
    return { success: false, rule: 'must start with a supported country code' };
  }

  const violation = getPhoneRuleViolation(country, number);

  return violation
    ? { success: false, rule: violation }
    : { success: true, phone: `+${country.dialCode}${number}` };
}

/**
 * Digit strings a saved phone may hold for the same number, so a compare finds
 * `+971501234567`, `971501234567`, `00971501234567`, `0501234567` and `501234567`
 * as one person. Compare against the saved value with non-digits stripped.
 */
export function getPhoneMatchKeys(phone: string) {
  const { country, number } = parsePhone(phone);
  const { dialCode } = country;

  return [...new Set([`${dialCode}${number}`, `00${dialCode}${number}`, `0${number}`, number])];
}

/**
 * National digits to search saved phones by, or null when the query does not
 * look like a phone number. 0501234567 and +971501234567 both search 501234567.
 */
export function getPhoneSearchDigits(query: string) {
  const trimmed = query.trim();
  const compact = trimmed.replace(/[\s()-]/g, '');

  if (!/^\+?\d{3,}$/.test(compact)) {
    return null;
  }

  return splitPhoneNumber(compact).number || null;
}
