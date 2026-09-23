import type { Therapist } from '@/app/api/lib/modules/therapist/schemas/therapist-schema';
import type { SaveTherapistRequest } from '@/app/api/v1/therapists/types';
import type { TherapistFormValues } from './therapist-form-schema';

export const EMPTY_THERAPIST_FORM_VALUES: TherapistFormValues = {
  name: '',
  email: '',
  password: '',
  phone: '',
  staffCode: '',
  designation: '',
  gender: undefined,
  dateOfBirth: '',
  qualifications: '',
  registrationNumber: '',
  therapistSkillIds: [],
};

export function therapistToFormValues(therapist: Therapist): TherapistFormValues {
  return {
    name: therapist.name,
    email: therapist.email,
    password: '',
    phone: therapist.phone ?? '',
    staffCode: therapist.staffCode ?? '',
    designation: therapist.designation ?? '',
    gender: therapist.gender ?? undefined,
    dateOfBirth: therapist.dateOfBirth ?? '',
    qualifications: therapist.qualifications ?? '',
    registrationNumber: therapist.registrationNumber ?? '',
    therapistSkillIds: therapist.skills.map((skill) => skill.id),
  };
}

export function buildCreateTherapistRequest(values: TherapistFormValues): SaveTherapistRequest {
  return {
    ...values,
    password: values.password ?? '',
    therapistSkillIds: values.therapistSkillIds,
  };
}

export function buildUpdateTherapistRequest(values: TherapistFormValues) {
  const { email: _email, password: _password, ...request } = values;
  return request;
}
