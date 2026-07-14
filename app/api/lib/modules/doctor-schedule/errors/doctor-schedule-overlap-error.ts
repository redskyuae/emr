export class DoctorScheduleOverlapError extends Error {
  constructor() {
    super('Doctor schedule overlaps with an existing schedule.');
    this.name = 'DoctorScheduleOverlapError';
  }
}
