export class OpenVisitConflictError extends Error {
  constructor(visitNumber: string) {
    super(
      `Patient already has an Open Visit (${visitNumber}). Complete or cancel it before starting a new Visit.`
    );
    this.name = 'OpenVisitConflictError';
  }
}
