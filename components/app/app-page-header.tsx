'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { PiPlusLight } from 'react-icons/pi';

import { useHasPermission } from '@/app/queries/identity-access/useCurrentUser';
import { getAppPageGroup, getAppPageMeta } from '@/components/app/app-shell-config';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';

gsap.registerPlugin(useGSAP);

/**
 * The title of the current page: the sidebar group it belongs to as an eyebrow, a plain `h1`, and
 * the subtitle, with the title repeated behind them as a large, faint watermark. The page's
 * primary action sits at the end of the row. It is the first thing on every page and scrolls
 * with the content. On a phone it starts with the menu button that opens the sidebar; on wider
 * screens the sidebar rail and Ctrl/⌘+B do that instead.
 */
export function AppPageHeader() {
  const pathname = usePathname();
  const pageMeta = getAppPageMeta(pathname);
  const group = getAppPageGroup(pathname);
  const { data: hasPrimaryActionPermission } = useHasPermission(
    pageMeta.primaryAction?.permission ?? ''
  );
  const canUsePrimaryAction = !pageMeta.primaryAction?.permission || hasPrimaryActionPermission;

  return (
    <div className="relative isolate flex flex-col gap-4 overflow-hidden px-4 pt-6 pb-4 sm:px-6 md:flex-row md:items-end md:justify-between lg:px-8 lg:pt-8">
      <GhostTitle text={pageMeta.title} />

      <div className="relative z-10 flex min-w-0 flex-col items-start gap-1.5">
        <SidebarTrigger className="text-muted-foreground -ml-2 md:hidden" />
        {group ? <p className="text-muted-foreground text-xs font-medium">{group}</p> : null}
        <h1 className="text-[1.75rem] leading-tight font-semibold tracking-[-0.03em] break-words md:text-[2rem]">
          {pageMeta.title}
        </h1>
        <p className="text-muted-foreground max-w-prose text-sm">{pageMeta.subtitle}</p>
      </div>

      {pageMeta.primaryAction && canUsePrimaryAction ? (
        <Button asChild size="lg" className="relative z-10 shrink-0 self-start md:self-end">
          <Link href={pageMeta.primaryAction.href}>
            <PiPlusLight />
            <span>{pageMeta.primaryAction.label}</span>
          </Link>
        </Button>
      ) : null}
    </div>
  );
}

/**
 * The page title repeated behind the heading as a large, faint watermark. It drifts in from the
 * left each time the page changes. Decorative only: hidden from assistive technology and never
 * selectable.
 */
function GhostTitle({ text }: { text: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      gsap.fromTo(
        el,
        { x: -24, autoAlpha: 0 },
        { x: 0, autoAlpha: 1, duration: 0.7, ease: 'power3.out', clearProps: 'all' }
      );
    },
    { dependencies: [text] }
  );

  return (
    <span
      ref={ref}
      aria-hidden
      className="font-heading text-foreground/[0.045] pointer-events-none absolute top-1/2 left-2 z-0 -translate-y-1/2 text-[4.5rem] leading-none font-semibold tracking-[-0.05em] whitespace-nowrap select-none sm:left-4 md:text-[6.5rem] lg:left-6"
    >
      {text}
    </span>
  );
}
