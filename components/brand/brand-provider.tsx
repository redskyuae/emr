'use client';

import { createContext, ReactNode, useContext } from 'react';

import type { BrandLogoVariant } from '@/components/brand/brand-config';

const BrandContext = createContext<BrandLogoVariant>('none');

export function BrandProvider({
  variant,
  children,
}: {
  variant: BrandLogoVariant;
  children: ReactNode;
}) {
  return <BrandContext.Provider value={variant}>{children}</BrandContext.Provider>;
}

export function useBrandLogoVariant() {
  return useContext(BrandContext);
}
