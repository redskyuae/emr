import type { Doctor } from '@/app/api/lib/modules/doctor/schemas/doctor-schema';
import type { Paginated } from '@/app/api/lib/utils/types';

export type ListDoctorsResponse = Paginated<Doctor>;

export type SaveDoctorRequest = {
  name: string;
  email: string;
  password: string;
  specialtyId: number;
  gender?: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
  dateOfBirth?: string;
  staffCode?: string;
  designation?: string;
  qualifications?: string;
  registrationNumber?: string;
};

export type SaveDoctorResponse = {
  data: Doctor;
};
