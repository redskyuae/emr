import Image from 'next/image';

import { brandLogos, type BrandLogoVariant } from '@/components/brand/brand-config';

type VisibleBrandLogo = Exclude<BrandLogoVariant, 'none'>;

export function LoginLogo({ variant }: { variant: VisibleBrandLogo }) {
  const logo = brandLogos[variant];

  return (
    <Image
      src={logo.wordmarkSrc}
      alt={logo.wordmarkAlt}
      width={logo.wordmarkWidth}
      height={logo.wordmarkHeight}
      loading="eager"
      className={
        variant === 'dhathri-gram' ? 'mx-auto h-auto w-44' : 'mx-auto h-auto w-full max-w-sm'
      }
    />
  );
}
