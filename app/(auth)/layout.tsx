import Link from 'next/link';
import { Building2, Hospital, Microscope, ShieldCheck } from 'lucide-react';

import { Logo } from '@/components/brand/logo';
import { ReactNode } from 'react';

const brandPoints = [
  {
    icon: Building2,
    title: 'One Workspace, every Facility',
    description: 'Hospitals, clinics, and labs under a single hospital group.',
  },
  {
    icon: ShieldCheck,
    title: 'Isolated by architecture',
    description: 'Workspace-level isolation on every table, every query.',
  },
];

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-full flex-1 lg:grid-cols-2">
      {/* ── Brand panel ──────────────────────────────────────── */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-[oklch(0.24_0.07_256)] p-10 text-white lg:flex">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(50rem_30rem_at_85%_-10%,oklch(0.45_0.12_252/0.55),transparent),radial-gradient(40rem_24rem_at_-10%_110%,oklch(0.35_0.1_254/0.6),transparent)]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(to_right,rgb(255_255_255/0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgb(255_255_255/0.05)_1px,transparent_1px)] bg-[size:48px_48px]"
        />

        <div className="relative">
          <Logo inverted className="text-white" />
        </div>

        <div className="relative max-w-md space-y-8">
          <blockquote className="space-y-3">
            <p className="font-heading text-2xl leading-snug font-medium text-balance">
              “We moved three hospitals and eleven clinics onto one system. Our front desks stopped
              juggling logins the same week.”
            </p>
            <footer className="text-sm text-white/60">
              Director of Operations · Northgate Health
            </footer>
          </blockquote>

          <div className="space-y-4">
            {brandPoints.map((point) => (
              <div key={point.title} className="flex items-start gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-white/10">
                  <point.icon className="size-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold">{point.title}</p>
                  <p className="text-sm text-white/60">{point.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center gap-6 text-xs text-white/50">
          <span className="flex items-center gap-1.5">
            <Hospital className="size-3.5" /> Hospitals
          </span>
          <span className="flex items-center gap-1.5">
            <Building2 className="size-3.5" /> Clinics
          </span>
          <span className="flex items-center gap-1.5">
            <Microscope className="size-3.5" /> Labs
          </span>
        </div>
      </div>

      {/* ── Form panel ───────────────────────────────────────── */}
      <div className="relative flex flex-col">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[radial-gradient(36rem_20rem_at_100%_0%,--alpha(var(--color-accent)/55%),transparent)]"
        />
        <div className="flex items-center justify-between p-6 lg:justify-end">
          <Logo className="lg:hidden" />
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
          >
            ← Back to site
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center px-6 pb-16">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </div>
    </div>
  );
}
