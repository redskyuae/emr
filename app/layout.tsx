import { ReactNode } from 'react';
import type { Metadata } from 'next';
import { Geist_Mono, Public_Sans, Schibsted_Grotesk } from 'next/font/google';

import { QueryProvider } from '@/components/providers/query-provider';
import { Toaster } from '@/components/ui/sonner';
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
    default:
      'Medical EMR from Redsky Consultancy — One platform for every facility in your hospital group',
    template: '%s · Medical EMR',
  },
  description:
    'Medical EMR by Redsky Consultancy is an API-first, multi-tenant hospital management platform. Run every hospital, clinic, and lab in your group on one secure, tenant-isolated system — with AI-assisted documentation, FHIR/HL7 interoperability, and real-time operations.',
  applicationName: 'Medical EMR',
  authors: [{ name: 'Redsky Consultancy', url: 'https://redskyconsultancy.com/' }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${publicSans.variable} ${schibstedGrotesk.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <QueryProvider>
          {children}
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  );
}
