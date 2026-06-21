import type { Staff } from '@/app/api/lib/modules/staff/schemas/staff-schema';

export type GetStaffResponse = {
  data: Staff;
};

export type UpdateStaffRequest = {
  name?: string;
  phone?: string | null;
  staffCode?: string | null;
  designation?: string | null;
  gender?: 'Male' | 'Female' | 'Other' | 'Prefer not to say' | null;
  dateOfBirth?: string | null;
};

export type UpdateStaffResponse = {
  data: Staff;
};
