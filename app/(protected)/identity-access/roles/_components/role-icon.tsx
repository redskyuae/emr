import { ShieldCheck } from 'lucide-react';

import { cn } from '@/lib/utils';

export function RoleIcon({ isSystem, className }: { isSystem: boolean; className?: string }) {
  return (
    <span
      className={cn(
        'flex size-11 shrink-0 items-center justify-center rounded-lg border',
        isSystem
          ? 'border-primary/20 bg-primary/10 text-primary'
          : 'border-chart-2/20 bg-chart-2/10 text-chart-2',
        className
      )}
    >
      <ShieldCheck className="size-5" />
    </span>
  );
}
