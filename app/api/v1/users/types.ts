import type { Staff, StaffWithRoles } from '@/app/api/lib/modules/staff/schemas/staff-schema';
import type { Paginated } from '@/app/api/lib/utils/types';

export type ListStaffResponse = Paginated<StaffWithRoles>;

export type SaveStaffRequest = {
  name: string;
  email: string;
  password: string;
  roleIds: number[];
  phone?: string;
  staffCode?: string;
  designation?: string;
  gender?: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
  dateOfBirth?: string;
};

export type SaveStaffResponse = {
  data: Staff;
};
