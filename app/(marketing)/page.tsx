import { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  BarChart3,
  BrainCircuit,
  Building2,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  FlaskConical,
  Gauge,
  Hospital,
  KeyRound,
  Lock,
  Microscope,
  Network,
  Pill,
  Quote,
  Receipt,
  ScrollText,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  Stethoscope,
  Video,
} from 'lucide-react';

import { MarketingAnimations } from '@/components/marketing/marketing-animations';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

const REDSKY_URL = 'https://redskyconsultancy.com/';

const img = {
  heroClinician:
    'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=1100&q=80',
  aboutTeam:
    'https://images.unsplash.com/photo-1516841273335-e39b37888115?auto=format&fit=crop&w=900&q=80',
  aboutTablet:
    'https://images.unsplash.com/photo-1666886573531-48d2e3c2b684?auto=format&fit=crop&w=800&q=80',
  facHospital:
    'https://images.unsplash.com/photo-1607838720191-0d8eba3e9040?auto=format&fit=crop&w=800&q=80',
  facClinic:
    'https://images.unsplash.com/photo-1719934398679-d764c1410770?auto=format&fit=crop&w=800&q=80',
  facLab:
    'https://images.unsplash.com/photo-1518152006812-edab29b069ac?auto=format&fit=crop&w=800&q=80',
  facTeam:
    'https://images.unsplash.com/photo-1504813184591-01572f98c85f?auto=format&fit=crop&w=800&q=80',
};

const trustedGroups = [
  'Northgate Health',
  'Lakeshore Medical Group',
  'CarePoint Hospitals',
  'St. Avila Network',
  'MedAxis Clinics',
  'Cedarbrook Care',
  'Helix Diagnostics',
  'Vantage Children’s',
];

const heroStats = [
  { value: 120, suffix: '+', decimals: 0, label: 'Facilities live' },
  { value: 38, suffix: '', decimals: 0, label: 'Hospital groups' },
  { value: 11, suffix: 'M+', decimals: 0, label: 'Patient records' },
  { value: 99.99, suffix: '%', decimals: 2, label: 'Uptime SLA' },
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

const capabilities = [
  {
    icon: Network,
    title: 'Interoperability, built in',
    description:
      'Exchange records with labs, pharmacies, and national health stacks. FHIR R4, HL7 v2, DICOM, and ABDM-ready connectors ship out of the box.',
  },
  {
    icon: Activity,
    title: 'Real-time operations board',
    description:
      'Live bed occupancy, OT utilisation, and OPD queues across every facility in your group — updated to the second.',
  },
  {
    icon: Video,
    title: 'Telehealth & e-prescriptions',
    description:
      'Run video consults, capture vitals remotely, and issue digital prescriptions without ever leaving the patient chart.',
  },
  {
    icon: BarChart3,
    title: 'Insight analytics',
    description:
      'Operational, clinical, and revenue dashboards with population-health cohorts and exportable boards for leadership.',
  },
  {
    icon: Smartphone,
    title: 'Clinician mobile app',
    description:
      'Rounds, results, and approvals on iOS and Android — offline-capable, syncing the moment a clinician reconnects.',
  },
  {
    icon: Gauge,
    title: '99.99% uptime SLA',
    description:
      'Multi-region infrastructure, automated encrypted backups, and a 99.99% availability commitment your operations can trust.',
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

const facilities = [
  {
    image: img.facHospital,
    icon: Hospital,
    type: 'HOSPITAL',
    name: 'Northgate General',
    detail: '420 beds · 36 wards',
  },
  {
    image: img.facClinic,
    icon: Building2,
    type: 'CLINIC',
    name: 'Riverside Clinic',
    detail: '18 consult rooms',
  },
  {
    image: img.facLab,
    icon: Microscope,
    type: 'LABORATORY',
    name: 'Central Diagnostics',
    detail: '1,200 tests / day',
  },
  {
    image: img.facTeam,
    icon: Stethoscope,
    type: 'STAFF',
    name: 'One staff directory',
    detail: 'Roles scoped per facility',
  },
];

const testimonials = [
  {
    quote:
      'We rolled Medical EMR out across nine facilities in a single quarter. For the first time a patient’s history follows them from our clinic to the hospital to the lab without a single phone call.',
    name: 'Dr. Anaya Mehta',
    role: 'Chief Medical Officer',
    org: 'Northgate Health',
    initials: 'AM',
  },
  {
    quote:
      'The AI copilot drafts my encounter note while I’m still with the patient. I review, tweak, and sign. I’m leaving the clinic an hour earlier than I used to.',
    name: 'Dr. Marcus Bell',
    role: 'Consultant Physician',
    org: 'Lakeshore Medical Group',
    initials: 'MB',
  },
  {
    quote:
      'Tenant isolation was the deciding factor for our board. Knowing no query can cross between facilities — by design, not by policy — made the compliance review almost boring.',
    name: 'Priya Nair',
    role: 'Group IT Director',
    org: 'CarePoint Hospitals',
    initials: 'PN',
  },
  {
    quote:
      'FHIR results route straight back to the ordering clinician. Our turnaround time on diagnostics dropped by a third in the first month.',
    name: 'Dr. Sofia Almeida',
    role: 'Head of Diagnostics',
    org: 'Helix Diagnostics',
    initials: 'SA',
  },
];

const featuredTestimonial = {
  quote:
    'Medical EMR replaced four disconnected systems with one. Our administrators see every facility from a single screen, our clinicians stopped fighting the software, and Redsky’s team felt like an extension of ours throughout the rollout.',
  name: 'James Whitfield',
  role: 'Group Chief Operating Officer',
  org: 'St. Avila Network',
  initials: 'JW',
  metric: '42%',
  metricLabel: 'less admin time per clinician',
};

function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        'text-primary inline-flex items-center gap-2.5 text-xs font-semibold tracking-[0.2em] uppercase',
        className
      )}
    >
      <span className="bg-pop h-px w-7" aria-hidden="true" />
      {children}
    </p>
  );
}

