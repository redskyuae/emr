export type ProcedureResourceOption<TResource> = {
  resource: TResource;
  isBooked: boolean;
};

export function getProcedureResourceOptions<TResource extends { id: number }>(
  resources: TResource[],
  unavailableIds: readonly number[]
): ProcedureResourceOption<TResource>[] {
  const unavailable = new Set(unavailableIds);

  return resources.map((resource) => ({
    resource,
    isBooked: unavailable.has(resource.id),
  }));
}

export function canSelectProcedureResource({
  canAllocate,
  isAvailabilityLoading,
  isAvailabilityReady,
  isBooked,
  patientUnavailable,
}: {
  canAllocate: boolean;
  isAvailabilityLoading: boolean;
  isAvailabilityReady: boolean;
  isBooked: boolean;
  patientUnavailable: boolean;
}) {
  return (
    canAllocate && isAvailabilityReady && !isAvailabilityLoading && !isBooked && !patientUnavailable
  );
}
