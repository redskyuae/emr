'use client';

import { useId, type FormEventHandler, type ReactNode } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

/** Generate has no output yet; a valid request only says so. */
export function notifyReportNotAvailable() {
  toast('This report is not available yet');
}

/** Red asterisk beside a required label; the input carries `aria-required`. */
export function RequiredMark() {
  return (
    <span aria-hidden="true" className="text-destructive">
      {' '}
      *
    </span>
  );
}

type ReportCardProps = {
  title: string;
  children: ReactNode;
  description: string;
  requirement: string;
  onSubmit: FormEventHandler<HTMLFormElement>;
};

/** The shared shell of a report: what it contains, its period inputs, and Generate. */
export function ReportCard({
  title,
  children,
  description,
  requirement,
  onSubmit,
}: ReportCardProps) {
  const formId = useId();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription className="space-y-1.5">
          <p>{description}</p>
          <p className="text-xs">{requirement}</p>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <form id={formId} noValidate aria-label={title} onSubmit={onSubmit}>
          {children}
        </form>
      </CardContent>
      <CardFooter>
        <Button type="submit" form={formId}>
          Generate
        </Button>
      </CardFooter>
    </Card>
  );
}
