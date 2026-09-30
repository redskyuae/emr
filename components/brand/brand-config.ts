export type BrandLogoVariant = 'dhathri-ayurvedic' | 'dhathri-gram' | 'none';

export const brandLogos = {
  'dhathri-ayurvedic': {
    name: 'Dhathri Ayurvedic',
    subtitle: 'Medical Centre',
    wordmarkSrc: '/brand/dhathri-ayurvedic-transparent.png',
    wordmarkAlt: 'Dhathri Ayurvedic Medical Centre',
    wordmarkWidth: 2036,
    wordmarkHeight: 772,
    markSrc: '/brand/dhathri-ayurvedic-mark.png',
  },
  'dhathri-gram': {
    name: 'Dhathri Gram',
    subtitle: 'Ayurveda Medical Centre',
    wordmarkSrc: '/brand/dhathri-gram-transparent.png',
    wordmarkAlt: 'Dhathri Gram Ayurveda Medical Centre',
    wordmarkWidth: 1313,
    wordmarkHeight: 1198,
    markSrc: '/brand/dhathri-gram-mark.png',
  },
} as const;

export function resolveBrandLogoVariant(value: string | undefined): BrandLogoVariant {
  if (value === 'dhathri-gram' || value === 'none') {
    return value;
  }

  return 'dhathri-ayurvedic';
}

export function getConfiguredBrandLogoVariant(): BrandLogoVariant {
  return resolveBrandLogoVariant(process.env.LOGIN_LOGO_VARIANT);
}
