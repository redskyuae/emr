// @vitest-environment jsdom

import { act, cleanup, renderHook } from '@testing-library/react';
import type { FieldErrors } from 'react-hook-form';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { captureAnalyticsEvent } from '@/lib/analytics/analytics-client';
import type { PatientFormValues } from '../_utils/patient-form-schema';
import { usePatientFormAnalytics } from './use-patient-form-analytics';

vi.mock('@/lib/analytics/analytics-client', () => ({ captureAnalyticsEvent: vi.fn() }));

const values = { hasEmiratesId: true, firstName: 'Asha' } as PatientFormValues;

describe('usePatientFormAnalytics', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(captureAnalyticsEvent).mockClear();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('should record completing a Provisional Patient as started then submitted', () => {
    const { result, unmount } = renderHook(() => usePatientFormAnalytics('complete_provisional'));

    vi.advanceTimersByTime(65_000);
    act(() => {
      result.current.recordSubmitted(values);
      result.current.recordSaved();
    });
    unmount();
    act(() => vi.runAllTimers());

    expect(vi.mocked(captureAnalyticsEvent).mock.calls).toEqual([
      ['patient_form_started', { mode: 'complete_provisional' }],
      [
        'patient_form_submitted',
        { mode: 'complete_provisional', has_emirates_id: true, seconds_since_started: 65 },
      ],
    ]);
  });

  it('should record leaving without saving as abandoned', () => {
    const { unmount } = renderHook(() => usePatientFormAnalytics('register'));

    vi.advanceTimersByTime(12_000);
    unmount();
    act(() => vi.runAllTimers());

    expect(captureAnalyticsEvent).toHaveBeenLastCalledWith('patient_form_abandoned', {
      mode: 'register',
      seconds_since_started: 12,
    });
  });

  it('should record a blocked Registration submit with field names only', () => {
    const { result } = renderHook(() => usePatientFormAnalytics('register'));
    const errors: FieldErrors<PatientFormValues> = {
      lastName: { type: 'too_small', message: 'Last name is required' },
      phone: { type: 'custom', message: 'Phone is required' },
    };

    act(() => result.current.recordInvalid(errors));

    expect(captureAnalyticsEvent).toHaveBeenLastCalledWith('form_validation_failed', {
      form: 'patient_registration',
      invalid_field_count: 2,
      invalid_fields: ['lastName', 'phone'],
    });
  });

  it('should record nothing until the form is shown', () => {
    renderHook(() => usePatientFormAnalytics(null));

    expect(captureAnalyticsEvent).not.toHaveBeenCalled();
  });
});
