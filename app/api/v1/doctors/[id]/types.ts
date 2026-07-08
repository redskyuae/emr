import type { Doctor } from '@/app/api/lib/modules/doctor/schemas/doctor-schema';

export type DoctorResponse = {
  data: Doctor;
};

export type UpdateDoctorRequest = {
  name?: string;
  specialtyId?: number;
  gender?: 'Male' | 'Female' | 'Other' | 'Prefer not to say' | null;
  dateOfBirth?: string | null;
  staffCode?: string | null;
  designation?: string | null;
  qualifications?: string | null;
  registrationNumber?: string | null;
};

export type SaveDoctorResponse = {
  data: Doctor;
};
