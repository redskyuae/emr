'use client';

import { Suspense } from 'react';

import OverviewLoader from '../loader';
import { OverviewContent } from './overview-content';

export function OverviewPageImpl() {
  return (
    <Suspense fallback={<OverviewLoader />}>
      <OverviewContent />
    </Suspense>
  );
}
