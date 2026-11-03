import type { ReactNode } from 'react';
import Link from 'next/link';
import { SearchX } from 'lucide-react';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';

export function OutreachBreadcrumb({ current, tab }: { current: string; tab?: 'contacts' }) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href={tab ? `/community-outreach?tab=${tab}` : '/community-outreach'}>
              Community Outreach
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{current}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export function OutreachNotFound({ entity, tab }: { entity: string; tab?: 'contacts' }) {
  return (
    <Empty className="py-16">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <SearchX />
        </EmptyMedia>
        <EmptyTitle>{entity} not found</EmptyTitle>
        <EmptyDescription>
          It may have been created in an earlier session. Outreach data is temporary until the API
          is connected.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button asChild>
          <Link href={tab ? `/community-outreach?tab=${tab}` : '/community-outreach'}>
            Back to Community Outreach
          </Link>
        </Button>
      </EmptyContent>
    </Empty>
  );
}

export function FormPageLayout({
  title,
  description,
  aside,
  children,
}: {
  title: string;
  description: string;
  aside: ReactNode;
  children: ReactNode;
}) {
  return (
    <>
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section className="bg-card shadow-fluent-2 min-w-0 rounded-lg border p-4">
          {children}
        </section>
        {aside}
      </div>
    </>
  );
}
