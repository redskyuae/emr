import { z } from 'zod';

import type { Visit } from '@/app/api/lib/modules/visit/schemas/visit-schema';
import type { AmendVisitRequest } from '@/app/api/v1/visits/[id]/amend/types';
import { CHIEF_COMPLAINT_MAX } from '../../new/_utils/create-visit-form-schema';

export const amendVisitFormSchema = z
  .object({
    doctorId: z.string().min(1, 'Doctor is required.'),
    visitTypeId: z.string().min(1, 'Visit type is required.'),
    admitSourceId: z.string(),
    treatmentId: z.string(),
    treatmentSessionId: z.string(),
    chiefComplaint: z
      .string()
      .trim()
      .max(
        CHIEF_COMPLAINT_MAX,
        `Chief complaint must be at most ${CHIEF_COMPLAINT_MAX} characters.`
      ),
    remarks: z.string().trim(),
  })
  .superRefine((values, context) => {
    if (values.treatmentId && !values.treatmentSessionId) {
      context.addIssue({
        code: 'custom',
        path: ['treatmentSessionId'],
        message: 'Choose the Session for this Treatment.',
      });
    }
  });

export type AmendVisitFormValues = z.infer<typeof amendVisitFormSchema>;

/** The form opens on what the Visit holds today. */
export function amendVisitFormDefaults(visit: Visit): AmendVisitFormValues {
  return {
    doctorId: String(visit.doctor.id),
    visitTypeId: String(visit.visitType.id),
    admitSourceId: visit.admitSource ? String(visit.admitSource.id) : '',
    treatmentId: visit.treatment ? String(visit.treatment.id) : '',
    treatmentSessionId: visit.treatmentSession ? String(visit.treatmentSession.id) : '',
    chiefComplaint: visit.chiefComplaint ?? '',
    remarks: visit.remarks ?? '',
  };
}

/** Amendment replaces the whole record, so a blank choice clears the field. */
export function toAmendVisitRequest(values: AmendVisitFormValues): AmendVisitRequest {
  const optionalId = (value: string) => (value ? Number(value) : null);

  return {
    doctorId: Number(values.doctorId),
    visitTypeId: Number(values.visitTypeId),
    admitSourceId: optionalId(values.admitSourceId),
    treatmentId: optionalId(values.treatmentId),
    treatmentSessionId: values.treatmentId ? optionalId(values.treatmentSessionId) : null,
    chiefComplaint: values.chiefComplaint || null,
    remarks: values.remarks || null,
  };
}
