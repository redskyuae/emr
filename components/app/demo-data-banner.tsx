import { CiWarning } from 'react-icons/ci';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function DemoDataBanner() {
  return (
    <Alert role="status">
      <CiWarning className="size-4" />
      <AlertTitle>Demo data</AlertTitle>
      <AlertDescription>
        Everything on this page is made-up sample data. It does not show real Patients, Visits, or
        Invoices, and nothing here is saved.
      </AlertDescription>
    </Alert>
  );
}
