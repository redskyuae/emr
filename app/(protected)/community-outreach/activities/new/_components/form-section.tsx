import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

export function FormSection({
  title,
  children,
  highlighted,
}: {
  title: string;
  children: ReactNode;
  highlighted?: boolean;
}) {
  return (
    <section
      className={cn(
        'bg-card shadow-fluent-2 space-y-4 rounded-lg border p-4',
        highlighted && 'border-primary'
      )}
    >
      <h2 className="text-base font-semibold">{title}</h2>
      {children}
    </section>
  );
}
