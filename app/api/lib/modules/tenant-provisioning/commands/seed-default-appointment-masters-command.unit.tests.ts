import { beforeEach, describe, expect, it, vi } from 'vitest';

import { appointmentCancelledReasonRepository } from '../../appointment-cancelled-reason/repository/appointment-cancelled-reason-repository';
import { appointmentModeRepository } from '../../appointment-mode/repository/appointment-mode-repository';
import { appointmentReasonRepository } from '../../appointment-reason/repository/appointment-reason-repository';
import { appointmentStatusRepository } from '../../appointment-status/repository/appointment-status-repository';
import { appointmentTypeRepository } from '../../appointment-type/repository/appointment-type-repository';
import { seedDefaultAppointmentMastersCommand } from './seed-default-appointment-masters-command';

vi.mock(
  '../../appointment-cancelled-reason/repository/appointment-cancelled-reason-repository',
  () => ({
    appointmentCancelledReasonRepository: { seedDefaultAppointmentCancelledReasons: vi.fn() },
  })
);
vi.mock('../../appointment-mode/repository/appointment-mode-repository', () => ({
  appointmentModeRepository: { seedDefaultAppointmentModes: vi.fn() },
}));
vi.mock('../../appointment-reason/repository/appointment-reason-repository', () => ({
  appointmentReasonRepository: { seedDefaultAppointmentReasons: vi.fn() },
}));
vi.mock('../../appointment-status/repository/appointment-status-repository', () => ({
  appointmentStatusRepository: { seedDefaultAppointmentStatuses: vi.fn() },
}));
vi.mock('../../appointment-type/repository/appointment-type-repository', () => ({
  appointmentTypeRepository: { seedDefaultAppointmentTypes: vi.fn() },
}));

const cancellationReasonRepo = vi.mocked(appointmentCancelledReasonRepository);
const modeRepo = vi.mocked(appointmentModeRepository);
const reasonRepo = vi.mocked(appointmentReasonRepository);
const statusRepo = vi.mocked(appointmentStatusRepository);
const typeRepo = vi.mocked(appointmentTypeRepository);

describe('Seed default Appointment Masters command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cancellationReasonRepo.seedDefaultAppointmentCancelledReasons.mockResolvedValue(undefined);
    modeRepo.seedDefaultAppointmentModes.mockResolvedValue(undefined);
    reasonRepo.seedDefaultAppointmentReasons.mockResolvedValue(undefined);
    statusRepo.seedDefaultAppointmentStatuses.mockResolvedValue(undefined);
    typeRepo.seedDefaultAppointmentTypes.mockResolvedValue(undefined);
  });

  it('should seed Rebooked Elsewhere instead of treating cancellation as rescheduling', async () => {
    await seedDefaultAppointmentMastersCommand('tenant-1');

    expect(cancellationReasonRepo.seedDefaultAppointmentCancelledReasons).toHaveBeenCalledWith(
      'tenant-1',
      expect.arrayContaining([
        {
          code: 'RSCH',
          name: 'Rebooked Elsewhere',
          description: 'Appointment was replaced by another booking',
        },
      ])
    );
  });
});
