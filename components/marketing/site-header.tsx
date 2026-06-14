import Link from 'next/link';

import { Logo } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';

const navLinks = [
  { href: '#platform', label: 'Platform' },
  { href: '#modules', label: 'Modules' },
  { href: '#security', label: 'Security' },
  { href: '/swagger', label: 'API Docs' },
];

export function SiteHeader() {
  return (
    <header className="acrylic border-border/60 sticky top-0 z-50 border-b">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex">
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
          <Button variant="ghost" asChild className="text-muted-foreground">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Get started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
