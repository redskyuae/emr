import { describe, expect, it } from 'vitest';

import { shouldClearAddSessionsQueryParam } from './add-sessions-query-state';

describe('shouldClearAddSessionsQueryParam', () => {
  it('clears when there is no selected Patient', () => {
    expect(
      shouldClearAddSessionsQueryParam({
        hasCurrentPlans: true,
        hasPlansError: false,
        isPlansLoading: false,
        canAssignTreatment: true,
        hasSelectedPatient: false,
        isAssignPermissionError: false,
        isAssignPermissionLoading: false,
      })
    ).toBe(true);
  });

  it('clears after Treatment Plan assignment permission is denied', () => {
    expect(
      shouldClearAddSessionsQueryParam({
        hasCurrentPlans: true,
        hasPlansError: false,
        isPlansLoading: false,
        canAssignTreatment: false,
        hasSelectedPatient: true,
        isAssignPermissionError: false,
        isAssignPermissionLoading: false,
      })
    ).toBe(true);
  });

  it('keeps the parameter while permission is loading or errored', () => {
    expect(
      shouldClearAddSessionsQueryParam({
        hasCurrentPlans: true,
        hasPlansError: false,
        isPlansLoading: false,
        canAssignTreatment: false,
        hasSelectedPatient: true,
        isAssignPermissionError: false,
        isAssignPermissionLoading: true,
      })
    ).toBe(false);
    expect(
      shouldClearAddSessionsQueryParam({
        hasCurrentPlans: true,
        hasPlansError: false,
        isPlansLoading: false,
        canAssignTreatment: false,
        hasSelectedPatient: true,
        isAssignPermissionError: true,
        isAssignPermissionLoading: false,
      })
    ).toBe(false);
  });

  it('clears when the Plans query settles without a current Plan', () => {
    expect(
      shouldClearAddSessionsQueryParam({
        hasCurrentPlans: false,
        hasPlansError: false,
        isPlansLoading: false,
        canAssignTreatment: true,
        hasSelectedPatient: true,
        isAssignPermissionError: false,
        isAssignPermissionLoading: false,
      })
    ).toBe(true);
  });

  it('keeps the parameter while Plans are loading or errored', () => {
    expect(
      shouldClearAddSessionsQueryParam({
        hasCurrentPlans: false,
        hasPlansError: false,
        isPlansLoading: true,
        canAssignTreatment: true,
        hasSelectedPatient: true,
        isAssignPermissionError: false,
        isAssignPermissionLoading: false,
      })
    ).toBe(false);
    expect(
      shouldClearAddSessionsQueryParam({
        hasCurrentPlans: false,
        hasPlansError: true,
        isPlansLoading: false,
        canAssignTreatment: true,
        hasSelectedPatient: true,
        isAssignPermissionError: false,
        isAssignPermissionLoading: false,
      })
    ).toBe(false);
  });

  it('keeps the parameter when a Patient is selected and assignment is allowed', () => {
    expect(
      shouldClearAddSessionsQueryParam({
        hasCurrentPlans: true,
        hasPlansError: false,
        isPlansLoading: false,
        canAssignTreatment: true,
        hasSelectedPatient: true,
        isAssignPermissionError: false,
        isAssignPermissionLoading: false,
      })
    ).toBe(false);
  });
});
