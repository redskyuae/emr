import type { Metadata } from 'next';
import { Geist_Mono, Public_Sans, Schibsted_Grotesk } from 'next/font/google';
import './globals.css';

const publicSans = Public_Sans({
  variable: '--font-public-sans',
  subsets: ['latin'],
});

const schibstedGrotesk = Schibsted_Grotesk({
  variable: '--font-schibsted-grotesk',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'Meridian EMR — One platform for every facility in your hospital group',
    template: '%s · Meridian EMR',
  },
  description:
    'API-first, multi-tenant hospital management. Run every hospital, clinic, and lab in your group on one secure, tenant-isolated platform.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${publicSans.variable} ${schibstedGrotesk.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
