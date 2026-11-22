import type { ComponentProps, ReactNode } from 'react';
import type { IconType } from 'react-icons';
import {
  PiTableLight,
  PiFileTextLight,
  PiPlayCircleLight,
  PiSquaresFourLight,
  PiImageSquareLight,
  PiFolderSimpleLight,
} from 'react-icons/pi';
import { cva } from 'class-variance-authority';

import {
  Empty,
  EmptyTitle,
  EmptyHeader,
  EmptyContent,
  EmptyDescription,
} from '@/components/ui/empty';
import { cn } from '@/lib/utils';

/** The centre icon's colour, by subject; DESIGN.md holds the subject-to-tone table. */
const TONES = {
  sky: 'text-tone-sky',
  teal: 'text-chart-4',
  blue: 'text-primary',
  green: 'text-success',
  amber: 'text-tone-amber',
  violet: 'text-procedure',
  orange: 'text-tone-orange',
  danger: 'text-destructive',
  neutral: 'text-muted-foreground',
};

type EmptyStateTone = keyof typeof TONES;

const iconVariants = cva('flex shrink-0 items-center justify-center', {
  variants: {
    size: {
      sm: '[&_svg]:size-8',
      md: '[&_svg]:size-10',
      lg: '[&_svg]:size-12',
    },
  },
});

// The title sits over the faded lower rings, as the tiles fan out above it.
const orbitVariants = cva('relative mx-auto aspect-8/5 w-full', {
  variants: {
    size: {
      sm: '',
      md: '-mb-6 max-w-60',
      lg: '-mb-10 max-w-80',
    },
  },
});

/* The orbit is drawn in a 320 × 200 box centred on the icon. */
const CX = 160;
const CY = 100;
const RINGS = [44, 76, 112, 148] as const;

/**
 * Small tiles that sit on the rings, placed by angle (0° is 3 o'clock, negative is above) so each
 * one is centred on its ring's line.
 */
const SATELLITES: readonly { ring: number; angle: number; icon: IconType }[] = [
  { ring: 76, angle: -122, icon: PiFileTextLight },
  { ring: 76, angle: -38, icon: PiSquaresFourLight },
  { ring: 76, angle: 152, icon: PiFolderSimpleLight },
  { ring: 112, angle: -162, icon: PiTableLight },
  { ring: 112, angle: 166, icon: PiFileTextLight },
  { ring: 112, angle: -14, icon: PiImageSquareLight },
  { ring: 112, angle: 24, icon: PiPlayCircleLight },
];

function polar(ring: number, angle: number) {
  const radians = (angle * Math.PI) / 180;
  return { x: CX + ring * Math.cos(radians), y: CY + ring * Math.sin(radians) };
}

function EmptyStateOrbit() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 320 200"
      className="absolute inset-0 size-full overflow-visible [mask-image:radial-gradient(ellipse_closest-side_at_50%_50%,#000_55%,transparent_100%)] print:hidden"
    >
      {RINGS.map((r) => (
        <circle
          key={r}
          r={r}
          cx={CX}
          cy={CY}
          fill="none"
          className="stroke-border"
          vectorEffect="non-scaling-stroke"
        />
      ))}
      {SATELLITES.map(({ ring, angle, icon: SatelliteIcon }, index) => {
        // The further ring carries smaller tiles, so the orbit recedes.
        const tile = ring <= 76 ? 26 : 22;
        const glyph = ring <= 76 ? 14 : 12;
        const { x, y } = polar(ring, angle);

        return (
          <g key={index} data-slot="empty-state-satellite">
            <rect
              rx={tile * 0.28}
              width={tile}
              height={tile}
              x={x - tile / 2}
              y={y - tile / 2}
              className="fill-card stroke-border"
              vectorEffect="non-scaling-stroke"
            />
            <SatelliteIcon
              size={glyph}
              x={x - glyph / 2}
              y={y - glyph / 2}
              className="text-muted-foreground"
            />
          </g>
        );
      })}
    </svg>
  );
}

type EmptyStateProps = {
  /** The thing that is missing (a calendar for Appointments), as a `Pi…Duotone` icon. */
  icon: IconType;
  title: ReactNode;
  /** The subject's colour for the centre icon; the only part of the empty state that is coloured. */
  tone: EmptyStateTone;
  /** Buttons or links, in a centred row under the description. At most one primary action. */
  actions?: ReactNode;
  /** Anything else that belongs under the description. */
  children?: ReactNode;
  className?: string;
  description?: ReactNode;
  /** Draws the rings and tiles at `md` and `lg`. Off for no-permission and not-found panels. */
  orbit?: boolean;
  /** `lg` stands in for a page or tab, `md` for a main card's body, `sm` for tight spaces. */
  size?: 'sm' | 'md' | 'lg';
} & Omit<ComponentProps<'div'>, 'title' | 'children'>;

/**
 * The one empty state: a two-tone centre icon showing what is missing, a title, an optional
 * description and actions. At `md` and `lg` the icon sits in faint rings carrying small tiles;
 * `sm` drops them. The rings and the icon are decoration, hidden from screen readers and print.
 */
export function EmptyState({
  title,
  tone,
  actions,
  children,
  className,
  description,
  orbit = true,
  size = 'lg',
  icon: CentreIcon,
  ...props
}: EmptyStateProps) {
  const showOrbit = orbit && size !== 'sm';
  const icon = (
    <div
      aria-hidden="true"
      data-slot="empty-state-icon"
      className={cn(iconVariants({ size }), TONES[tone], 'print:hidden')}
    >
      <CentreIcon />
    </div>
  );

  return (
    <Empty
      data-size={size}
      data-tone={tone}
      className={cn(size === 'sm' ? 'gap-3 p-4' : 'gap-5', className)}
      {...props}
    >
      <EmptyHeader
        className={cn(
          size === 'sm' ? 'gap-1.5' : 'gap-2',
          // Without a set width the header shrinks to its text and squeezes the orbit.
          showOrbit && 'w-full'
        )}
      >
        {showOrbit ? (
          // Hidden in print as a whole, so the orbit's box leaves no blank space above the title.
          <div
            data-slot="empty-state-orbit"
            className={cn(orbitVariants({ size }), 'print:hidden')}
          >
            <EmptyStateOrbit />
            <div className="absolute inset-0 flex items-center justify-center">{icon}</div>
          </div>
        ) : (
          <div className={size === 'sm' ? 'mb-1' : 'mb-2'}>{icon}</div>
        )}
        <EmptyTitle
          className={cn('text-foreground font-semibold', size === 'lg' ? 'text-base' : 'text-sm')}
        >
          {title}
        </EmptyTitle>
        {description == null ? null : <EmptyDescription>{description}</EmptyDescription>}
      </EmptyHeader>
      {children}
      {actions == null ? null : (
        <EmptyContent className="flex-row flex-wrap justify-center gap-2">{actions}</EmptyContent>
      )}
    </Empty>
  );
}
