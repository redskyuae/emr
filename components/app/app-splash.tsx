import { LogoMark } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
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
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <LogoMark
        className={cn('size-12 rounded-xl', pulse && 'animate-pulse motion-reduce:animate-none')}
      />
      <div className="grid gap-0.5">
        <span className="font-heading text-lg leading-none font-semibold tracking-tight">
          Medical EMR
        </span>
        <span className="text-muted-foreground text-xs">Redsky Consultancy</span>
      </div>
    </div>
  );
}

export function AppSplashLoading({ fading }: { fading: boolean }) {
  return (
    <AppSplashFrame fading={fading}>
      <AppSplashBrand pulse />
      {/* The pulse is the only motion cue and is stripped under prefers-reduced-motion,
          so surface a visible caption for those sighted users; it stays sr-only otherwise. */}
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
