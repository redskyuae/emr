import { getPhoneCountry, splitPhoneNumber } from '@/lib/phone-numbers';

const TITLES: Record<string, string> = {
  mr: 'Mr.',
  ms: 'Ms.',
  dr: 'Dr.',
  mrs: 'Mrs.',
  miss: 'Miss',
  baby: 'Baby',
  master: 'Master',
};

const GENDERS: Record<string, string> = {
  male: 'Male',
  other: 'Other',
  female: 'Female',
};

type NamedPatient = {
  title: string | null;
  lastName: string;
  firstName: string;
  middleName: string | null;
};

export function patientFullName(patient: NamedPatient) {
  return [
    patient.title ? TITLES[patient.title] : null,
    patient.firstName,
    patient.middleName,
    patient.lastName,
  ]
    .filter(Boolean)
    .join(' ');
}

export function patientInitials(patient: NamedPatient) {
  return `${patient.firstName.charAt(0)}${patient.lastName.charAt(0)}`.toUpperCase();
}

/** "52 y · Female", with age taken on the Visit date (DD-MM-YYYY) from an ISO birth date. */
export function ageAndGender(dateOfBirth: string | null, gender: string | null, visitDate: string) {
  const parts: string[] = [];

  if (dateOfBirth) {
    const [birthYear, birthMonth, birthDay] = dateOfBirth.split('-').map(Number);
    const [day, month, year] = visitDate.split('-').map(Number);
    const hadBirthday = month > birthMonth || (month === birthMonth && day >= birthDay);
    const age = year - birthYear - (hadBirthday ? 0 : 1);

    if (age >= 0) parts.push(`${age} y`);
  }

  if (gender && GENDERS[gender]) parts.push(GENDERS[gender]);

  return parts.join(' · ');
}

function groupDigits(number: string) {
  if (number.length === 9) return `${number.slice(0, 2)} ${number.slice(2, 5)} ${number.slice(5)}`;
  if (number.length === 10) return `${number.slice(0, 3)} ${number.slice(3, 6)} ${number.slice(6)}`;
  return number;
}

/** "+971 50 000 4127" from a stored "+971500004127". */
export function displayPhone(stored: string) {
  const { country, number } = splitPhoneNumber(stored);
  const dialCode = getPhoneCountry(country)?.dialCode;

  return dialCode ? `+${dialCode} ${groupDigits(number)}` : stored;
}

function parts(value: Date | string, timeZone: string) {
  const formatted = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    formatted.find((item) => item.type === type)?.value ?? '';

  return {
    date: `${part('day')}-${part('month')}-${part('year')}`,
    time: `${part('hour')}:${part('minute')}`,
  };
}

/** "09:52" in the Tenant time zone. */
export function timeIn(value: Date | string, timeZone: string) {
  return parts(value, timeZone).time;
}

/** "18-11-2026 10:39" in the Tenant time zone. */
export function dateTimeIn(value: Date | string, timeZone: string) {
  const { date, time } = parts(value, timeZone);
  return `${date} ${time}`;
}

/** Whole minutes between two instants, or null when either is missing or out of order. */
export function minutesBetween(start: Date | string | null, end: Date | string | null) {
  if (!start || !end) return null;

  const minutes = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60_000);
  return minutes >= 0 ? minutes : null;
}

/** "250.00" */
export function money(value: number) {
  return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** "1.5" stays, "71.40" becomes "71.4", "158" stays. */
export function measurement(value: number) {
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(1)));
}

/** Weekday, short month and day of an ISO date, read as a calendar date. */
export function calendarParts(isoDate: string) {
  const date = new Date(`${isoDate}T00:00:00Z`);
  const format = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', ...options }).format(date);

  return {
    day: format({ day: 'numeric' }),
    month: format({ month: 'short' }).toUpperCase(),
    weekday: format({ weekday: 'long' }),
  };
}

/** "OPD Consultation, Specialist" style labels for enum values such as REPEATABLE or CARD. */
export function sentenceCase(value: string) {
  const lower = value.replace(/_/g, ' ').toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

// Conservative adult screening limits, matching the Visit's vital trends.
export function bloodPressureIsHigh(systolic: number, diastolic: number) {
  return systolic >= 140 || diastolic >= 90;
}
