'use client';

import { CSSProperties } from 'react';
import { useTheme } from 'next-themes';
import { Toaster as Sonner, type ToasterProps } from 'sonner';
import { CiCircleCheck, CiCircleInfo, CiCircleRemove, CiWarning } from 'react-icons/ci';
import { PiCircleNotchLight } from 'react-icons/pi';

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      icons={{
        success: <CiCircleCheck className="size-4" />,
        info: <CiCircleInfo className="size-4" />,
        warning: <CiWarning className="size-4" />,
        error: <CiCircleRemove className="size-4" />,
        loading: <PiCircleNotchLight className="size-4 animate-spin" />,
      }}
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
          '--border-radius': 'var(--radius)',
        } as CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: 'cn-toast',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
