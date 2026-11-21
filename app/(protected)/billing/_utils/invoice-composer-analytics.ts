import type { AnalyticsEventProperties } from '@/lib/analytics/catalogue';

type InvoiceLink = AnalyticsEventProperties<'invoice_composer_started'>['linked_to'];

const ID = /^\d+$/;

/**
 * What the composer was opened for, from `/billing?invoice=new&visitId=…` or `&admissionId=…`.
 * Only the kind of link is sent, never the id.
 */
export function composerLinkFromParams(params: {
  visitId: string | null;
  admissionId: string | null;
}): InvoiceLink {
  if (params.visitId && ID.test(params.visitId)) return 'visit';
  if (params.admissionId && ID.test(params.admissionId)) return 'admission';
  return 'none';
}
