'use client';

import { ReactNode, useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * Animates the marketing page via data attributes so the page stays a server component:
 *
 * - [data-hero-item]     staggered hero entrance
 * - [data-hero-preview]  dashboard mockup entrance + scroll parallax
 * - [data-hero-float]    gentle idle float on the mockup card
 * - [data-hero-chip]     floating stat chips around the mockup (gentle drift)
 * - [data-counter]       count-up numbers (+ optional [data-counter-suffix])
 * - [data-reveal]        fade-up on scroll
 * - [data-reveal-group]  staggered fade-up of direct children on scroll
 * - [data-marquee]       seamless horizontal logo/quote ribbon (duplicate the
 *                        track's content; set [data-marquee-reverse] to flip)
 * - [data-diagram-*]     tenant → facilities diagram build-in
 * - [data-cta]           closing banner reveal
 */
export function MarketingAnimations({ children }: { children: ReactNode }) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      // ── Hero entrance ────────────────────────────────────
      const hero = gsap.timeline({ defaults: { ease: 'power3.out' } });
      hero.from('[data-hero-item]', {
        y: 28,
        autoAlpha: 0,
        filter: 'blur(6px)',
        duration: 0.7,
        stagger: 0.09,
      });
      hero.from(
        '[data-hero-preview]',
        { y: 56, autoAlpha: 0, scale: 0.96, duration: 0.9, ease: 'power3.out' },
        0.35
      );

      // idle float + scroll parallax on the dashboard mockup
      gsap.to('[data-hero-float]', {
        y: -10,
        duration: 3.2,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
        delay: 1.3,
      });
      gsap.to('[data-hero-preview]', {
        y: -48,
        ease: 'none',
        scrollTrigger: {
          trigger: '[data-hero-preview]',
          start: 'top 70%',
          end: 'bottom top',
          scrub: 0.6,
        },
      });

      // floating stat chips drift independently for a layered, alive feel
      gsap.utils.toArray<HTMLElement>('[data-hero-chip]').forEach((chip, i) => {
        gsap.from(chip, { autoAlpha: 0, scale: 0.8, y: 12, duration: 0.6, delay: 1 + i * 0.15 });
        gsap.to(chip, {
          y: i % 2 === 0 ? -12 : 12,
          duration: 3.6 + i * 0.4,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
          delay: 1.4,
        });
      });

      // ── Seamless marquee ribbons (logos / quotes) ───────
      gsap.utils.toArray<HTMLElement>('[data-marquee]').forEach((track) => {
        const reverse = track.hasAttribute('data-marquee-reverse');
        gsap.to(track, {
          xPercent: reverse ? 0 : -50,
          ...(reverse ? { startAt: { xPercent: -50 } } : {}),
          duration: 32,
          ease: 'none',
          repeat: -1,
        });
      });

      // ── Count-up numbers ─────────────────────────────────
      gsap.utils.toArray<HTMLElement>('[data-counter]').forEach((el) => {
        const target = parseFloat(el.dataset.counter ?? '0');
        const suffix = el.dataset.counterSuffix ?? '';
        const decimals = parseInt(el.dataset.counterDecimals ?? '0', 10);
        const state = { value: 0 };
        gsap.to(state, {
          value: target,
          duration: 1.6,
          ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 90%', once: true },
          onUpdate: () => {
            el.textContent = `${state.value.toFixed(decimals)}${suffix}`;
          },
        });
      });

      // ── Scroll reveals ───────────────────────────────────
      // We set the hidden state and drive the reveal from `onEnter` (rather than
      // a `gsap.from` whose playback is bound to the trigger). A bound `from`
      // can render its start state and then fail to play for elements below the
      // fold after a fonts-driven refresh, leaving content stranded invisible.
      gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
        gsap.set(el, { y: 32, autoAlpha: 0 });
        ScrollTrigger.create({
          trigger: el,
          start: 'top 82%',
          once: true,
          onEnter: () =>
            gsap.to(el, {
              y: 0,
              autoAlpha: 1,
              duration: 0.8,
              ease: 'power3.out',
              overwrite: 'auto',
            }),
        });
      });

      gsap.utils.toArray<HTMLElement>('[data-reveal-group]').forEach((group) => {
        const items = gsap.utils.toArray<HTMLElement>(group.children);
        gsap.set(items, { y: 28, autoAlpha: 0 });
        ScrollTrigger.create({
          trigger: group,
          start: 'top 82%',
          once: true,
          onEnter: () =>
            gsap.to(items, {
              y: 0,
              autoAlpha: 1,
              duration: 0.7,
              ease: 'power3.out',
              stagger: 0.09,
              overwrite: 'auto',
            }),
        });
      });

      // ── Tenant → Facilities diagram build-in ────────────
      // Built as a paused timeline played from `onEnter` (see the reveal note
      // above) so it can't strand mid-build below the fold.
      const diagram = document.querySelector('[data-diagram-root]');
      if (diagram) {
        const tl = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' } });
        tl.from('[data-diagram-tenant]', { y: 20, autoAlpha: 0, scale: 0.92, duration: 0.55 })
          .from(
            '[data-diagram-line]',
            { scaleY: 0, transformOrigin: 'top center', duration: 0.35, ease: 'power2.inOut' },
            '-=0.1'
          )
          .from(
            '[data-diagram-node]',
            { y: 24, autoAlpha: 0, duration: 0.55, stagger: 0.12 },
            '-=0.05'
          );
        ScrollTrigger.create({
          trigger: diagram,
          start: 'top 78%',
          once: true,
          onEnter: () => tl.play(),
        });
      }

      // ── Closing CTA ──────────────────────────────────────
      gsap.set('[data-cta]', { y: 48, autoAlpha: 0, scale: 0.97 });
      ScrollTrigger.create({
        trigger: '[data-cta]',
        start: 'top 85%',
        once: true,
        onEnter: () =>
          gsap.to('[data-cta]', {
            y: 0,
            autoAlpha: 1,
            scale: 1,
            duration: 0.9,
            ease: 'power3.out',
            overwrite: 'auto',
          }),
      });

      // Web fonts (Urbanist / Geist Mono) load after this runs and
      // change heading/text heights, which shifts every element below the fold.
      // Recompute ScrollTrigger start positions once fonts settle so reveal
      // triggers can't get stranded past their fire point (cards stuck hidden).
      document.fonts?.ready.then(() => ScrollTrigger.refresh());
    },
    { scope }
  );

  return (
    <div ref={scope} className="contents">
      {children}
    </div>
  );
}
