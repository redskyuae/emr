import { describe, expect, it } from 'vitest';

import {
  ageAndGender,
  bloodPressureIsHigh,
  calendarParts,
  dateTimeIn,
  displayPhone,
  measurement,
  minutesBetween,
  money,
  patientFullName,
  patientInitials,
  sentenceCase,
  timeIn,
} from './visit-summary-format';

const patient = { title: 'mrs', firstName: 'Lakshmi', middleName: null, lastName: 'Raghavan' };

describe('Visit Summary formatting', () => {
  it('should build the printed name and initials', () => {
    expect(patientFullName(patient)).toBe('Mrs. Lakshmi Raghavan');
    expect(patientFullName({ ...patient, title: null, middleName: 'Devi' })).toBe(
      'Lakshmi Devi Raghavan'
    );
    expect(patientInitials(patient)).toBe('LR');
  });

  it('should give the age on the Visit date with the gender', () => {
    expect(ageAndGender('1974-03-02', 'female', '18-11-2026')).toBe('52 y · Female');
    expect(ageAndGender('1974-12-02', 'male', '18-11-2026')).toBe('51 y · Male');
    expect(ageAndGender(null, 'unknown', '18-11-2026')).toBe('');
  });

  it('should group a stored phone number by its calling code', () => {
    expect(displayPhone('+971500004127')).toBe('+971 50 000 4127');
    expect(displayPhone('+919876543210')).toBe('+91 987 654 3210');
  });

  it('should show times in the Tenant time zone', () => {
    expect(timeIn('2026-11-18T05:52:00.000Z', 'Asia/Dubai')).toBe('09:52');
    expect(dateTimeIn('2026-11-19T05:42:00.000Z', 'Asia/Dubai')).toBe('19-11-2026 09:42');
  });

  it('should count whole minutes and ignore missing or reversed times', () => {
    expect(minutesBetween('2026-11-18T05:52:00Z', '2026-11-18T06:08:00Z')).toBe(16);
    expect(minutesBetween(null, '2026-11-18T06:08:00Z')).toBeNull();
    expect(minutesBetween('2026-11-18T06:08:00Z', '2026-11-18T05:52:00Z')).toBeNull();
  });

  it('should format money, measurements and enum labels', () => {
    expect(money(250)).toBe('250.00');
    expect(money(1234.5)).toBe('1,234.50');
    expect(measurement(71.4)).toBe('71.4');
    expect(measurement(28.63)).toBe('28.6');
    expect(measurement(158)).toBe('158');
    expect(sentenceCase('REPEATABLE')).toBe('Repeatable');
  });

  it('should read an ISO date as a calendar date', () => {
    expect(calendarParts('2026-11-20')).toEqual({ day: '20', month: 'NOV', weekday: 'Friday' });
  });

  it('should flag blood pressure at the Visit trends limits', () => {
    expect(bloodPressureIsHigh(140, 80)).toBe(true);
    expect(bloodPressureIsHigh(132, 90)).toBe(true);
    expect(bloodPressureIsHigh(132, 84)).toBe(false);
  });
});
