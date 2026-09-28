import { describe, expect, it } from 'vitest';

import {
  canSelectProcedureResource,
  getProcedureResourceOptions,
} from './procedure-resource-options';

describe('Procedure resource options', () => {
  it('should retain booked resources and mark them unavailable', () => {
    const resources = [
      { id: 1, name: 'Room 1' },
      { id: 2, name: 'Room 2' },
    ];

    expect(getProcedureResourceOptions(resources, [2])).toEqual([
      { resource: resources[0], isBooked: false },
      { resource: resources[1], isBooked: true },
    ]);
  });

  it('should prevent selection while availability is loading or the resource is booked', () => {
    expect(
      canSelectProcedureResource({
        canAllocate: true,
        isAvailabilityLoading: true,
        isAvailabilityReady: false,
        isBooked: false,
        patientUnavailable: false,
      })
    ).toBe(false);
    expect(
      canSelectProcedureResource({
        canAllocate: true,
        isAvailabilityLoading: false,
        isAvailabilityReady: true,
        isBooked: true,
        patientUnavailable: false,
      })
    ).toBe(false);
    expect(
      canSelectProcedureResource({
        canAllocate: true,
        isAvailabilityLoading: false,
        isAvailabilityReady: true,
        isBooked: false,
        patientUnavailable: true,
      })
    ).toBe(false);
    expect(
      canSelectProcedureResource({
        canAllocate: true,
        isAvailabilityLoading: false,
        isAvailabilityReady: true,
        isBooked: false,
        patientUnavailable: false,
      })
    ).toBe(true);
  });

  it('should require a successful availability result before enabling selection', () => {
    expect(
      canSelectProcedureResource({
        canAllocate: true,
        isAvailabilityLoading: false,
        isAvailabilityReady: false,
        isBooked: false,
        patientUnavailable: false,
      })
    ).toBe(false);
  });
});
