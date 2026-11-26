import type { Doctor } from '../../doctor/schemas/doctor-schema';
import type { Role } from '../../role/schemas/role-schema';
import type { Staff } from '../../staff/schemas/staff-schema';
import type { Tenant } from '../../tenant/schemas/tenant-schema';

export type CurrentUserMembership = {
  role: string;
};

export type CurrentUserTenant = Pick<Tenant, 'id' | 'name' | 'slug' | 'isActive' | 'timeZone'>;

export type CurrentUserRoleSummary = Pick<Role, 'id' | 'name' | 'code'>;

export type CurrentUserStaffProfile = Pick<
  Staff,
  'isActive' | 'gender' | 'staffCode' | 'designation' | 'dateOfBirth'
>;

/** The Doctor record linked to this user in the Active Tenant, used to scope their own Visits. */
export type CurrentUserDoctorProfile = Pick<Doctor, 'id' | 'isActive'>;

export type CurrentUserIdentity = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  phone: string | null;
  emailVerified: boolean;
  staffProfile: CurrentUserStaffProfile | null;
  doctorProfile: CurrentUserDoctorProfile | null;
};

export type CurrentUser = {
  permissions: string[];
  user: CurrentUserIdentity;
  tenant: CurrentUserTenant;
  roles: CurrentUserRoleSummary[];
  membership: CurrentUserMembership;
};
