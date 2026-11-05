import { notFound } from 'next/navigation';

import { demoPagesEnabled } from '@/lib/demo-pages';
import { BillingCounterPageImpl } from './_components/billing-counter-page-impl';

export default function BillingCounterPage() {
  if (!demoPagesEnabled()) {
    notFound();
  }

  return <BillingCounterPageImpl />;
}
