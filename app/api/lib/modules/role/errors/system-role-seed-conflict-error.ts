export class SystemRoleSeedConflictError extends Error {
  constructor() {
    super('System Role seeding failed because a reserved Role code is unavailable.');
    this.name = 'SystemRoleSeedConflictError';
  }
}
