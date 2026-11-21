// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { PatientVitalSign } from '@/app/api/lib/modules/patient-vital-sign/schemas/patient-vital-sign-schema';

import { VisitObjectiveVitals } from './visit-objective-vitals';

vi.mock('./visit-vital-trends', () => ({ VisitVitalTrends: () => null }));

const reading = {
  id: 3,
  visitId: 7,
  recordedAt: new Date('2026-07-18T20:30:00.000Z'),
  systolic: 120,
  diastolic: 80,
  pulseBpm: 72,
  temperatureC: null,
  spo2: null,
  weightKg: null,
} as PatientVitalSign;

afterEach(cleanup);

describe('Visit objective Vital Signs', () => {
  it('should show amendable reading times in the Tenant time zone', () => {
    render(
      createElement(VisitObjectiveVitals, {
        visitId: 7,
        readings: [reading],
        timeZone: 'Asia/Dubai',
        loading: false,
        error: false,
        canRecord: false,
        onRecord: vi.fn(),
        onAmend: vi.fn(),
      })
    );

    const dubaiTime = new Date(reading.recordedAt).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Dubai',
    });
    expect(dubaiTime).toMatch(/00:30|12:30/);
    expect(screen.getByRole('button', { name: `Amend the ${dubaiTime} reading` })).toBeTruthy();
  });
});
