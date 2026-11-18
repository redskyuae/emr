'use client';

import { useId, type ReactNode } from 'react';
import { motion, useReducedMotion, useTime, useTransform } from 'motion/react';

import { cn } from '@/lib/utils';

type SquigglyTextProps = {
  children: ReactNode;
  steps?: number;
  scale?: number | [number, number];
  className?: string;
  numOctaves?: number;
  stepDuration?: number;
  baseFrequency?: number;
};

/**
 * Hand-drawn "wobble" effect, after Aceternity UI's Squiggly Text.
 * A set of SVG turbulence filters (one noise seed each) is cycled on a fixed
 * cadence, so the glyph edges jitter like a looping animation drawing.
 * Renders plain text when the user prefers reduced motion.
 */
export function SquigglyText({
  children,
  steps = 5,
  scale = [6, 8],
  className,
  numOctaves = 3,
  stepDuration = 80,
  baseFrequency = 0.02,
}: SquigglyTextProps) {
  const reduceMotion = useReducedMotion();
  const baseId = `squiggly-${useId().replace(/[:_«»]/g, '')}`;
  const time = useTime();
  const filter = useTransform(time, (t) => {
    const step = Math.floor(t / stepDuration) % steps;
    return `url(#${baseId}-${step})`;
  });

  if (reduceMotion) {
    return <span className={className}>{children}</span>;
  }

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
      <motion.span className={cn('inline-block', className)} style={{ filter }}>
        {children}
      </motion.span>
    </>
  );
}
