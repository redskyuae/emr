import { describe, expect, it } from 'vitest';

import {
  ageAndSex,
  displayDate,
  displayDateIn,
  displayPlace,
  noteText,
  patientFullName,
  patientInitials,
  sessionText,
} from './consolidated-report-format';

const patient = { title: 'mr', firstName: 'Rajesh', middleName: 'Kumar', lastName: 'K' };

describe('consolidated report format', () => {
  it('should name the Patient with title and middle name when present', () => {
    expect(patientFullName(patient)).toBe('Mr. Rajesh Kumar K');
    expect(patientFullName({ ...patient, title: null, middleName: null })).toBe('Rajesh K');
    expect(patientInitials(patient)).toBe('RK');
  });

  it('should take the age on the report end date', () => {
    expect(ageAndSex('1974-11-20', 'male', '20-11-2026')).toBe('52 yrs / Male');
    expect(ageAndSex('1974-11-21', 'male', '20-11-2026')).toBe('51 yrs / Male');
    expect(ageAndSex(null, 'female', '20-11-2026')).toBe('Female');
    expect(ageAndSex(null, null, '20-11-2026')).toBe('—');
  });

  it('should show API dates and moments as day, short month and year', () => {
    expect(displayDate('03-11-2026')).toBe('03 Nov 2026');
    // 20:00 UTC on the 19th is already the 20th in India.
    expect(displayDateIn('2026-11-19T20:00:00Z', 'Asia/Kolkata')).toBe('20 Nov 2026');
  });

  it('should join city and state, or show a dash', () => {
    expect(displayPlace('Thrissur', 'Kerala')).toBe('Thrissur, Kerala');
    expect(displayPlace(null, null)).toBe('—');
  });

  it('should describe a Session given in a Visit', () => {
    const session = {
      label: 'Day 2',
      completed: true,
      procedure: 'Janu Basti with Murivenna',
      sessionNumber: 2,
      treatmentName: 'Janu Basti',
      totalSessions: 7,
    };

    expect(sessionText(session)).toBe('Janu Basti, Session 2 of 7: Janu Basti with Murivenna');
    expect(sessionText({ ...session, procedure: null, completed: false })).toBe(
      'Janu Basti, Session 2 of 7: Day 2 (in progress)'
    );
  });

  it('should prefer the assessment, else the subjective and objective findings', () => {
    expect(noteText({ assessment: 'Pain 6/10', subjective: 'S', objective: 'O' })).toBe(
      'Pain 6/10'
    );
    expect(noteText({ assessment: ' ', subjective: 'Knee pain.', objective: 'Crepitus.' })).toBe(
      'Knee pain. Crepitus.'
    );
  });
});
