'use client';

import type { ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';

import { getApiErrorMessage } from '@/app/queries/api-error';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

type WidgetErrorBoundaryProps = {
  title: string;
  children: ReactNode;
};

export function WidgetErrorBoundary({ title, children }: WidgetErrorBoundaryProps) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          onReset={reset}
          fallbackRender={({ error, resetErrorBoundary }) => (
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertTitle>{title}</AlertTitle>
              <AlertDescription className="flex flex-col items-start gap-3">
                <span>{getApiErrorMessage(error)}</span>
                <Button type="button" variant="outline" size="sm" onClick={resetErrorBoundary}>
                  Try again
                </Button>
              </AlertDescription>
            </Alert>
          )}
        >
          {children}
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}
