export class PatientInactiveConflictError extends Error {
  constructor() {
    super('Visit patient is Inactive and cannot be selected for a new Visit.');
    this.name = 'PatientInactiveConflictError';
  }
}
