import { notFound } from 'next/navigation';

import { demoPagesEnabled } from '@/lib/demo-pages';
import { ReportsPageImpl } from './_components/reports-page-impl';

export default function ReportsPage() {
  if (!demoPagesEnabled()) {
    notFound();
  }

  return <ReportsPageImpl />;
}
