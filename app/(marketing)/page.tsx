import Link from 'next/link';
import {
  ArrowRight,
  Building2,
  CalendarClock,
  ClipboardList,
  FlaskConical,
  Hospital,
  KeyRound,
  Lock,
  Microscope,
  Pill,
  Receipt,
  ScrollText,
  ShieldCheck,
  Stethoscope,
} from 'lucide-react';

import { MarketingAnimations } from '@/components/marketing/marketing-animations';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const trustedGroups = [
  'Northgate Health',
  'Lakeshore Medical Group',
  'CarePoint Hospitals',
  'St. Avila Network',
  'MedAxis Clinics',
];

const modules = [
  {
    icon: ClipboardList,
    title: 'Patient Registration',
    description:
      'Register patients once per tenant with demographics, identifiers, and global reference data — shared safely across every facility.',
  },
  {
    icon: CalendarClock,
    title: 'Appointments & Scheduling',
    description:
      'Facility-scoped schedules for every doctor. Slot management, walk-ins, and follow-ups without double-booking.',
  },
  {
    icon: Stethoscope,
    title: 'Clinical Documentation',
    description:
      'Structured encounter notes, diagnoses, and care plans that follow the patient across facilities in your group.',
  },
  {
    icon: Pill,
    title: 'Pharmacy & Orders',
    description:
      'Medication orders with formulary control per facility, dispensing workflows, and stock visibility.',
  },
  {
    icon: FlaskConical,
    title: 'Labs & Diagnostics',
    description:
      'Order tests at any facility, route to your lab units, and return results to the ordering clinician automatically.',
  },
  {
    icon: Receipt,
    title: 'Billing & Claims',
    description:
      'Tenant-configured tariffs, facility-level invoicing, and clean claim exports for every payer you work with.',
  },
];

const securityFeatures = [
  {
    icon: Lock,
    title: 'Row-level tenant isolation',
    description:
      'Every record is scoped to your tenant at the database layer. No query crosses tenant boundaries — by architecture, not by convention.',
  },
  {
    icon: KeyRound,
    title: 'Roles & Permissions',
    description:
      'A system-wide permission catalogue with tenant-scoped roles. Tenant Admins decide exactly who can do what, per facility.',
  },
  {
    icon: ScrollText,
    title: 'Complete audit trails',
    description:
      'Every clinical and administrative action is attributable to a user, a facility, and a point in time.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure by default',
    description:
      'Session-based authentication, encrypted transport, and an API-first design reviewed against healthcare data standards.',
  },
];

const facilityNodes = [
  { icon: Hospital, name: 'Northgate General', type: 'HOSPITAL', detail: '420 beds · 36 wards' },
  { icon: Building2, name: 'Riverside Clinic', type: 'CLINIC', detail: '18 consult rooms' },
  { icon: Microscope, name: 'Central Diagnostics', type: 'LAB', detail: '1,200 tests / day' },
];

