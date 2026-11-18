import { ComponentProps } from 'react';
import { cn } from '@/lib/utils';
import { PiCircleNotchLight } from 'react-icons/pi';

function Spinner({ className, ...props }: ComponentProps<'svg'>) {
  return (
    <PiCircleNotchLight
      role="status"
      aria-label="Loading"
      className={cn('size-4 animate-spin', className)}
      {...props}
    />
  );
}

export { Spinner };
