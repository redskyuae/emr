import { z } from 'zod';

import { ROOM_STATUSES } from '@/app/db/schema/room';

export const roomFormSchema = z.object({
  roomNumber: z
    .string()
    .trim()
    .min(1, 'Room number is required.')
    .max(20, 'Room number must be at most 20 characters.'),
  roomTypeId: z
    .string()
    .trim()
    .min(1, 'Room Type is required.')
    .refine((value) => /^\d+$/.test(value), 'Room Type is required.'),
  status: z.enum(ROOM_STATUSES, { error: 'Status is required.' }),
  bedCount: z
    .string()
    .trim()
    .min(1, 'Bed count is required.')
    .refine((value) => /^\d+$/.test(value), 'Bed count must be a whole number.')
    .refine((value) => Number(value) >= 1, 'Bed count must be at least 1.')
    .refine((value) => Number(value) <= 50, 'Bed count must be at most 50.'),
  floor: z.string().trim().max(20, 'Floor must be at most 20 characters.'),
  wing: z.string().trim().max(50, 'Wing must be at most 50 characters.'),
  facility: z.string().trim().max(150, 'Facility must be at most 150 characters.'),
  department: z.string().trim().max(150, 'Department must be at most 150 characters.'),
  notes: z.string().trim().max(500, 'Notes must be at most 500 characters.'),
});

export type RoomFormValues = z.infer<typeof roomFormSchema>;
