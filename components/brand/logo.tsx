import Link from 'next/link';

import { cn } from '@/lib/utils';

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'bg-primary text-primary-foreground shadow-fluent-2 flex size-7 items-center justify-center rounded-md',
        className
      )}
    >
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="size-4.5">
        <path
          d="M2.5 12.5h4l2.5-6 4 11 3-7.5 1.5 2.5h4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export function Logo({ className, inverted = false }: { className?: string; inverted?: boolean }) {
  return (
    <Link
      href="/"
      className={cn('flex items-center gap-2.5 outline-none focus-visible:opacity-80', className)}
    >
      <LogoMark className={inverted ? 'text-primary bg-white' : undefined} />
      <span className="font-heading text-lg leading-none font-semibold tracking-tight">
        Meridian
        <span className={inverted ? 'text-white/60' : 'text-muted-foreground'}> EMR</span>
      </span>
    </Link>
  );
}
