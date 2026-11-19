import type { ReactNode } from 'react';
import { CiWarning } from 'react-icons/ci';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const DEFAULT_DESCRIPTION =
  'Everything on this page is made-up sample data. It does not show real Patients, Visits, or Invoices, and nothing here is saved.';

/** `description` replaces the default text on a demo page that shows no sample data. */
export function DemoDataBanner({ description = DEFAULT_DESCRIPTION }: { description?: ReactNode }) {
  return (
    <Alert role="status">
      <CiWarning className="size-4" />
      <AlertTitle>Demo data</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
    </Alert>
  );
}
