import Link from 'next/link';
import { AtSign, Clock, Globe, Mail, MapPin, Phone } from 'lucide-react';

import { Logo } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';

const REDSKY_URL = 'https://redskyconsultancy.com/';

const navLinks = [
  { href: '#platform', label: 'Platform' },
  { href: '#capabilities', label: 'Capabilities' },
  { href: '#modules', label: 'Modules' },
  { href: '#security', label: 'Security' },
  { href: '#customers', label: 'Customers' },
  { href: '/swagger', label: 'API Docs' },
];

export function SiteHeader() {
  return (
    <div className="flex flex-col">
      {/* ── Top utility bar ─────────────────────────────────── */}
      <div className="border-border/60 bg-background text-muted-foreground hidden border-b md:block">
        <div className="mx-auto flex h-9 w-full max-w-6xl items-center justify-between gap-6 px-4 text-xs sm:px-6">
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-1.5">
              <MapPin className="size-3.5" />
              Redsky Consultancy, Dubai · UAE
            </span>
            <a
              href="mailto:hello@redskyconsultancy.com"
              className="hover:text-foreground flex items-center gap-1.5 transition-colors"
            >
              <Mail className="size-3.5" />
              hello@redskyconsultancy.com
            </a>
          </div>
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-1.5">
              <Clock className="size-3.5" />
              Support 24/7 · 365 days
            </span>
            <span className="flex items-center gap-3">
              <Link
                href="#"
                aria-label="Social profile"
                className="hover:text-foreground transition-colors"
              >
                <AtSign className="size-3.5" />
              </Link>
              <a
                href={REDSKY_URL}
                target="_blank"
                rel="noreferrer"
                aria-label="Redsky Consultancy website"
                className="hover:text-foreground transition-colors"
              >
                <Globe className="size-3.5" />
              </a>
            </span>
          </div>
        </div>
      </div>

      {/* ── Main nav (sticky) ───────────────────────────────── */}
      <header className="acrylic border-border/60 sticky top-0 z-50 border-b">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
          <div className="flex items-center gap-8">
            <Logo showCompany />
            <nav className="hidden items-center gap-1 lg:flex">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild className="text-muted-foreground hidden sm:inline-flex">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild className="gap-1.5">
              <Link href="/signup">
                <Phone className="size-4" />
                Get a demo
              </Link>
            </Button>
          </div>
        </div>
      </header>
    </div>
  );
}
