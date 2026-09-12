import { describe, expect, it } from 'vitest';

import { transformDoctorSlotsResponse } from './useDoctorSlots';

describe('Doctor slot query transform', () => {
  it('should flatten API rotas into scheduling options', () => {
    expect(
      transformDoctorSlotsResponse({
        data: [
          {
            slotDate: '2026-09-15',
            status: 'Available',
            rotas: [
              {
                doctorRotaId: 12,
                rotaName: 'Morning',
                duration: 15,
                slots: [
                  { slot: 1, slotTime: '09:00', slotStatus: 'Available' },
                  { slot: 2, slotTime: '09:15', slotStatus: 'Booked' },
                ],
              },
            ],
          },
        ],
      })
    ).toEqual([
      {
        id: '12',
        name: 'Morning',
        duration: 15,
        slots: [
          { time: '09:00', status: 'Available' },
          { time: '09:15', status: 'Booked' },
        ],
      },
    ]);
  });
});
