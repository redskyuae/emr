import type { VisitListBillingStatus } from '../_data/static-visit-list';

export const BILLING_PRESENTATION: Record<
  VisitListBillingStatus,
  { label: string; className: string }
> = {
  PAID: { label: 'Paid', className: 'border-success/40 text-success' },
  FINALIZED: { label: 'Finalized', className: 'border-primary/40 text-primary' },
  PARTIALLY_PAID: { label: 'Partially Paid', className: 'border-warning/40 text-warning' },
  NOT_BILLED: { label: 'Not billed', className: 'border-border text-muted-foreground' },
};
