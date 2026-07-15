import type { RoomStatus } from '@/app/api/lib/modules/room/schemas/room-schema';
import { ROOM_STATUSES } from '@/app/db/schema/room';

type RoomStatusPresentation = {
  label: string;
  className: string;
};

const ROOM_STATUS_PRESENTATION: Record<RoomStatus, RoomStatusPresentation> = {
  AVAILABLE: {
    label: 'Available',
    className:
      'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300',
  },
  OCCUPIED: {
    label: 'Occupied',
    className:
      'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300',
  },
  RESERVED: {
    label: 'Reserved',
    className:
      'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950 dark:text-violet-300',
  },
  MAINTENANCE: {
    label: 'Maintenance',
    className:
      'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300',
  },
  CLEANING: {
    label: 'Cleaning',
    className:
      'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300',
  },
};

export const ROOM_STATUS_OPTIONS = ROOM_STATUSES.map((status) => ({
  value: status,
  label: ROOM_STATUS_PRESENTATION[status].label,
}));

export function getRoomStatusLabel(status: RoomStatus) {
  return ROOM_STATUS_PRESENTATION[status].label;
}

export function getRoomStatusClassName(status: RoomStatus) {
  return ROOM_STATUS_PRESENTATION[status].className;
}
