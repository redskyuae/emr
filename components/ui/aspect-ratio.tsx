'use client';

import { ComponentProps } from 'react';
import { AspectRatio as AspectRatioPrimitive } from 'radix-ui';

function AspectRatio({ ...props }: ComponentProps<typeof AspectRatioPrimitive.Root>) {
  return <AspectRatioPrimitive.Root data-slot="aspect-ratio" {...props} />;
}

export { AspectRatio };