function StarRating({ className }: { className?: string }) {
  return (
    <span className={className} aria-hidden="true">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className="size-4 fill-current" />
      ))}
    </span>
  );
}

export default function MarketingPage() {
  return (
    <MarketingAnimations>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="bg-accent/60 absolute -top-24 -left-24 -z-10 size-96 rounded-full blur-3xl"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,--alpha(var(--color-border)/40%)_1px,transparent_1px),linear-gradient(to_bottom,--alpha(var(--color-border)/40%)_1px,transparent_1px)] [mask-image:radial-gradient(46rem_26rem_at_30%_0%,black,transparent)] bg-[size:56px_56px]"
        />
        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 pt-14 pb-20 sm:px-6 lg:grid-cols-2 lg:pt-20">
          <div className="space-y-6">
            <Badge variant="secondary" className="text-accent-foreground gap-1.5" data-hero-item>
              <span className="bg-pop size-1.5 rounded-full" />
              Medical EMR · from Redsky Consultancy
            </Badge>
            <h1
              className="max-w-xl text-4xl leading-tight font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl"
              data-hero-item
            >
              One platform for every facility in your{' '}
              <span className="text-primary">hospital group</span>
            </h1>
            <p className="text-muted-foreground max-w-lg text-lg leading-relaxed" data-hero-item>
              Medical EMR runs your hospitals, clinics, and labs on a single API-first system —
              patients, scheduling, pharmacy, diagnostics, and billing, isolated per tenant and
              shared across your group, with an AI copilot doing the paperwork.
            </p>
            <div className="flex flex-wrap items-center gap-3" data-hero-item>
              <Button asChild size="lg" className="h-11 px-5 text-sm">
                <Link href="/signup">
                  Create your Tenant
                  <ArrowRight data-icon="inline-end" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-11 px-5 text-sm">
                <Link href="/swagger">Explore the API</Link>
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1" data-hero-item>
              <div className="flex items-center gap-2">
                <StarRating className="text-pop flex" />
                <span className="text-sm font-semibold">4.9/5</span>
              </div>
              <span className="text-muted-foreground text-sm">
                rated by clinical teams · no credit card to start
              </span>
            </div>
          </div>

          {/* Hexagon hero artwork */}
          <div className="relative" data-hero-preview>
            <div className="relative mx-auto aspect-square w-full max-w-md" data-hero-float>
              <div aria-hidden="true" className="blob-a bg-accent absolute inset-3 -z-10" />
              <div
                aria-hidden="true"
                className="text-primary/35 dot-halo absolute -inset-5 -z-10"
              />
              {/* hexagon photo with drop shadow following the clip */}
              <div className="[filter:drop-shadow(0_18px_32px_rgb(15_30_60/0.28))]">
                <div className="clip-hexagon relative aspect-square w-full">
                  <Image
                    src={img.heroClinician}
                    alt="Clinician reviewing patient records on Medical EMR"
                    fill
                    priority
                    sizes="(max-width: 1024px) 80vw, 460px"
                    className="object-cover"
                  />
                </div>
              </div>
              {/* vertex accent dots */}
              <span className="bg-primary absolute top-7 left-1/2 size-3 -translate-x-1/2 rounded-full" />
              <span className="bg-pop absolute right-0 bottom-20 size-3 rounded-full" />

              {/* floating chips */}
              <div
                className="bg-card/90 shadow-fluent-16 absolute -top-3 -left-3 flex items-center gap-2 rounded-lg border px-3 py-2 backdrop-blur"
                data-hero-chip
              >
                <span className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
                  <Sparkles className="size-3.5" />
                </span>
                <div className="text-left">
                  <p className="text-xs leading-none font-semibold">AI note drafted</p>
                  <p className="text-muted-foreground text-xs leading-none">in 4 seconds</p>
                </div>
              </div>
              <div
                className="bg-card/90 shadow-fluent-16 absolute -right-2 -bottom-2 flex items-center gap-2 rounded-lg border px-3 py-2 backdrop-blur"
                data-hero-chip
              >
                <span className="text-chart-4 flex size-6 items-center justify-center">
                  <CheckCircle2 className="size-5" />
                </span>
                <div className="text-left">
                  <p className="text-xs leading-none font-semibold">FHIR synced</p>
                  <p className="text-muted-foreground text-xs leading-none">3 facilities</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust marquee ────────────────────────────────────── */}
      <section className="bg-muted/40 border-y">
        <div className="mx-auto w-full max-w-6xl px-4 py-7 sm:px-6">
          <p className="text-muted-foreground text-center text-xs font-medium tracking-wide uppercase">
            Trusted by hospital groups, clinics, and diagnostic networks
          </p>
          <div className="relative mt-5 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
            <div className="flex w-max" data-marquee>
              {[...trustedGroups, ...trustedGroups].map((name, i) => (
                <span
                  key={`${name}-${i}`}
                  className="font-heading text-muted-foreground/80 flex shrink-0 items-center gap-2.5 pr-12 text-sm font-semibold"
                >
                  <Hospital className="text-primary/60 size-4" />
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats band ───────────────────────────────────────── */}
      <section>
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
          <div
            className="bg-card shadow-fluent-4 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border lg:grid-cols-4"
            data-reveal-group
          >
            {heroStats.map((stat) => (
              <div key={stat.label} className="bg-card px-6 py-8 text-center">
                <p
                  className="font-heading text-primary text-4xl font-bold tracking-tight sm:text-5xl"
                  data-counter={stat.value}
                  data-counter-suffix={stat.suffix}
                  data-counter-decimals={stat.decimals}
                >
                  {stat.value}
                  {stat.suffix}
                </p>
                <p className="text-muted-foreground mt-2 text-sm font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Modules (services row) ───────────────────────────── */}
      <section id="modules" className="scroll-mt-20">
        <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-2xl text-center" data-reveal>
            <Eyebrow className="justify-center">Our modules</Eyebrow>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
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
                className="group hover:border-primary/40 hover:shadow-fluent-8 relative overflow-hidden text-center transition-all hover:-translate-y-1"
              >
                <span
                  aria-hidden="true"
                  className="bg-primary absolute inset-x-0 top-0 h-1 origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100"
                />
                <CardHeader className="items-center">
                  <span className="bg-accent text-primary group-hover:bg-primary group-hover:text-primary-foreground mb-2 flex size-12 items-center justify-center rounded-xl transition-colors">
                    <module.icon className="size-5.5" />
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

      {/* ── Platform / About (image collage) ─────────────────── */}
      <section id="platform" className="bg-muted/30 scroll-mt-20 border-y">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2">
          {/* image collage */}
          <div className="relative" data-reveal>
            {/* The portrait crop is editorial artwork; no scale class expresses this ratio cleanly. */}
            <div className="blob-a shadow-fluent-16 relative ml-auto aspect-[4/5] w-4/5 overflow-hidden">
              <Image
                src={img.aboutTeam}
                alt="Care team walking through a hospital corridor"
                fill
                sizes="(max-width: 1024px) 70vw, 420px"
                className="object-cover"
              />
            </div>
            <div className="blob-b border-background shadow-fluent-16 absolute bottom-0 left-0 aspect-square w-1/2 overflow-hidden border-4">
              <Image
                src={img.aboutTablet}
                alt="Clinician reviewing results with a patient on a tablet"
                fill
                sizes="(max-width: 1024px) 40vw, 230px"
                className="object-cover"
              />
            </div>
            <div className="bg-pop text-pop-foreground shadow-fluent-8 absolute top-6 left-2 flex size-24 flex-col items-center justify-center rounded-full text-center">
              <span className="font-heading text-xl font-bold">11M+</span>
              <span className="text-xs leading-tight font-medium opacity-90">
                patient
                <br />
                records
              </span>
            </div>
            <div
              aria-hidden="true"
              className="dot-grid text-primary/25 absolute -top-3 right-4 h-16 w-24"
            />
          </div>

          {/* copy */}
          <div data-reveal>
            <Eyebrow>Why Medical EMR</Eyebrow>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
              Your whole group, one tenant. Every facility, its own world.
            </h2>
            <p className="text-muted-foreground mt-4 text-lg leading-relaxed">
              A Tenant is your hospital group. Inside it, each hospital, clinic, and lab is a
              Facility with its own staff, schedules, and operations — while patients, roles, and
              reference data stay consistent group-wide.
            </p>
            <div className="mt-8 space-y-5">
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
            <Button asChild size="lg" className="mt-8 h-11 px-5 text-sm">
              <Link href="/signup">
                Create your Tenant
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Capabilities (bento) ─────────────────────────────── */}
      <section id="capabilities" className="scroll-mt-20">
        <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
          <div className="max-w-2xl" data-reveal>
            <Eyebrow>Capabilities</Eyebrow>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
              A modern platform that does the heavy lifting
            </h2>
            <p className="text-muted-foreground mt-4 text-lg leading-relaxed">
              From ambient AI documentation to nationwide interoperability, Medical EMR brings the
              capabilities a modern health system expects — without the integration projects.
            </p>
          </div>

          {/* Featured AI copilot card */}
          <div
            className="bg-card shadow-fluent-8 mt-12 grid overflow-hidden rounded-2xl border lg:grid-cols-2"
            data-reveal
          >
            <div className="flex flex-col justify-center gap-4 p-8 sm:p-10">
              <Badge variant="secondary" className="text-accent-foreground w-fit gap-1.5">
                <Sparkles className="size-3.5" />
                AI Clinical Copilot
              </Badge>
              <h3 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
                The copilot does the paperwork. The clinician does the medicine.
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Ambient documentation drafts the encounter note while you talk to the patient,
                suggests ICD-10 codes, flags drug interactions, and summarises the chart in one tap.
                You review and sign — every word stays under clinical control.
              </p>
              <ul className="grid gap-2 pt-1 sm:grid-cols-2">
                {[
                  'Ambient note generation',
                  'ICD-10 code suggestions',
                  'Drug-interaction checks',
                  'One-tap chart summary',
                ].map((point) => (
                  <li key={point} className="flex items-center gap-2 text-sm font-medium">
                    <CheckCircle2 className="text-primary size-4 shrink-0" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>

            {/* mock copilot panel */}
            <div className="from-accent/60 relative flex items-center bg-gradient-to-br to-transparent p-8 sm:p-10">
              <div className="bg-card shadow-fluent-16 w-full overflow-hidden rounded-xl border">
                <div className="flex items-center gap-2 border-b px-4 py-2.5">
                  <BrainCircuit className="text-primary size-4" />
                  <span className="text-xs font-semibold">Copilot</span>
                  <span className="bg-accent text-accent-foreground ml-auto flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium">
                    <span className="bg-primary size-1.5 animate-pulse rounded-full" />
                    Listening
                  </span>
                </div>
                <div className="space-y-3 p-4">
                  <p className="text-muted-foreground text-xs italic">
                    “…patient reports chest tightness on exertion for three days, no radiation,
                    settles with rest…”
                  </p>
                  <Separator />
                  <div>
                    <p className="text-primary font-mono text-xs font-semibold">
                      ASSESSMENT & PLAN
                    </p>
                    <div className="mt-2 space-y-1.5 text-xs">
                      <p className="font-medium">Stable exertional angina, suspected</p>
                      <p className="text-muted-foreground">
                        ECG + troponin ordered · Cardiology referral · Commence GTN PRN
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {['I20.8', 'R07.89', 'Z01.810'].map((code) => (
                      <span
                        key={code}
                        className="bg-accent text-accent-foreground rounded-md px-2 py-0.5 font-mono text-xs"
                      >
                        {code}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* capability grid */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-reveal-group>
            {capabilities.map((capability) => (
              <Card
                key={capability.title}
                className="group hover:shadow-fluent-8 transition-all hover:-translate-y-0.5"
              >
                <CardHeader>
                  <span className="bg-accent text-primary group-hover:bg-primary group-hover:text-primary-foreground mb-2 flex size-9 items-center justify-center rounded-md transition-colors">
                    <capability.icon className="size-4.5" />
                  </span>
                  <CardTitle>{capability.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">{capability.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Facilities gallery ───────────────────────────────── */}
      <section className="bg-muted/30 border-t">
        <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-2xl text-center" data-reveal>
            <Eyebrow className="justify-center">One platform, every facility</Eyebrow>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
              From your flagship hospital to your smallest lab
            </h2>
            <p className="text-muted-foreground mt-4 text-lg leading-relaxed">
              Each facility runs its own operations while patients, roles, and records stay
              consistent across the whole group.
            </p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4" data-reveal-group>
            {facilities.map((facility) => (
              <article
                key={facility.name}
                className="group bg-card hover:shadow-fluent-8 overflow-hidden rounded-2xl border transition-all hover:-translate-y-1"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={facility.image}
                    alt={`${facility.name} — ${facility.detail}`}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 280px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="bg-pop text-pop-foreground absolute top-3 left-3 flex items-center gap-1 rounded-full px-2.5 py-1 font-mono text-xs font-semibold">
                    <facility.icon className="size-3" />
                    {facility.type}
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold">{facility.name}</h3>
                  <p className="text-muted-foreground mt-1 text-sm">{facility.detail}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Security ─────────────────────────────────────────── */}
      <section id="security" className="bg-foreground text-background dark:bg-card scroll-mt-20">
        <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-2">
            <div data-reveal>
              <Eyebrow className="text-chart-3">Security</Eyebrow>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
                Healthcare data deserves architectural guarantees
              </h2>
              <p className="mt-4 text-lg leading-relaxed opacity-70">
                Isolation isn’t a feature flag in Medical EMR — it’s the data model. Every table,
                every query, every session is tenant-scoped.
              </p>
              <div className="mt-8 grid grid-cols-3 gap-6">
                {[
                  ['100%', 'Tenant-scoped queries'],
                  ['0', 'Cross-tenant data paths'],
                  ['24/7', 'Audit coverage'],
                ].map(([value, label]) => (
                  <div key={label}>
                    <p
                      className="font-heading text-chart-3 text-3xl font-bold"
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

      {/* ── Testimonials ─────────────────────────────────────── */}
      <section id="customers" className="bg-muted/30 scroll-mt-20 border-t">
        <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
            <div className="max-w-2xl" data-reveal>
              <Eyebrow>Customers</Eyebrow>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
                Clinical teams that made the switch
              </h2>
              <p className="text-muted-foreground mt-4 text-lg leading-relaxed">
                Healthcare leaders use Medical EMR to unify their facilities and hand the paperwork
                back to the software.
              </p>
            </div>
            <div
              className="bg-card shadow-fluent-2 flex shrink-0 items-center gap-3 rounded-xl border px-4 py-3"
              data-reveal
            >
              <StarRating className="text-pop flex" />
              <div>
                <p className="text-sm font-semibold">4.9 / 5 average</p>
                <p className="text-muted-foreground text-xs">across clinical teams</p>
              </div>
            </div>
          </div>

          {/* featured testimonial */}
          <figure
            className="bg-card shadow-fluent-8 mt-12 grid overflow-hidden rounded-2xl border lg:grid-cols-2"
            data-reveal
          >
            <div className="flex flex-col gap-6 p-8 sm:p-10">
              <Quote className="text-pop size-8" aria-hidden="true" />
              <blockquote className="font-heading text-xl leading-relaxed font-medium tracking-tight text-balance sm:text-2xl">
                “{featuredTestimonial.quote}”
              </blockquote>
              <figcaption className="mt-auto flex items-center gap-3">
                <span className="bg-primary text-primary-foreground font-heading flex size-11 items-center justify-center rounded-full text-sm font-semibold">
                  {featuredTestimonial.initials}
                </span>
                <div>
                  <p className="text-sm font-semibold">{featuredTestimonial.name}</p>
                  <p className="text-muted-foreground text-sm">
                    {featuredTestimonial.role}, {featuredTestimonial.org}
                  </p>
                </div>
              </figcaption>
            </div>
            <div className="from-accent/60 flex flex-col items-center justify-center gap-2 border-t bg-gradient-to-br to-transparent p-8 text-center sm:p-10 lg:border-t-0 lg:border-l">
              <p className="font-heading text-pop text-5xl font-bold tracking-tight sm:text-6xl">
                {featuredTestimonial.metric}
              </p>
              <p className="text-muted-foreground max-w-48 text-sm font-medium">
                {featuredTestimonial.metricLabel}
              </p>
            </div>
          </figure>

          {/* testimonial grid */}
          <div className="mt-6 grid gap-4 md:grid-cols-2" data-reveal-group>
            {testimonials.map((testimonial) => (
              <figure
                key={testimonial.name}
                className="bg-card hover:shadow-fluent-8 flex flex-col gap-4 rounded-xl border p-6 transition-shadow"
              >
                <StarRating className="text-pop flex" />
                <blockquote className="leading-relaxed text-balance">
                  “{testimonial.quote}”
                </blockquote>
                <figcaption className="mt-auto flex items-center gap-3 pt-2">
                  <span className="bg-accent text-primary font-heading flex size-10 items-center justify-center rounded-full text-sm font-semibold">
                    {testimonial.initials}
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{testimonial.name}</p>
                    <p className="text-muted-foreground text-sm">
                      {testimonial.role}, {testimonial.org}
                    </p>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>

          <p className="text-muted-foreground/70 mt-6 text-center text-xs">
            Testimonials shown are illustrative placeholders and will be replaced with verified
            customer stories.
          </p>
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
            <div
              aria-hidden="true"
              className="dot-grid absolute top-6 left-6 hidden h-16 w-24 text-white/30 sm:block"
            />
            <div className="relative">
              <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-balance sm:text-4xl">
                Bring your hospital group online in an afternoon
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg opacity-80">
                Create your Tenant, add your first Facility, and invite your staff. Medical EMR
                handles the rest — and Redsky Consultancy is with you at every step.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Button
                  asChild
                  size="lg"
                  className="text-primary h-11 bg-white px-5 text-sm hover:bg-white/90"
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
                  className="text-primary-foreground hover:text-primary-foreground h-11 px-5 text-sm hover:bg-white/10"
                >
                  <a href={REDSKY_URL} target="_blank" rel="noreferrer">
                    Talk to Redsky Consultancy
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </MarketingAnimations>
  );
}
