import { z } from 'zod';

import type { PatientTreatmentPlanReadSession } from '@/app/api/lib/modules/patient-treatment-plan/schemas/patient-treatment-plan-schema';
import type { UpdatePatientTreatmentPlanSessionRequest } from '@/app/api/v1/patients/[id]/treatment-plans/[planId]/sessions/[sessionId]/types';

const planText = (label: string) =>
  z.string().trim().max(5000, `${label} must be at most 5000 characters.`);

const planMinutes = (label: string, min: number) =>
  z
    .string()
    .trim()
    .refine(
      (value) =>
        value === '' || (/^\d+$/.test(value) && Number(value) >= min && Number(value) <= 480),
      `${label} must be between ${min} and 480 minutes.`
    );

export const planSessionFormSchema = z.object({
  procedure: planText('Procedure').min(1, 'Procedure cannot be empty.'),
  warning: planText('Warning'),
  roomType: planText('Room type'),
  equipment: planText('Equipment'),
  preparation: planText('Preparation'),
  setupMinutes: planMinutes('Setup time', 0),
  therapistSkill: planText('Therapist Skill'),
  durationMinutes: planMinutes('Duration', 1),
  cleaningMinutes: planMinutes('Cleaning time', 0),
});

export type PlanSessionFormValues = z.infer<typeof planSessionFormSchema>;

const minutesText = (value: number | null) => (value === null ? '' : String(value));
const minutesValue = (value: string) => (value === '' ? null : Number(value));

export function planSessionFormValues(
  session: PatientTreatmentPlanReadSession
): PlanSessionFormValues {
  return {
    procedure: session.procedure ?? '',
    warning: session.warning ?? '',
    roomType: session.roomType ?? '',
    equipment: session.equipment ?? '',
    preparation: session.preparation ?? '',
    setupMinutes: minutesText(session.setupMinutes),
    therapistSkill: session.therapistSkill ?? '',
    durationMinutes: minutesText(session.durationMinutes),
    cleaningMinutes: minutesText(session.cleaningMinutes),
  };
}

/** Empty optional text clears the field; the API trims and stores it as null. */
export function planSessionUpdateRequest(
  values: PlanSessionFormValues
): UpdatePatientTreatmentPlanSessionRequest {
  return {
    procedure: values.procedure,
    warning: values.warning,
    roomType: values.roomType,
    equipment: values.equipment,
    preparation: values.preparation,
    setupMinutes: minutesValue(values.setupMinutes),
    therapistSkill: values.therapistSkill,
    durationMinutes: minutesValue(values.durationMinutes),
    cleaningMinutes: minutesValue(values.cleaningMinutes),
  };
}
