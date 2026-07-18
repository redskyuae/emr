import { z } from 'zod';

// Client-side mirror of the create-Invoice contract. A patient is required; the
// encounter link is one of none/visit/admission, resolved to the API shape on submit.
export const createInvoiceFormSchema = z
  .object({
    patientId: z.string().min(1, 'Patient is required.'),
    encounterKind: z.enum(['none', 'visit', 'admission']),
    visitId: z.string(),
    admissionId: z.string(),
    notes: z.string().trim().max(2000, 'Notes must be at most 2000 characters.'),
  })
  .refine((data) => data.encounterKind !== 'visit' || data.visitId !== '', {
    message: 'Select a Visit to link, or choose no encounter.',
    path: ['visitId'],
  })
  .refine((data) => data.encounterKind !== 'admission' || data.admissionId !== '', {
    message: 'Select an Admission to link, or choose no encounter.',
    path: ['admissionId'],
  });

export type CreateInvoiceFormValues = z.infer<typeof createInvoiceFormSchema>;
