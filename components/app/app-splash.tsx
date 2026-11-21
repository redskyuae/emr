'use client';

import { brandLogos } from '@/components/brand/brand-config';
import { useBrandLogoVariant } from '@/components/brand/brand-provider';
import { LogoMark } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { motion, useReducedMotion } from 'motion/react';
import { ReactNode } from 'react';

function AppSplashFrame({ fading, children }: { fading: boolean; children: ReactNode }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'bg-background fixed inset-0 z-50 flex flex-col items-center justify-center gap-6',
        'transition-opacity duration-200 motion-reduce:transition-none',
        fading ? 'pointer-events-none opacity-0' : 'opacity-100'
      )}
    >
      {children}
    </div>
  );
}

function AppSplashBrand({ pulse }: { pulse: boolean }) {
  const variant = useBrandLogoVariant();
  const brand = variant === 'none' ? null : brandLogos[variant];

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <LogoMark
        className={cn('size-12 rounded-xl', pulse && 'animate-pulse motion-reduce:animate-none')}
      />
      <div className="grid gap-0.5">
        <span className="font-heading text-lg leading-none font-semibold tracking-tight">
          {brand?.name ?? 'Medical EMR'}
        </span>
        <span className="text-muted-foreground text-xs">
          {brand?.subtitle ?? 'Redsky Consultancy'}
        </span>
      </div>
    </div>
  );
}

// Aceternity's "Simple Loader" (three staggered bouncing dots) at half scale, in the primary color.
// It loops only while the splash is on screen, which DESIGN.md allows for loading indicators, and
// it holds still under prefers-reduced-motion.
function AppSplashDots() {
  const reduceMotion = useReducedMotion();

  return (
    <div aria-hidden className="-mt-2 flex h-[13px] items-start gap-1">
      {[0, 1, 2].map((index) => (
        <motion.span
          key={index}
          initial={{ y: 0 }}
          animate={reduceMotion ? { y: 0 } : { y: [0, 5, 0] }}
          transition={{
            ease: 'easeInOut',
            duration: 1,
            repeat: Infinity,
            delay: index * 0.2,
          }}
          className="border-primary/30 from-primary to-primary/70 block size-2 rounded-full border bg-gradient-to-b"
        />
      ))}
    </div>
  );
}

export function AppSplashLoading({ fading }: { fading: boolean }) {
  return (
    <AppSplashFrame fading={fading}>
      <AppSplashBrand pulse />
      <AppSplashDots />
      {/* The logo pulse and the bouncing dots are the motion cues, and both stop under
          prefers-reduced-motion, so surface a visible caption for those sighted users; it stays
          sr-only otherwise. */}
      <span className="text-muted-foreground sr-only text-sm motion-reduce:not-sr-only">
        Loading your workspace…
      </span>
    </AppSplashFrame>
  );
}

export function AppSplashError({
  message,
  isRetrying,
  onRetry,
}: {
  message: string;
  isRetrying: boolean;
  onRetry: () => void;
}) {
  return (
    <AppSplashFrame fading={false}>
      <AppSplashBrand pulse={false} />
      <div className="flex max-w-sm flex-col items-center gap-4 px-6 text-center">
        <p className="text-muted-foreground text-sm">{message}</p>
        <Button type="button" onClick={onRetry} disabled={isRetrying} aria-busy={isRetrying}>
          {isRetrying ? <Spinner className="size-4" /> : null}
          Try again
        </Button>
      </div>
    </AppSplashFrame>
  );
}
