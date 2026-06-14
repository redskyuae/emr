'use client';

import { useRef } from 'react';
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
 * - [data-counter]       count-up numbers (+ optional [data-counter-suffix])
 * - [data-reveal]        fade-up on scroll
 * - [data-reveal-group]  staggered fade-up of direct children on scroll
 * - [data-diagram-*]     tenant → facilities diagram build-in
 * - [data-cta]           closing banner reveal
 */
export function MarketingAnimations({ children }: { children: React.ReactNode }) {
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

      // ── Count-up numbers ─────────────────────────────────
      gsap.utils.toArray<HTMLElement>('[data-counter]').forEach((el) => {
        const target = parseFloat(el.dataset.counter ?? '0');
        const suffix = el.dataset.counterSuffix ?? '';
        const state = { value: 0 };
        gsap.to(state, {
          value: target,
          duration: 1.6,
          ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 90%', once: true },
          onUpdate: () => {
            el.textContent = `${Math.round(state.value)}${suffix}`;
          },
        });
      });

      // ── Scroll reveals ───────────────────────────────────
      gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
        gsap.from(el, {
          y: 32,
          autoAlpha: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 82%', once: true },
        });
      });

      gsap.utils.toArray<HTMLElement>('[data-reveal-group]').forEach((group) => {
        gsap.from(group.children, {
          y: 28,
          autoAlpha: 0,
          duration: 0.7,
          ease: 'power3.out',
          stagger: 0.09,
          scrollTrigger: { trigger: group, start: 'top 82%', once: true },
        });
      });

      // ── Tenant → Facilities diagram build-in ────────────
      const diagram = document.querySelector('[data-diagram-root]');
      if (diagram) {
        const tl = gsap.timeline({
          defaults: { ease: 'power3.out' },
          scrollTrigger: { trigger: diagram, start: 'top 78%', once: true },
        });
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
      }

      // ── Closing CTA ──────────────────────────────────────
      gsap.from('[data-cta]', {
        y: 48,
        autoAlpha: 0,
        scale: 0.97,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: { trigger: '[data-cta]', start: 'top 85%', once: true },
      });
    },
    { scope }
  );

  return (
    <div ref={scope} className="contents">
      {children}
    </div>
  );
}
