'use client';

import { AlertCircle } from 'lucide-react';
import { unstable_catchError, type ErrorInfo } from 'next/error';

import { getApiErrorMessage } from '@/app/queries/api-error';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

type WidgetErrorFallbackProps = {
  title: string;
  error: Error;
  onRetry: () => void;
};

function WidgetErrorFallback({ title, error, onRetry }: WidgetErrorFallbackProps) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="size-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="flex flex-col items-start gap-3">
        <span>{getApiErrorMessage(error)}</span>
        <Button type="button" variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      </AlertDescription>
    </Alert>
  );
}

export const WidgetErrorBoundary = unstable_catchError(
  ({ title }: { title: string }, { error, unstable_retry }: ErrorInfo) => (
    <WidgetErrorFallback title={title} error={error} onRetry={unstable_retry} />
  )
);