function HeroPreview() {
  return (
    <div className="relative">
      <div
        aria-hidden="true"
        className="from-primary/15 via-accent absolute -inset-8 rounded-3xl bg-gradient-to-tr to-transparent blur-2xl"
      />
      <div
        className="bg-card shadow-fluent-28 relative overflow-hidden rounded-xl border"
        data-hero-float
      >
        {/* window chrome */}
        <div className="bg-muted/60 flex items-center gap-2 border-b px-4 py-2.5">
          <span className="bg-border size-2.5 rounded-full" />
          <span className="bg-border size-2.5 rounded-full" />
          <span className="bg-border size-2.5 rounded-full" />
          <span className="bg-background text-muted-foreground ml-3 rounded-md px-2.5 py-0.5 font-mono text-[10px]">
            northgate.meridian-emr.com
          </span>
        </div>
        <div className="grid grid-cols-[140px_1fr] text-left">
          {/* sidebar */}
          <div className="bg-sidebar space-y-1 border-r p-3 text-[11px]">
            <p className="text-muted-foreground px-2 pb-1 font-semibold">NORTHGATE HEALTH</p>
            {['Dashboard', 'Patients', 'Appointments', 'Pharmacy', 'Labs', 'Billing'].map(
              (item, i) => (
                <p
                  key={item}
                  className={
                    i === 0
                      ? 'bg-accent text-accent-foreground rounded-md px-2 py-1 font-medium'
                      : 'text-muted-foreground rounded-md px-2 py-1'
                  }
                >
                  {item}
                </p>
              )
            )}
          </div>
          {/* main panel */}
          <div className="space-y-3 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold">Today at Northgate General</p>
              <span className="bg-accent text-accent-foreground rounded-full px-2 py-0.5 text-[10px] font-medium">
                3 facilities
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 184, suffix: '', label: 'Appointments today' },
                { value: 42, suffix: '', label: 'Admissions' },
                { value: 97, suffix: '%', label: 'Beds reporting' },
              ].map((stat) => (
                <div key={stat.label} className="bg-background rounded-lg border p-2.5">
                  <p
                    className="font-heading text-primary text-lg font-semibold"
                    data-counter={stat.value}
                    data-counter-suffix={stat.suffix}
                  >
                    {stat.value}
                    {stat.suffix}
                  </p>
                  <p className="text-muted-foreground text-[10px]">{stat.label}</p>
                </div>
              ))}
            </div>
            <div className="bg-background space-y-1.5 rounded-lg border p-2.5">
              {[
                ['09:20', 'A. Sharma — Cardiology follow-up', 'Dr. Menon'],
                ['09:45', 'L. Fernandes — New OPD visit', 'Dr. Iyer'],
                ['10:10', 'R. Gupta — Lab review', 'Dr. Menon'],
              ].map(([time, patient, doctor]) => (
                <div key={patient} className="flex items-center gap-2 text-[10px]">
                  <span className="text-muted-foreground font-mono">{time}</span>
                  <span className="bg-primary h-1 w-1 rounded-full" />
                  <span className="flex-1 truncate font-medium">{patient}</span>
                  <span className="text-muted-foreground hidden sm:block">{doctor}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MarketingPage() {
  return (
    <MarketingAnimations>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[radial-gradient(60rem_30rem_at_70%_-10%,--alpha(var(--color-primary)/8%),transparent),radial-gradient(40rem_20rem_at_0%_20%,--alpha(var(--color-accent)/60%),transparent)]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,--alpha(var(--color-border)/40%)_1px,transparent_1px),linear-gradient(to_bottom,--alpha(var(--color-border)/40%)_1px,transparent_1px)] [mask-image:radial-gradient(50rem_28rem_at_50%_0%,black,transparent)] bg-[size:56px_56px]"
        />
        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 pt-16 pb-20 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pt-24">
          <div className="space-y-6">
            <Badge variant="secondary" className="text-accent-foreground gap-1.5" data-hero-item>
              <span className="bg-primary size-1.5 rounded-full" />
              Multi-tenant by design
            </Badge>
            <h1
              className="max-w-xl text-4xl leading-[1.08] font-semibold tracking-tight text-balance sm:text-5xl"
              data-hero-item
            >
              One platform for every facility in your{' '}
              <span className="text-primary">hospital group</span>
            </h1>
            <p className="text-muted-foreground max-w-lg text-lg leading-relaxed" data-hero-item>
              Meridian runs your hospitals, clinics, and labs on a single API-first system —
              patients, scheduling, pharmacy, diagnostics, and billing, isolated per tenant and
              shared across your group.
            </p>
            <div className="flex flex-wrap items-center gap-3" data-hero-item>
              <Button asChild size="lg" className="h-10 px-5 text-[15px]">
                <Link href="/signup">
                  Create your Tenant
                  <ArrowRight data-icon="inline-end" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-10 px-5 text-[15px]">
                <Link href="/swagger">Explore the API</Link>
              </Button>
            </div>
            <p className="text-muted-foreground text-sm" data-hero-item>
              Free to start · No credit card · Your data stays yours
            </p>
          </div>
          <div data-hero-preview>
            <HeroPreview />
          </div>
        </div>
      </section>

      {/* ── Trust strip ──────────────────────────────────────── */}
      <section className="bg-muted/40 border-y">
        <div
          className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-4 py-6 sm:px-6"
          data-reveal-group
        >
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Trusted by hospital groups
          </p>
          {trustedGroups.map((name) => (
            <span
              key={name}
              className="font-heading text-muted-foreground/80 text-sm font-semibold"
            >
              {name}
            </span>
          ))}
        </div>
      </section>

      {/* ── Platform / multi-tenancy ─────────────────────────── */}
      <section id="platform" className="scroll-mt-20">
        <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
          <div className="max-w-2xl" data-reveal>
            <p className="text-primary text-sm font-semibold tracking-wide uppercase">Platform</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Your whole group, one tenant. Every facility, its own world.
            </h2>
            <p className="text-muted-foreground mt-4 text-lg leading-relaxed">
              A Tenant is your hospital group. Inside it, each hospital, clinic, and lab is a
              Facility with its own staff, schedules, and operations — while patients, roles, and
              reference data stay consistent group-wide.
            </p>
          </div>

          <div className="mt-12 grid items-start gap-8 lg:grid-cols-[1fr_1.2fr]">
            <div className="space-y-5" data-reveal-group>
              {[
                {
                  title: 'Tenant-level control',
                  description:
                    'Tenant Owners create the group; Tenant Admins manage facilities, masters, and staff provisioning from one place.',
                },
                {
                  title: 'Facility-level operation',
                  description:
                    'Staff and clinical events are always scoped to a facility. A receptionist in one clinic never sees another ward’s queue.',
                },
                {
                  title: 'Group-level continuity',
                  description:
                    'Patients are registered once per tenant. Records follow them from your clinic to your hospital to your lab.',
                },
              ].map((item, i) => (
                <div key={item.title} className="flex gap-4">
                  <span className="bg-primary text-primary-foreground shadow-fluent-2 flex size-7 shrink-0 items-center justify-center rounded-md font-mono text-xs font-semibold">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* tenant → facilities diagram */}
            <div
              className="from-accent/50 rounded-xl border bg-gradient-to-b to-transparent p-6 sm:p-8"
              data-diagram-root
            >
              <div
                className="bg-card shadow-fluent-8 mx-auto flex w-fit items-center gap-3 rounded-lg border px-4 py-3"
                data-diagram-tenant
              >
                <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-md">
                  <Building2 className="size-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold">Northgate Health</p>
                  <p className="text-muted-foreground text-xs">Tenant · northgate</p>
                </div>
              </div>
              <div
                aria-hidden="true"
                className="from-primary/60 to-border mx-auto h-6 w-px bg-gradient-to-b"
                data-diagram-line
              />
              <div className="grid gap-3 sm:grid-cols-3">
                {facilityNodes.map((facility) => (
                  <div
                    key={facility.name}
                    className="bg-card shadow-fluent-2 hover:shadow-fluent-8 rounded-lg border p-3 transition-shadow"
                    data-diagram-node
                  >
                    <facility.icon className="text-primary size-4" />
                    <p className="mt-2 text-sm font-semibold">{facility.name}</p>
                    <p className="text-primary font-mono text-[10px]">{facility.type}</p>
                    <Separator className="my-2" />
                    <p className="text-muted-foreground text-xs">{facility.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Modules ──────────────────────────────────────────── */}
      <section id="modules" className="bg-muted/30 scroll-mt-20 border-t">
        <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
          <div className="max-w-2xl" data-reveal>
            <p className="text-primary text-sm font-semibold tracking-wide uppercase">Modules</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Everything a facility runs on, out of the box
            </h2>
            <p className="text-muted-foreground mt-4 text-lg leading-relaxed">
              Each module is an API-first building block. Use the whole suite or integrate the
              pieces you need.
            </p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-reveal-group>
            {modules.map((module) => (
              <Card
                key={module.title}
                className="group hover:shadow-fluent-8 transition-all hover:-translate-y-0.5"
              >
                <CardHeader>
                  <span className="bg-accent text-accent-foreground group-hover:bg-primary group-hover:text-primary-foreground mb-2 flex size-9 items-center justify-center rounded-md transition-colors">
                    <module.icon className="size-4.5" />
                  </span>
                  <CardTitle>{module.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">{module.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Security ─────────────────────────────────────────── */}
      <section id="security" className="bg-foreground text-background dark:bg-card scroll-mt-20">
        <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr]">
            <div data-reveal>
              <p className="text-chart-3 text-sm font-semibold tracking-wide uppercase">Security</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                Healthcare data deserves architectural guarantees
              </h2>
              <p className="mt-4 text-lg leading-relaxed opacity-70">
                Isolation isn’t a feature flag in Meridian — it’s the data model. Every table, every
                query, every session is tenant-scoped.
              </p>
              <div className="mt-8 grid grid-cols-3 gap-6">
                {[
                  ['100%', 'Tenant-scoped queries'],
                  ['0', 'Cross-tenant data paths'],
                  ['24/7', 'Audit coverage'],
                ].map(([value, label]) => (
                  <div key={label}>
                    <p
                      className="font-heading text-chart-3 text-3xl font-semibold"
                      data-counter={value === '100%' ? 100 : undefined}
                      data-counter-suffix={value === '100%' ? '%' : undefined}
                    >
                      {value}
                    </p>
                    <p className="mt-1 text-sm opacity-60">{label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2" data-reveal-group>
              {securityFeatures.map((feature) => (
                <div
                  key={feature.title}
                  className="border-background/15 bg-background/5 hover:bg-background/10 rounded-xl border p-5 backdrop-blur transition-colors"
                >
                  <feature.icon className="text-chart-3 size-5" />
                  <h3 className="mt-3 font-semibold">{feature.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed opacity-70">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section>
        <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
          <div
            className="bg-primary text-primary-foreground shadow-fluent-28 relative overflow-hidden rounded-2xl px-6 py-14 text-center sm:px-12"
            data-cta
          >
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-[radial-gradient(40rem_18rem_at_80%_-20%,rgb(255_255_255/0.18),transparent),radial-gradient(30rem_14rem_at_10%_120%,rgb(255_255_255/0.1),transparent)]"
            />
            <div className="relative">
              <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                Bring your hospital group online in an afternoon
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg opacity-80">
                Create your Tenant, add your first Facility, and invite your staff. The platform
                handles the rest.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Button
                  asChild
                  size="lg"
                  className="text-primary h-10 bg-white px-5 text-[15px] hover:bg-white/90"
                >
                  <Link href="/signup">
                    Get started free
                    <ArrowRight data-icon="inline-end" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="ghost"
                  className="text-primary-foreground hover:text-primary-foreground h-10 px-5 text-[15px] hover:bg-white/10"
                >
                  <Link href="/login">Sign in to your workspace</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </MarketingAnimations>
  );
}
