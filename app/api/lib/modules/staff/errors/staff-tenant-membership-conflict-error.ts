export class StaffTenantMembershipConflictError extends Error {
  constructor() {
    super('Staff user already belongs to a Tenant.');
    this.name = 'StaffTenantMembershipConflictError';
  }
}
