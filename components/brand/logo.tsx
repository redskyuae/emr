'use client';

import Link from 'next/link';
import Image from 'next/image';

import { brandLogos } from '@/components/brand/brand-config';
import { useBrandLogoVariant } from '@/components/brand/brand-provider';
import { cn } from '@/lib/utils';

export function LogoMark({ className }: { className?: string }) {
  const variant = useBrandLogoVariant();

  if (variant !== 'none') {
    return (
      <span className={cn('relative flex size-7 shrink-0', className)} aria-hidden="true">
        <Image
          src={brandLogos[variant].markSrc}
          alt=""
          fill
          sizes="48px"
          className="object-contain"
        />
      </span>
    );
  }

  return (
    <span
      aria-hidden="true"
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

export function Logo({
  className,
  href = '/',
  inverted = false,
  showCompany = false,
}: {
  className?: string;
  href?: string;
  inverted?: boolean;
  showCompany?: boolean;
}) {
  const variant = useBrandLogoVariant();
  const brand = variant === 'none' ? null : brandLogos[variant];

  return (
    <Link
      href={href}
      className={cn('flex items-center gap-2.5 outline-none focus-visible:opacity-80', className)}
    >
      <LogoMark className={inverted && !brand ? 'text-primary bg-white' : undefined} />
      <span className="flex flex-col">
        {brand ? (
          <>
            <span className="font-heading text-lg leading-none font-semibold tracking-tight">
              {brand.name}
            </span>
            <span
              className={cn(
                'mt-1 text-xs leading-none',
                inverted ? 'text-white/70' : 'text-muted-foreground'
              )}
            >
              {brand.subtitle}
            </span>
          </>
        ) : (
          <span className="font-heading text-lg leading-none font-semibold tracking-tight">
            Medical
            <span className={inverted ? 'text-white/60' : 'text-muted-foreground'}> EMR</span>
          </span>
        )}
        {showCompany ? (
          <span
            className={cn(
              'mt-1 text-xs leading-none font-medium tracking-wide',
              inverted ? 'text-white/55' : 'text-muted-foreground'
            )}
          >
            by Redsky Consultancy
          </span>
        ) : null}
      </span>
    </Link>
  );
}
