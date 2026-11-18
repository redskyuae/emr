'use client';

import { useEffect, useId, type ReactNode } from 'react';
import { motion, useMotionValue } from 'motion/react';

import { cn } from '@/lib/utils';

type SquigglyTextProps = {
  children: ReactNode;
  steps?: number;
  scale?: number | [number, number];
  className?: string;
  numOctaves?: number;
  stepDuration?: number;
  baseFrequency?: number;
  /** How long the wobble runs before the text settles, in milliseconds. */
  duration?: number;
};

/**
 * Hand-drawn "wobble" effect, after Aceternity UI's Squiggly Text.
 * A set of SVG turbulence filters (one noise seed each) is cycled on a fixed
 * cadence, so the glyph edges jitter like a looping animation drawing.
 *
 * The wobble runs for `duration` and then settles into plain text, so nothing
 * moves indefinitely beside the sign-in form. The markup is the same on the
 * server and the client: the filter starts at `none` and is only cycled from an
 * effect, which never starts when the user prefers reduced motion.
 */
export function SquigglyText({
  children,
  steps = 5,
  scale = [6, 8],
  className,
  numOctaves = 3,
  stepDuration = 80,
  baseFrequency = 0.02,
  duration = 4000,
}: SquigglyTextProps) {
  const baseId = `squiggly-${useId().replace(/[:_«»]/g, '')}`;
  const filter = useMotionValue('none');

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const startedAt = performance.now();
    let step = 0;

    const timer = window.setInterval(() => {
      if (performance.now() - startedAt >= duration) {
        window.clearInterval(timer);
        filter.set('none');
        return;
      }

      filter.set(`url(#${baseId}-${step})`);
      step = (step + 1) % steps;
    }, stepDuration);

    return () => {
      window.clearInterval(timer);
      filter.set('none');
    };
  }, [baseId, duration, filter, stepDuration, steps]);

  return (
    <>
      <svg aria-hidden="true" width="0" height="0" className="absolute">
        <defs>
          {Array.from({ length: steps }, (_, index) => (
            <filter key={index} id={`${baseId}-${index}`}>
              <feTurbulence
                type="fractalNoise"
                seed={index}
                result="noise"
                numOctaves={numOctaves}
                baseFrequency={baseFrequency}
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="noise"
                scale={Array.isArray(scale) ? scale[index % 2] : scale}
              />
            </filter>
          ))}
        </defs>
      </svg>
      {/* motion-reduce:filter-none! also covers a preference switched on after the page loaded. */}
      <motion.span
        className={cn('inline-block motion-reduce:filter-none!', className)}
        style={{ filter }}
      >
        {children}
      </motion.span>
    </>
  );
}
