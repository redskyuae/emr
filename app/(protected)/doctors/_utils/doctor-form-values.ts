import type { Doctor } from '@/app/api/lib/modules/doctor/schemas/doctor-schema';
import type { SaveDoctorRequest } from '@/app/api/v1/doctors/types';
import type { UpdateDoctorRequest } from '@/app/api/v1/doctors/[id]/types';
import type { DoctorFormValues } from './doctor-form-schema';

export const EMPTY_DOCTOR_FORM_VALUES: DoctorFormValues = {
  name: '',
  email: '',
  password: '',
  specialtyId: '',
  gender: '',
  dateOfBirth: '',
  staffCode: '',
  designation: '',
  qualifications: '',
  registrationNumber: '',
};

function valueOrUndefined(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function valueOrNull(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function doctorToFormValues(doctor: Doctor | null): DoctorFormValues {
  if (!doctor) {
    return EMPTY_DOCTOR_FORM_VALUES;
  }

  return {
    name: doctor.name,
    email: doctor.email,
    password: '',
    specialtyId: String(doctor.specialtyId),
    gender: doctor.gender ?? '',
    dateOfBirth: doctor.dateOfBirth ?? '',
    staffCode: doctor.staffCode ?? '',
    designation: doctor.designation ?? '',
    qualifications: doctor.qualifications ?? '',
    registrationNumber: doctor.registrationNumber ?? '',
  };
}

export function buildCreateDoctorRequest(values: DoctorFormValues): SaveDoctorRequest {
  return {
    name: values.name.trim(),
    email: values.email.trim(),
    password: values.password,
    specialtyId: Number(values.specialtyId),
    gender: values.gender === '' ? undefined : values.gender,
    dateOfBirth: valueOrUndefined(values.dateOfBirth),
    staffCode: valueOrUndefined(values.staffCode),
    designation: valueOrUndefined(values.designation),
    qualifications: valueOrUndefined(values.qualifications),
    registrationNumber: valueOrUndefined(values.registrationNumber),
  };
}

export function buildUpdateDoctorRequest(values: DoctorFormValues): UpdateDoctorRequest {
  return {
    name: values.name.trim(),
    specialtyId: Number(values.specialtyId),
    gender: values.gender === '' ? null : values.gender,
    dateOfBirth: valueOrNull(values.dateOfBirth),
    staffCode: valueOrNull(values.staffCode),
    designation: valueOrNull(values.designation),
    qualifications: valueOrNull(values.qualifications),
    registrationNumber: valueOrNull(values.registrationNumber),
  };
}
