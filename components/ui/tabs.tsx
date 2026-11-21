'use client';

import { ComponentProps, useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { cva, type VariantProps } from 'class-variance-authority';
import gsap from 'gsap';
import { Tabs as TabsPrimitive } from 'radix-ui';

import { cn } from '@/lib/utils';

gsap.registerPlugin(useGSAP);

function Tabs({
  className,
  orientation = 'horizontal',
  ...props
}: ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn('group/tabs flex gap-2 data-horizontal:flex-col', className)}
      {...props}
    />
  );
}

/*
 * The default list is a pill track: a white capsule with a hairline ring, and one ink pill
 * (--cta) that glides to the current tab. Until the pill has measured its first position the
 * active trigger paints its own fill, so the first frame is already correct.
 */
const tabsListVariants = cva(
  'group/tabs-list relative inline-flex w-fit items-center justify-center text-muted-foreground group-data-horizontal/tabs:h-10 group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col',
  {
    variants: {
      variant: {
        default: 'gap-0.5 rounded-full bg-card p-1 ring-1 ring-border',
        line: 'gap-1 rounded-none bg-transparent p-1',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const ACTIVE_TRIGGER = '[data-slot="tabs-trigger"][data-state="active"]';

function TabsList({
  className,
  variant = 'default',
  children,
  ...props
}: ComponentProps<typeof TabsPrimitive.List> & VariantProps<typeof tabsListVariants>) {
  const listRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLSpanElement>(null);
  const hasPill = variant === 'default';

  useGSAP(
    () => {
      const list = listRef.current;
      const pill = pillRef.current;
      if (!list || !pill) return;

      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      let placed = false;

      const place = (animate: boolean) => {
        const target = list.querySelector<HTMLElement>(ACTIVE_TRIGGER);
        if (!target || target.offsetWidth === 0) {
          gsap.set(pill, { autoAlpha: 0 });
          return;
        }
        const vars = {
          x: target.offsetLeft,
          y: target.offsetTop,
          width: target.offsetWidth,
          height: target.offsetHeight,
          autoAlpha: 1,
        };
        if (animate && placed && !reduceMotion) {
          gsap.to(pill, { ...vars, duration: 0.5, ease: 'power3.out', overwrite: 'auto' });
        } else {
          gsap.set(pill, vars);
        }
        placed = true;
        list.dataset.pill = 'ready';
      };

      place(false);

      const stateObserver = new MutationObserver(() => place(true));
      stateObserver.observe(list, {
        subtree: true,
        attributes: true,
        attributeFilter: ['data-state'],
      });

      const sizeObserver = new ResizeObserver(() => place(false));
      sizeObserver.observe(list);
      list.querySelectorAll('[data-slot="tabs-trigger"]').forEach((el) => sizeObserver.observe(el));

      return () => {
        stateObserver.disconnect();
        sizeObserver.disconnect();
      };
    },
    { scope: listRef, dependencies: [hasPill] }
  );

  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
      ref={listRef}
    >
      {hasPill ? (
        <span
          ref={pillRef}
          aria-hidden="true"
          className="bg-cta pointer-events-none absolute top-0 left-0 rounded-full opacity-0"
        />
      ) : null}
      {children}
    </TabsPrimitive.List>
  );
}

function TabsTrigger({ className, ...props }: ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 relative z-10 inline-flex h-full flex-1 cursor-pointer items-center justify-center gap-2 rounded-full border border-transparent px-4 text-sm font-semibold whitespace-nowrap transition-colors duration-300 outline-none group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start group-data-vertical/tabs:py-2 focus-visible:ring-3 disabled:pointer-events-none disabled:opacity-50 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:opacity-80 [&_svg:not([class*='size-'])]:size-4",
        // Default (pill track): the ink pill sits behind the active trigger.
        'group-data-[variant=default]/tabs-list:data-[state=inactive]:hover:bg-foreground/6 group-data-[variant=default]/tabs-list:data-active:text-cta-foreground group-data-[variant=default]/tabs-list:data-active:bg-cta group-data-[pill=ready]/tabs-list:data-active:bg-transparent!',
        // Line: an underline marks the active trigger.
        'group-data-[variant=line]/tabs-list:data-active:text-foreground group-data-[variant=line]/tabs-list:rounded-md',
        'after:bg-foreground after:absolute after:opacity-0 after:transition-opacity group-data-horizontal/tabs:after:inset-x-0 group-data-horizontal/tabs:after:bottom-[-5px] group-data-horizontal/tabs:after:h-0.5 group-data-vertical/tabs:after:inset-y-0 group-data-vertical/tabs:after:-right-1 group-data-vertical/tabs:after:w-0.5 group-data-[variant=line]/tabs-list:data-active:after:opacity-100',
        className
      )}
      {...props}
    />
  );
}

function TabsContent({ className, ...props }: ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn('flex-1 text-sm outline-none', className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants };
