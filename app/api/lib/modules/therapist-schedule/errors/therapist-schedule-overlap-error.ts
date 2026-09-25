export class TherapistScheduleOverlapError extends Error {
  constructor() {
    super('Therapist schedule overlaps with an existing schedule.');
    this.name = 'TherapistScheduleOverlapError';
  }
}
