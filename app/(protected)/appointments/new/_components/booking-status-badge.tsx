import type { ReactNode } from 'react';
import { CiCircleCheck, CiCircleMinus, CiClock1 } from 'react-icons/ci';
import { PiCheckLight, PiShieldWarningLight } from 'react-icons/pi';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const tones = {
  selected: { icon: PiCheckLight, className: 'border-primary/25 bg-primary/10 text-primary' },
  success: { icon: CiCircleCheck, className: 'border-success/25 bg-success/10 text-success' },
  warning: { icon: CiClock1, className: 'border-warning/25 bg-warning/10 text-warning' },
  danger: {
    icon: PiShieldWarningLight,
    className: 'border-destructive/25 bg-destructive/10 text-destructive',
  },
  neutral: { icon: CiCircleMinus, className: 'border-border bg-muted/50 text-muted-foreground' },
};

export function BookingStatusBadge({
  tone,
  children,
}: {
  tone: keyof typeof tones;
  children: ReactNode;
}) {
  const { icon: Icon, className } = tones[tone];
  return (
    <Badge variant="outline" className={cn('shrink-0', className)}>
      <Icon className="size-3" aria-hidden="true" />
      {children}
    </Badge>
  );
}
