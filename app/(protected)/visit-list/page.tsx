import { notFound } from 'next/navigation';

import { demoPagesEnabled } from '@/lib/demo-pages';
import { VisitListPageImpl } from './_components/visit-list-page-impl';

export default function VisitListPage() {
  if (!demoPagesEnabled()) {
    notFound();
  }

  return <VisitListPageImpl />;
}
