import type { ReactNode } from 'react';
import type { IconType } from 'react-icons';

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const TONES = {
  neutral: 'bg-muted text-foreground',
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  destructive: 'bg-destructive/10 text-destructive',
};

export type StatTone = keyof typeof TONES;

/**
 * One figure per card: a quiet label, a large number, and a round icon chip in the corner. The
 * card stays a plain white surface; only the chip carries the status colour.
 *
 * With `onPress` the whole card is a toggle (a status filter), and `pressed` marks it selected.
 */
export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'neutral',
  pressed,
  onPress,
  children,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon: IconType;
  tone?: StatTone;
  pressed?: boolean;
  onPress?: () => void;
  children?: ReactNode;
}) {
  return (
    <Card
      className={cn(
        'shadow-fluent-2 gap-3',
        onPress &&
          'hover:shadow-fluent-8 has-[button:focus-visible]:ring-ring/50 relative transition-shadow has-[button:focus-visible]:ring-3',
        pressed && 'ring-primary ring-2'
      )}
    >
      <CardHeader>
        <CardDescription className="text-xs font-medium">
          {onPress ? (
            <button
              type="button"
              aria-pressed={pressed ?? false}
              onClick={onPress}
              className="text-left outline-none after:absolute after:inset-0"
            >
              {label}
            </button>
          ) : (
            label
          )}
        </CardDescription>
        <CardTitle className="mt-1 text-3xl leading-none tracking-tight tabular-nums">
          {value}
        </CardTitle>
        <CardAction>
          <span
            className={cn('flex size-10 items-center justify-center rounded-full', TONES[tone])}
          >
            <Icon className="size-5" aria-hidden="true" />
          </span>
        </CardAction>
      </CardHeader>
      {hint || children ? (
        <CardContent className="space-y-3">
          {hint ? <p className="text-muted-foreground text-xs">{hint}</p> : null}
          {children}
        </CardContent>
      ) : null}
    </Card>
  );
}

/**
 * A StatCard's placeholder, built from the same card slots and line heights so the real card
 * lands in the space it held. Pass `hint` when the real card has a hint line.
 */
export function StatCardSkeleton({ hint = false }: { hint?: boolean }) {
  return (
    <Card aria-hidden="true" className="shadow-fluent-2 gap-3">
      <CardHeader>
        <div className="flex h-4 items-center">
          <Skeleton className="h-3 w-28 max-w-full" />
        </div>
        <Skeleton className="mt-1 h-7.5 w-14" />
        <CardAction>
          <Skeleton className="size-10 rounded-full" />
        </CardAction>
      </CardHeader>
      {hint ? (
        <CardContent>
          <div className="flex h-4 items-center">
            <Skeleton className="h-3 w-32 max-w-full" />
          </div>
        </CardContent>
      ) : null}
    </Card>
  );
}
