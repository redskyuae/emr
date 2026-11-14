import Link from 'next/link';
import Image from 'next/image';

import { getSession } from '@/app/api/lib/utils/auth-helpers';
import { brandLogos, getConfiguredBrandLogoVariant } from '@/components/brand/brand-config';
import { Logo } from '@/components/brand/logo';
import { ExistingSessionGate } from '@/components/auth/existing-session-gate';
import { ReactNode } from 'react';
import { getAuthLinkFlags } from './_utils/auth-link-flags';
import { SquigglyText } from './_components/squiggly-text';

export default async function AuthLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  const logoVariant = getConfiguredBrandLogoVariant();
  const brand = logoVariant === 'none' ? null : brandLogos[logoVariant];
  const { showBackToSiteLink } = getAuthLinkFlags();
  const logoHref = showBackToSiteLink ? '/site' : '/login';

  if (session) {
    return <ExistingSessionGate />;
  }

  return (
    <div className="grid min-h-full flex-1 lg:grid-cols-2">
      {/* ── Brand panel ──────────────────────────────────────── */}
      {/* Neutral black scrim + white text, independent of theme, so any photo stays legible. */}
      <div className="relative hidden overflow-hidden bg-neutral-950 text-white lg:flex">
        <Image
          src="/brand/dhathri-ayurvedic-care.jpg"
          alt="A welcoming Ayurvedic care room with a wooden treatment table and botanical surroundings"
          fill
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-linear-to-t from-black/85 via-black/25 via-55% to-black/45"
        />

        <div className="relative flex w-full flex-col justify-between gap-16 p-10 xl:p-12">
          <Logo href={logoHref} inverted className="text-white" />

          <div className="max-w-lg space-y-4 pb-4">
            <p className="text-sm font-semibold tracking-widest text-white/80 uppercase">
              {brand?.wordmarkAlt ?? 'Ayurvedic hospital care'}
            </p>
            <h2 className="font-heading text-4xl leading-tight font-semibold text-balance xl:text-5xl">
              <SquigglyText>Care rooted in Ayurveda.</SquigglyText>
            </h2>
            <p className="max-w-md text-base leading-relaxed text-white/90">
              A calm, welcoming setting for Ayurvedic consultations, traditional therapies, and
              thoughtful ongoing care.
            </p>
          </div>
        </div>
      </div>

      {/* ── Form panel ───────────────────────────────────────── */}
      <div className="relative flex flex-col">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[radial-gradient(36rem_20rem_at_100%_0%,--alpha(var(--color-accent)/55%),transparent)]"
        />
        <div className="flex items-center justify-between p-6 lg:justify-end">
          <Logo href={logoHref} className="lg:hidden" />
          {showBackToSiteLink ? (
            <Link
              href="/site"
              className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
            >
              ← Back to site
            </Link>
          ) : null}
        </div>
        <div className="flex flex-1 items-center justify-center px-6 pb-16">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </div>
    </div>
  );
}
