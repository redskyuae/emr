'use client';

import { AlertCircle } from 'lucide-react';

import { getApiErrorMessage } from '@/app/queries/api-error';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export default function AssetOverviewError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="size-4" />
      <AlertTitle>Could not load the Asset overview</AlertTitle>
      <AlertDescription className="flex flex-col items-start gap-3">
        <span>{getApiErrorMessage(error)}</span>
        <Button type="button" variant="outline" size="sm" onClick={() => unstable_retry()}>
          Try again
        </Button>
      </AlertDescription>
    </Alert>
  );
}
