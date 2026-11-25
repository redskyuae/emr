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
  const shareImages = variant === 'none' ? undefined : [{ url: icon, width: 1254, height: 1254 }];

  // Link previews (WhatsApp, Facebook, LinkedIn, X, Telegram, Slack, iMessage…) read these.
  const title = 'Medical EMR — One platform for every facility in your hospital group';
  const description =
    'Medical EMR is an API-first, multi-tenant hospital management platform. Run every hospital, clinic, and lab in your group on one secure, tenant-isolated system — with AI-assisted documentation, FHIR/HL7 interoperability, and real-time operations.';

  return {
    title: { default: title, template: '%s · Medical EMR' },
    description,
    applicationName: 'Medical EMR',
    icons: { icon },
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: 'Medical EMR',
      images: shareImages,
    },
    twitter: { card: 'summary', title, description, images: shareImages },
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
    <html
      lang="en"
      className={`${geistMono.variable} h-full antialiased`}
      data-scroll-behavior="smooth"
    >
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
