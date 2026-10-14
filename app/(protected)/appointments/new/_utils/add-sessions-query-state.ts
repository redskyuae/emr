type AddSessionsQueryState = {
  hasCurrentPlans: boolean;
  hasPlansError: boolean;
  isPlansLoading: boolean;
  canAssignTreatment: boolean;
  hasSelectedPatient: boolean;
  isAssignPermissionError: boolean;
  isAssignPermissionLoading: boolean;
};

export function shouldClearAddSessionsQueryParam({
  hasCurrentPlans,
  hasPlansError,
  isPlansLoading,
  canAssignTreatment,
  hasSelectedPatient,
  isAssignPermissionError,
  isAssignPermissionLoading,
}: AddSessionsQueryState) {
  const accessDenied =
    !isAssignPermissionLoading && !isAssignPermissionError && !canAssignTreatment;
  const hasNoCurrentPlans = !isPlansLoading && !hasPlansError && !hasCurrentPlans;

  return accessDenied || !hasSelectedPatient || hasNoCurrentPlans;
}
