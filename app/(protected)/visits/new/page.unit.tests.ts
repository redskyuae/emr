import { describe, expect, it } from 'vitest';

import CreateVisitPage from './page';

describe('Create Visit deep link', () => {
  it('should pass the Appointment ID from the URL to the Create Visit form', async () => {
    const element = await CreateVisitPage({
      searchParams: Promise.resolve({ appointmentId: '42' }),
    });

    expect(element.props.initialAppointmentId).toBe(42);
    expect(element.key).toBe('42');
  });

  it('should ignore malformed Appointment IDs', async () => {
    for (const appointmentId of ['abc', '-1', '0', '9007199254740992']) {
      const element = await CreateVisitPage({ searchParams: Promise.resolve({ appointmentId }) });
      expect(element.props.initialAppointmentId).toBeNull();
    }
  });
});
