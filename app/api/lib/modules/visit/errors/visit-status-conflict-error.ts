export class VisitStatusConflictError extends Error {
  constructor() {
    super('Visit status changed since it was loaded. Reload and try again.');
    this.name = 'VisitStatusConflictError';
  }
}
