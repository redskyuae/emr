'use client';

import { useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

gsap.registerPlugin(useGSAP);

/**
 * Drives a panel that slides open below the thing that toggles it. While `open` the panel is
 * mounted and its height eases from 0 to its natural height; when `open` turns false it eases
 * back to 0 and only then unmounts, so closing is as smooth as opening. Under
 * `prefers-reduced-motion` it opens and closes at once.
 *
 * Render the panel only while `rendered` is true and attach `ref` to its outer element, which
 * must clip its overflow.
 */
export function useExpandReveal<T extends HTMLElement>(open: boolean) {
  const ref = useRef<T>(null);
  const [rendered, setRendered] = useState(open);

  // Mount in the same render that opens it, so the first frame already holds the panel.
  if (open && !rendered) {
    setRendered(true);
  }

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (open) {
        if (reduceMotion) return;
        // Reopened while still closing: carry on from the current height instead of jumping.
        if (!gsap.isTweening(el)) gsap.set(el, { height: 0, autoAlpha: 0 });
        gsap.to(el, {
          height: 'auto',
          autoAlpha: 1,
          duration: 0.5,
          ease: 'power3.out',
          overwrite: true,
          clearProps: 'height,opacity,visibility',
        });
        return;
      }

      gsap.to(el, {
        height: 0,
        autoAlpha: 0,
        duration: reduceMotion ? 0 : 0.35,
        ease: 'power3.inOut',
        overwrite: true,
        onComplete: () => setRendered(false),
      });
    },
    { dependencies: [open, rendered] }
  );

  return { ref, rendered };
}
