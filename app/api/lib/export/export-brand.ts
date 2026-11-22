// The organization shown in the header of a downloaded report (PDF or Excel):
// the configured brand and its logo mark, read from `public/`. Without a brand,
// reports name the product instead and draw initials in place of a logo.

import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { brandLogos, getConfiguredBrandLogoVariant } from '@/components/brand/brand-config';

export type ExportBrand = {
  organizationName: string;
  organizationSubtitle: string;
  logo?: Uint8Array;
};

export async function getExportBrand(): Promise<ExportBrand> {
  const variant = getConfiguredBrandLogoVariant();

  if (variant === 'none') {
    return {
      organizationName: 'Medical EMR',
      organizationSubtitle: 'Redsky Consultancy',
    };
  }

  const configuredBrand = brandLogos[variant];
  let logo: Uint8Array | undefined;

  try {
    const logoPath = path.join(
      process.cwd(),
      'public',
      configuredBrand.markSrc.replace(/^\/+/, '')
    );
    logo = await readFile(logoPath);
  } catch {
    // The report generator falls back to organization initials if the asset is unavailable.
  }

  return {
    organizationName: configuredBrand.name,
    organizationSubtitle: configuredBrand.subtitle,
    logo,
  };
}
