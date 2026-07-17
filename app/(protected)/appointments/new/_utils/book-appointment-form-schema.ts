import { z } from 'zod';

const patientModeValues = ['existing', 'provisional'] as const;
const patientGenderValues = ['male', 'female', 'other', 'unknown'] as const;

function isIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

const requiredIdString = (fieldName: string) =>
  z
    .string()
    .trim()
    .min(1, `${fieldName} is required`)
    .refine((value) => /^\d+$/.test(value), `${fieldName} is required`);

const optionalTrimmedString = (maxLength: number, message: string) =>
  z.string().trim().max(maxLength, message);

export const bookAppointmentFormSchema = z
  .object({
    patientId: z.string().trim(),
    lastName: z.string().trim(),
    firstName: z.string().trim(),
    middleName: optionalTrimmedString(100, 'Patient middle name must be at most 100 characters'),
    gender: z.enum(patientGenderValues).or(z.literal('')),
    dateOfBirth: z
      .string()
      .trim()
      .refine((value) => value === '' || isIsoDate(value), 'Date of birth must be a valid date'),
    phone: z.string().trim(),
    email: z
      .string()
      .trim()
      .refine((value) => value === '' || z.email().safeParse(value).success, {
        message: 'Patient email must be valid',
      }),
    patientMode: z.enum(patientModeValues),
    doctorId: requiredIdString('Doctor'),
    appointmentModeId: requiredIdString('Appointment Mode'),
    appointmentTypeId: requiredIdString('Appointment Type'),
    appointmentReasonId: requiredIdString('Appointment Reason'),
    slotDate: z
      .string()
      .trim()
      .min(1, 'Slot date is required')
      .refine(isIsoDate, 'Slot date must be a valid date'),
    doctorRotaId: requiredIdString('Doctor Rota'),
    slotTimes: z.array(z.string()).min(1, 'At least one DoctorSlot is required'),
    remarks: optionalTrimmedString(1000, 'Remarks must be at most 1000 characters'),
  })
  .superRefine((data, context) => {
    if (data.patientMode === 'existing' && data.patientId.trim() === '') {
      context.addIssue({
        code: 'custom',
        path: ['patientId'],
        message: 'Patient is required',
      });
    }

    if (data.patientMode === 'provisional') {
      if (data.firstName.trim() === '') {
        context.addIssue({
          code: 'custom',
          path: ['firstName'],
          message: 'Patient first name is required',
        });
      }

      if (data.lastName.trim() === '') {
        context.addIssue({
          code: 'custom',
          path: ['lastName'],
          message: 'Patient last name is required',
        });
      }

      if (data.phone.trim() === '') {
        context.addIssue({
          code: 'custom',
          path: ['phone'],
          message: 'Patient phone is required',
        });
      }
    }
  });

export type BookAppointmentFormValues = z.infer<typeof bookAppointmentFormSchema>;

export const EMPTY_BOOK_APPOINTMENT_FORM_VALUES: BookAppointmentFormValues = {
  patientId: '',
  lastName: '',
  firstName: '',
  middleName: '',
  gender: '',
  dateOfBirth: '',
  phone: '',
  email: '',
  patientMode: 'existing',
  doctorId: '',
  appointmentModeId: '',
  appointmentTypeId: '',
  appointmentReasonId: '',
  slotDate: '',
  doctorRotaId: '',
  slotTimes: [],
  remarks: '',
};
