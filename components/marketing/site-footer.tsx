import Link from 'next/link';

import { Logo } from '@/components/brand/logo';

const footerColumns = [
  {
    heading: 'Platform',
    links: [
      { href: '#platform', label: 'Multi-tenant architecture' },
      { href: '#modules', label: 'Clinical modules' },
      { href: '#security', label: 'Security & isolation' },
      { href: '/swagger', label: 'API reference' },
    ],
  },
  {
    heading: 'For teams',
    links: [
      { href: '/signup', label: 'Hospital groups' },
      { href: '/signup', label: 'Clinics & day-care units' },
      { href: '/signup', label: 'Diagnostic labs' },
      { href: '/login', label: 'Staff sign in' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { href: '#', label: 'About' },
      { href: '#', label: 'Contact' },
      { href: '#', label: 'Privacy' },
      { href: '#', label: 'Terms' },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="bg-muted/40 border-t">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="space-y-3">
          <Logo />
          <p className="text-muted-foreground max-w-xs text-sm">
            The operating system for hospital groups. Every facility, one platform, complete tenant
            isolation.
          </p>
        </div>
        {footerColumns.map((column) => (
          <div key={column.heading}>
            <h3 className="text-sm font-semibold">{column.heading}</h3>
            <ul className="mt-3 space-y-2">
              {column.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t">
        <div className="text-muted-foreground mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-5 text-xs sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© {new Date().getFullYear()} Meridian EMR. All rights reserved.</p>
          <p>Built for healthcare. Designed for scale.</p>
        </div>
      </div>
    </footer>
  );
}
