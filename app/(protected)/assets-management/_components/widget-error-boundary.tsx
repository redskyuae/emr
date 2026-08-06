'use client';

import { AlertCircle } from 'lucide-react';
import { unstable_catchError, type ErrorInfo } from 'next/error';

import { getApiErrorMessage } from '@/app/queries/api-error';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export const WidgetErrorBoundary = unstable_catchError(
  ({ title }: { title: string }, { error, unstable_retry }: ErrorInfo) => (
    <Alert variant="destructive">
      <AlertCircle className="size-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="flex flex-col items-start gap-3">
        <span>{getApiErrorMessage(error)}</span>
        <Button type="button" variant="outline" size="sm" onClick={() => unstable_retry()}>
          Try again
        </Button>
      </AlertDescription>
    </Alert>
  )
);
