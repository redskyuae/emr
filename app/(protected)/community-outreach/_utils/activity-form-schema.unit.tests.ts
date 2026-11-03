import { describe, expect, it } from 'vitest';

import { activityFormSchema, type ActivityFormValues } from './activity-form-schema';
import { defaultActivityValues } from './activity-options';
import { contactFormSchema } from './contact-form-schema';
import { buildCallListCsv } from './call-list-csv';
import { SEED_STATE } from '../_data/outreach-seed';

function messagesFor(values: ActivityFormValues) {
  const result = activityFormSchema.safeParse(values);

  return result.success ? [] : result.error.issues.map((issue) => issue.message);
}

const validCamp: ActivityFormValues = {
  ...defaultActivityValues('camp'),
  title: 'Free Prakriti assessment',
  venue: 'Panchayat Hall',
  area: 'Thrikkakara',
};

describe('activityFormSchema', () => {
  it('should accept a complete wellness camp', () => {
    expect(messagesFor(validCamp)).toEqual([]);
  });

  it('should require title, venue and area', () => {
    expect(messagesFor({ ...validCamp, title: ' ', venue: '', area: '' })).toEqual([
      'Title is required.',
      'Area is required.',
      'Venue is required.',
    ]);
  });

  it('should word the venue message for a home visit', () => {
    const visit = { ...defaultActivityValues('visit'), title: 'Visit', area: 'Kaloor' };

    expect(messagesFor(visit)).toEqual([
      'House name or number is required.',
      'Person to meet is required.',
      'Enter a 10-digit mobile number.',
      'Reason for the visit is required.',
    ]);
  });

  it('should require the end time to be after the start time', () => {
    expect(messagesFor({ ...validCamp, startTime: '10:00', endTime: '09:00' })).toEqual([
      'End time must be after the start time.',
    ]);
  });

  it('should require at least one assigned staff member', () => {
    expect(messagesFor({ ...validCamp, staffIds: [] })).toEqual([
      'Assign at least one staff member.',
    ]);
  });

  it('should reject non-numeric audience and reach counts', () => {
    expect(messagesFor({ ...validCamp, expectedAudience: 'sixty', reached: '1.5' })).toEqual([
      'Enter a whole number.',
      'Enter a whole number.',
    ]);
  });
});

describe('contactFormSchema', () => {
  const valid = {
    name: 'Anjali Menon',
    phone: '98470 21436',
    address: '',
    interests: [],
    notes: '',
    consent: true,
    activityId: 'a3',
  };

  it('should accept a ten-digit phone number with spaces', () => {
    expect(contactFormSchema.safeParse(valid).success).toBe(true);
  });

  it('should reject a short phone number and a missing activity', () => {
    const result = contactFormSchema.safeParse({ ...valid, phone: '98470', activityId: '' });

    expect(result.success ? [] : result.error.issues.map((issue) => issue.message)).toEqual([
      'Enter a 10-digit mobile number.',
      'Choose the activity this contact came from.',
    ]);
  });
});

describe('buildCallListCsv', () => {
  it('should leave out contacts who did not agree to be contacted', () => {
    const csv = buildCallListCsv(SEED_STATE.contacts);

    expect(csv.split('\n')).toHaveLength(8);
    expect(csv).not.toContain('Fathima Beevi');
    expect(csv).toContain('"Sreeja Varghese","+91 98470 21436"');
  });
});
