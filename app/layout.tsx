import { ReactNode } from 'react';
import { preconnect } from 'react-dom';
import type { Metadata } from 'next';
import { Geist_Mono } from 'next/font/google';

import { brandLogos, getConfiguredBrandLogoVariant } from '@/components/brand/brand-config';
import { BrandProvider } from '@/components/brand/brand-provider';
import { AnalyticsProvider } from '@/components/analytics/analytics-provider';
import { QueryProvider } from '@/components/providers/query-provider';
import { Toaster } from '@/components/ui/sonner';
import { getClientAnalyticsSettings, getSidebarMode } from '@/lib/analytics/analytics-settings';
import './globals.css';

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export function generateMetadata(): Metadata {
  const variant = getConfiguredBrandLogoVariant();
  const icon = variant === 'none' ? '/brand/medical-emr.ico' : brandLogos[variant].markSrc;

  return {
    title: {
      default:
        'Medical EMR from Redsky Consultancy — One platform for every facility in your hospital group',
      template: '%s · Medical EMR',
    },
    description:
      'Medical EMR by Redsky Consultancy is an API-first, multi-tenant hospital management platform. Run every hospital, clinic, and lab in your group on one secure, tenant-isolated system — with AI-assisted documentation, FHIR/HL7 interoperability, and real-time operations.',
    applicationName: 'Medical EMR',
    authors: [{ name: 'Redsky Consultancy', url: 'https://redskyconsultancy.com/' }],
    icons: { icon },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const variant = getConfiguredBrandLogoVariant();

  // Satoshi's font file comes from Fontshare's CDN (see the @font-face in globals.css).
  preconnect('https://cdn.fontshare.com', { crossOrigin: 'anonymous' });

  return (
    <html lang="en" className={`${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <BrandProvider variant={variant}>
          <AnalyticsProvider settings={getClientAnalyticsSettings()} sidebarMode={getSidebarMode()}>
            <QueryProvider>
              {children}
              <Toaster />
            </QueryProvider>
          </AnalyticsProvider>
        </BrandProvider>
      </body>
    </html>
  );
}
