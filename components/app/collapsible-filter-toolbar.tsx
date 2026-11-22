'use client';

import { ReactNode, useId, useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { PiFunnelSimpleLight } from 'react-icons/pi';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

gsap.registerPlugin(useGSAP);

const EXPAND_DURATION = 0.3;

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

type CollapsibleFilterToolbarProps = {
  /** Row 1: search and the page's main filters, always visible. */
  children: ReactNode;
  /** The remaining filter rows, shown only while expanded. */
  advanced: ReactNode;
  /** Applied advanced filters, shown on the toggle while collapsed. */
  advancedCount: number;
  /** Read once on mount: start expanded when the page loads with an advanced filter applied. */
  defaultExpanded: boolean;
  /** Right-aligned at the end of row 1, e.g. Reset and Apply. */
  actions?: ReactNode;
  /** Always visible under row 1, e.g. validation messages. */
  notice?: ReactNode;
};

/*
 * A list toolbar for pages whose filters need more than one row (DESIGN.md, "Collapsible
 * advanced filters"). Row 1 always shows; the advanced rows expand in place with a short
 * height-and-fade. While collapsed they are hidden and inert, so neither Tab nor a screen
 * reader reaches them. They stay mounted, so a form keeps its draft values.
 */
export function CollapsibleFilterToolbar({
  children,
  advanced,
  advancedCount,
  defaultExpanded,
  actions,
  notice,
}: CollapsibleFilterToolbarProps) {
  const regionId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const regionRef = useRef<HTMLDivElement>(null);
  // `expanded` is what the user asked for; `shown` keeps the rows in the layout until the
  // collapse animation has finished.
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [shown, setShown] = useState(defaultExpanded);
  // Only a change from the last animated state animates, so the initial state (and a Strict
  // Mode re-run of the effect) renders without motion.
  const animatedRef = useRef(defaultExpanded);

  useGSAP(
    () => {
      const region = regionRef.current;

      if (animatedRef.current === expanded) return;
      animatedRef.current = expanded;

      if (!region || prefersReducedMotion()) return;

      const tween = { duration: EXPAND_DURATION, ease: 'power3.out' };
      // A toggle mid-animation starts from where the rows are now. The running tween is killed
      // outright, with its onComplete, so a stale collapse can't hide rows that were reopened.
      const midTween = gsap.isTweening(region);
      gsap.killTweensOf(region);

      if (expanded) {
        gsap.fromTo(
          region,
          midTween ? { overflow: 'hidden' } : { height: 0, autoAlpha: 0, overflow: 'hidden' },
          {
            ...tween,
            height: 'auto',
            autoAlpha: 1,
            clearProps: 'height,opacity,visibility,overflow',
          }
        );
      } else {
        gsap.to(region, {
          ...tween,
          height: 0,
          autoAlpha: 0,
          overflow: 'hidden',
          onComplete: () => {
            setShown(false);
            gsap.set(region, { clearProps: 'height,opacity,visibility,overflow' });
          },
        });
      }
    },
    { scope: containerRef, dependencies: [expanded] }
  );

  const showCount = !expanded && advancedCount > 0;
  const label = expanded ? 'Hide advanced filters' : 'Advanced filters';

  function toggle() {
    const next = !expanded;

    setExpanded(next);

    // Collapsing keeps the rows shown until the animation ends, unless there is no animation.
    if (next || prefersReducedMotion()) {
      setShown(next);
    }
  }

  return (
    <Card>
      <CardContent ref={containerRef}>
        <div className="flex flex-wrap items-center gap-3">
          {children}

          <Button
            type="button"
            size="lg"
            variant="outline"
            aria-expanded={expanded}
            aria-controls={regionId}
            aria-label={showCount ? `${label}, ${advancedCount} applied` : label}
            onClick={toggle}
          >
            <PiFunnelSimpleLight className="size-4" />
            {label}
            {showCount ? <span className="tabular-nums">· {advancedCount}</span> : null}
          </Button>

          {actions ? (
            <div className="ml-auto flex flex-wrap items-center gap-2">{actions}</div>
          ) : null}
        </div>

        {notice}

        <div id={regionId} ref={regionRef} hidden={!shown} inert={!expanded}>
          <div className="pt-3">{advanced}</div>
        </div>
      </CardContent>
    </Card>
  );
}

/** Select value meaning "no filter" — Radix Select cannot hold an empty string. */
const ALL = 'all';

type FilterSelectProps = {
  /** The accessible name; toolbar filters have no visible label. */
  label: string;
  value: string | null;
  allLabel: string;
  disabled?: boolean;
  className?: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  onChange: (value: string | null) => void;
};

/** A toolbar filter dropdown whose first option, `allLabel`, clears the filter (`null`). */
export function FilterSelect({
  label,
  value,
  allLabel,
  disabled,
  className,
  options,
  onChange,
}: FilterSelectProps) {
  return (
    <Select
      value={value ?? ALL}
      disabled={disabled}
      onValueChange={(next) => onChange(next === ALL ? null : next)}
    >
      <SelectTrigger className={cn('w-full', className)} aria-label={label}>
        <SelectValue placeholder={allLabel} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{allLabel}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
