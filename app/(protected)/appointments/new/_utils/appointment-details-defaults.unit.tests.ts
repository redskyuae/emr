import { describe, expect, it } from 'vitest';

import { getAppointmentDetailsDefaults } from './appointment-details-defaults';

const options = {
  modes: [
    { id: 11, code: 'VID' },
    { id: 12, code: 'INP' },
  ],
  types: [
    { id: 21, code: 'FUP' },
    { id: 22, code: 'NEW' },
  ],
  reasons: [
    { id: 31, code: 'RCHK' },
    { id: 32, code: 'CONS' },
  ],
};

describe('getAppointmentDetailsDefaults', () => {
  it('should choose the seeded Consultation defaults even when they are not first', () => {
    expect(
      getAppointmentDetailsDefaults(
        {
          appointmentModeId: '',
          appointmentTypeId: '',
          appointmentReasonId: '',
        },
        options
      )
    ).toEqual({
      appointmentModeId: '12',
      appointmentTypeId: '22',
      appointmentReasonId: '32',
    });
  });

  it('should preserve valid user selections', () => {
    expect(
      getAppointmentDetailsDefaults(
        {
          appointmentModeId: '11',
          appointmentTypeId: '21',
          appointmentReasonId: '31',
        },
        options
      )
    ).toEqual({
      appointmentModeId: '11',
      appointmentTypeId: '21',
      appointmentReasonId: '31',
    });
  });

  it('should use the first available option when the seeded defaults are unavailable', () => {
    expect(
      getAppointmentDetailsDefaults(
        {
          appointmentModeId: '',
          appointmentTypeId: '',
          appointmentReasonId: '',
        },
        {
          modes: [{ id: 11, code: 'VID' }],
          types: [{ id: 21, code: 'FUP' }],
          reasons: [{ id: 31, code: 'RCHK' }],
        }
      )
    ).toEqual({
      appointmentModeId: '11',
      appointmentTypeId: '21',
      appointmentReasonId: '31',
    });
  });
});
